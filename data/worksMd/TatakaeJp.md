<a class="btn" href="https://github.com/Kiliken/TatakaeIkikaere">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/githubIcon.svg#icon"></use>
  </svg>
  <span>GitHub</span>
</a>

<a class="btn" href="https://github.com/Kiliken/TatakaeIkikaere/releases">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/downloadIcon.svg#icon"></use>
  </svg>
  <span>Download</span>
</a>


# 霊界リベンジ

霊界リベンジは、Unityで開発したPC・Android向けオンライン対戦ゲームです。

プレイヤーは復讐心を持つ霊となり、能力を選択して対戦を行います。
本作では、相手の姿が攻撃成功まで表示されない独自のゲームシステムを採用しており、情報管理と行動予測を重視したリアルタイム対戦を実現しています。

私は主にオンライン対戦機能の開発を担当しました。
Unity側ではWeb API通信によるゲーム状態の同期システムを実装し、サーバー側ではPHPによるプレイヤー状態管理、セッション管理、ターン同期処理を開発しました。

クライアント間で直接通信を行わず、サーバーを介してゲーム状態を共有する構成により、2人のプレイヤー間で安定した対戦同期を実現しています。

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=tUoeGtv7pbU&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>


## 担当部分・実装実績


### Client-Side Networking Layer

クライアント（Unity）側における通信管理の基盤クラスです。Web APIへのエンドポイントの定義や、サーバー側で何らかのエラーが発生した際のエディタ強制停止（アサート機能）を実装しています。

通信のオーバーヘッドを最小限に抑えるため、JSONやXMLなどの重いデータフォーマットは使用せず、独自の「固定長キャラクタ配列（NetStrings）」による通信プロトコルを採用しました。受信した文字列のタイプ（h, s, r, f）に応じてビット・文字単位で愚直かつ高速にパースし、軽量なデータ構造（NetData）へと即座に変換・復元する仕組みを構築しています。

```csharp
/*
NETSTRINGS

type s:
    0(ServerStatus)

type r:
    0(ServerStatus)0(waitFlag)0000(testString)

*/

public static class NetManager
{
    //SERVER NAME
    public static readonly string SERVER = "http://baolotest.altervista.org/TTK/";

    //USE THIS

    public static readonly string getGameStart = $"{SERVER}getGameStart.php?";

    public static readonly string sendGameStart = $"{SERVER}sendGameStart.php?";

    public static readonly string sendData = $"{SERVER}sendData.php?";

    public static readonly string getData = $"{SERVER}getData.php?";

    public static readonly string checkFlag = $"{SERVER}checkFlag.php?";

    public static readonly string deleteSession = $"{SERVER}destroySession.php?";


    //SERVER ASSERT
    public static void ASSERT(char status)
    {
        if (status == '1')
        {
            Debug.LogError("SERVER SIDE ERROR! CHECK PHP SIDE");

            #if UNITY_EDITOR
            if (EditorApplication.isPlaying)
            {
                UnityEditor.EditorApplication.isPlaying = false;
            }
            #endif


            return;
        }
    }

    public static NetData RetriveData(string str, char type)
    {
        NetData data = new NetData();
        char[] converter;
        switch (type)
        {
            case 'h':
                converter = str.ToCharArray(0, str.Length);
                Debug.Log(str);

                data.sts = converter[0];
                data.p2Hp = int.Parse(new string(converter, 1, 3));
                data.p2Atk = int.Parse(new string(converter, 4, 3));
                data.p2Spd = int.Parse(new string(converter, 7, 3));
                data.p1Spd = int.Parse(new string(converter, 10, 3));
                break;
            case 's':
                converter = str.ToCharArray(0, str.Length);
                Debug.Log(str);

                data.sts = converter[0];

                break;
            case 'r':
                converter = str.ToCharArray(0, str.Length);
                Debug.Log(str);

                data.sts = converter[0];
                data.p2Pos.x = int.Parse(new string(converter, 2, 1));
                data.p2Pos.y = int.Parse(new string(converter, 5, 1));
                data.p2UsedAtk = int.Parse(new string(converter, 7, 1));
                data.p2AtkCenter.x = int.Parse(new string(converter, 9, 1));
                data.p2AtkCenter.y = int.Parse(new string(converter, 12, 1));
                break;
            case 'f':
                converter = str.ToCharArray(0, str.Length);
                Debug.Log(str);

                data.sts = converter[0];
                data.flag = converter[1];
                break;
            default:
                Debug.LogError("INVALID TYPE");
                return null;
        }
        return data;
    }
}


public class NetData
{

    //Server Stuff
    public char sts;
    public char flag;

    public int p1Spd;


    //Plyaer 2
    public int p2Hp;
    public int p2Atk;
    public int p2Spd;
    public Vector2Int p2Pos;
    public int p2UsedAtk;
    public Vector2Int p2AtkCenter;
}
```

### Multiplayer Synchronization Flow

コルーチンを用いて、対戦中のゲーム状態の送信・取得・セッション削除などを非同期で制御するネットワークシーケンス群です。

プレイヤーの行動（移動先、使用スキル、攻撃座標など）の同期要求を UnityWebRequest でサーバーに送信し、双方が送信完了したタイミング（サーバー側のフラグが条件を満たした時）に次のターンのデータを取得してゲーム進行（executeCurrentAction）へ繋げています。メインスレッドをブロックしない通信設計により、UIのフリーズを防ぎ、Web APIベースでありながら破綻のない対戦同期フローを実現しました。

```csharp
IEnumerator RetreiveInitialData(string path)
{



    UnityWebRequest uwr = UnityWebRequest.Get($"{NetManager.getGameStart}{path}");

    yield return uwr.SendWebRequest();

    if (uwr.result != UnityWebRequest.Result.Success)
    {
        Debug.LogError("ERROR: File not found");
        //RETURN TO MAIN MENU
    }
    else
    {


        if (firstData)
        {
            string results = uwr.downloadHandler.text;
            NetData data = NetManager.RetriveData(results, 'h');

            NetManager.ASSERT(data.sts);

            player2maxHP = data.p2Hp;
            player2curHP = data.p2Hp;
            player2Atk = data.p2Atk;
            player2Speed = data.p2Spd;
            player1Speed = data.p1Spd;

            firstData = false;

            fadeInPanel.SetActive(false);


            dataSent = false;
        }

    }

    uwr.Dispose();
}

IEnumerator NetCheckFlag(string path)
{
    UnityWebRequest uwr = UnityWebRequest.Get($"{NetManager.checkFlag}{path}");


    yield return uwr.SendWebRequest();

    if (uwr.result != UnityWebRequest.Result.Success)
    {
        Debug.LogError("ERROR: File not found");
        //RETURN TO MAIN MENU
    }
    else
    {
        string results = uwr.downloadHandler.text;
        NetData data = NetManager.RetriveData(results, 'f');

        NetManager.ASSERT(data.sts);

        if (data.flag == '2' || data.flag == '3')
        {
            if (firstData)
            {
                StartCoroutine(RetreiveInitialData($"id={gameSession}&side={playerSide}"));
            }
            else
            {
                StartCoroutine(RetreiveNormalData($"id={gameSession}&side={playerSide}"));
            }

        }

    }

    uwr.Dispose();
}

IEnumerator SendInitialData(string path)
{
    UnityWebRequest uwr = UnityWebRequest.Get($"{NetManager.sendGameStart}{path}");


    yield return uwr.SendWebRequest();

    if (uwr.result != UnityWebRequest.Result.Success)
    {
        Debug.LogError("ERROR: File not found");
        //RETURN TO MAIN MENU
    }
    else
    {
        string results = uwr.downloadHandler.text;
        NetData data = NetManager.RetriveData(results, 's');

        NetManager.ASSERT(data.sts);

        dataSent = true;

    }

    uwr.Dispose();
}

public IEnumerator SendNormalData()
{

    player1CurAtkType = player1CurMove ? 0 : player1CurAtkType;

    string path = $"id={gameSession}&side={playerSide}&hp={player1curHP}&pos={player1pos}&usedAtk={player1CurAtkType}&atkCtr={player1Center}";

    UnityWebRequest uwr = UnityWebRequest.Get($"{NetManager.sendData}{path}");


    yield return uwr.SendWebRequest();


    if (uwr.result != UnityWebRequest.Result.Success)
    {
        Debug.LogError("ERROR: File not found");
        //RETURN TO MAIN MENU
    }
    else
    {
        string results = uwr.downloadHandler.text;
        NetData data = NetManager.RetriveData(results, 's');

        NetManager.ASSERT(data.sts);

        dataSent = true;
    }
    uwr.Dispose();
}

IEnumerator RetreiveNormalData(string path)
{
    UnityWebRequest uwr = UnityWebRequest.Get($"{NetManager.getData}{path}");


    yield return uwr.SendWebRequest();

    if (uwr.result != UnityWebRequest.Result.Success)
    {
        Debug.LogError("ERROR: File not found");
        //RETURN TO MAIN MENU
    }
    else
    {
        string results = uwr.downloadHandler.text;
        NetData data = NetManager.RetriveData(results, 'r');

        NetManager.ASSERT(data.sts);

        player2des = data.p2Pos;
        player2CurAtkType = data.p2UsedAtk;
        player2Center = data.p2AtkCenter;

        player2CurMove = player2CurAtkType == 0;

        executeCurrentAction();
        UpdateAction();

        dataSent = false;

    }

    uwr.Dispose();
}

IEnumerator DeleteSession()
{
    string path = $"id={gameSession}";

    UnityWebRequest uwr = UnityWebRequest.Get($"{NetManager.deleteSession}{path}");
    
    yield return uwr.SendWebRequest();


    if (uwr.result != UnityWebRequest.Result.Success)
    {
        Debug.LogError("ERROR: File not found");
        //RETURN TO MAIN MENU
    }
    else
    {
        string results = uwr.downloadHandler.text;
        NetData data = NetManager.RetriveData(results, 's');

        NetManager.ASSERT(data.sts);   
    }
    uwr.Dispose();
}
```

### Server-Side Session Management

サーバー側で2人のプレイヤーの同期フラグとアクションデータを仲介・管理するPHPスクリプトです。

データベース（RDBMS）を構築するほどではない規模感に対し、セッションごとに独立した .json ファイルを生成・読み書きする軽量なデータストレージ手法を採用しました。クライアントからデータを受信するたびにフラグをインクリメントし、双方が準備完了したか（ターンが同期したか）を厳密にチェックします。不正なフラグ状態でのアクセスは即座に弾く処理（バリデーション）を入れることで、クライアント側の同期ズレやバグを未然に防ぐ安全性を確保しています。

```
<?php
$str = file_get_contents("./Sessions/S{$_GET["id"]}.json");
$data = json_decode($str, true);

//player side
$pS = $_GET["side"];

if(isset($_GET["pos"])) {
	$data["player"][$pS]["pos"] = strval($_GET["pos"]);
}

if(isset($_GET["usedAtk"])) {
	$data["player"][$pS]["usedAtk"] = $_GET["usedAtk"];
}

if(isset($_GET["atkCtr"])) {
	$data["player"][$pS]["atkCtr"] = strval($_GET["atkCtr"]);
}

//if the flag is 2 || 3 ASSERT
if($data["flag"] >= 2 || $data["flag"] < 0){
	echo "1";
    return;
}


$data["flag"] += 1;


$newJsonString = json_encode($data);
file_put_contents("./Sessions/S{$_GET["id"]}.json", $newJsonString);
	
echo 0;

/*
echo <pre>
var_dump($data);
?>
```