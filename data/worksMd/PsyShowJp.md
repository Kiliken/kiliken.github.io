<a class="btn" href="https://github.com/Kiliken/PsychicShowdown/">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/githubIcon.svg#icon"></use>
  </svg>
  <span>GitHub</span>
</a>

<a class="btn" href="https://github.com/Kiliken/PsychicShowdown/releases">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/downloadIcon.svg#icon"></use>
  </svg>
  <span>Download</span>
</a>

# Psychic Showdown

**PSYCHIC SHOWDOWN** は、学術的なゲーム開発プロジェクトの一環として制作された、**東京ゲームショウ 2025（TGS25）** 出展向けの 3D アクション対戦型マルチプレイヤーゲームです。  
プロシージャル生成されるステージと、多彩なアイテムによるダイナミックなインタラクションを組み合わせた、競技性の高いアリーナバトルを特徴としています。

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=HMy0Zgg9xYg&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

---

## 📌 概要

- **ジャンル:** 3D オンライン対戦型アリーナバトル  
- **プラットフォーム:** PC  
- **エンジン:** Unity  
- **出展イベント:** 東京ゲームショウ 2025（TGS25）

プレイヤーは超能力を持つキャラクターとなり、小規模なアリーナで対戦します。  
マップ構成やアイテム配置は毎試合ランダムに生成され、制限時間内にアイテムを駆使して相手を出し抜くことが勝利への鍵となります。

---

## 🕹️ ゲームプレイ

### 🎯 基本ループ

1. 2 人のプレイヤーがプロシージャル生成されたアリーナに参加  
2. マップ上に配置されたアイテムを収集  
3. アイテムを使用して相手にダメージを与える、または妨害する  
4. 制限時間終了で試合終了  
5. 残り HP が多いプレイヤーの勝利  

---

### 🔥 主な特徴

- **プロシージャルアリーナ**  
  毎試合異なるステージ構成により、高いリプレイ性を実現。

- **インタラクティブなアイテム**  
  投擲可能なアイテムや特殊効果を持つアイテムが、戦略性を大きく左右。

- **対戦特化型マルチプレイヤー**  
  1 対 1 の白熱した超能力バトルを前提に設計されたゲームデザイン。

---

## My Contributions

### Game Server

<details>
<summary> <h4>Server.cs (Code)</h4> </summary>

```csharp

// Server-Side Implementation Of UDP:

/*
Flags Description:

0x4E (N) : Null, not empty
0x41 (A) : Player A data recived
0x42 (B) : Player B data recived
0x4B (K) : Starting flag for Kick function (player still in the session)
0x4C (L) : Last flag of the Kick funcion (player alredy left the session)
0x6C (l) : Currently in the loading screen
0x57 (W) : Currently in the winning screen
0x54 (T) : Currently in the title screen

*/

class BasicUdpServer
{
    static int port = 25565;
    static UdpClient udpc = new UdpClient(port);

    static volatile byte[] p1Data;
    static volatile byte[] p2Data;
    
    static volatile int seed = 0;

    static volatile byte flag = 0;
    static Random random = new Random();
    //static volatile Stopwatch stopWatch = new Stopwatch();


    public static void Main()
    {
        Thread udpServerThread;
        udpServerThread = new Thread(new ThreadStart(ServerLoop));
        udpServerThread.Start();
        //stopWatch.Start();
        string command = "";
        Console.WriteLine("[Server] started on port " + port);

        do
        {
            Console.Write("[Server] ");
            command = Console.ReadLine();

            if (command == "data")
            {
                Console.WriteLine("[Server] Player 1: ");
                StringifyBytes(p1Data);
                Console.WriteLine("[Server] Player 2: ");
                StringifyBytes(p2Data);
                Console.WriteLine("[Server] Current Seed: " + seed);
                //Console.WriteLine("[Server] Timer: " + stopWatch.ElapsedMilliseconds);
            }

            if (command == "reset")
            {
                ResetData();
            }

            if (command == "kick")
            {
                KickAndReset();
            }

            if (command == "clear")
            {
                Console.Clear();
                Console.WriteLine("[Server] console cleared ");
            }

            if (command == "help") Help();


        } while (command != "close");

        udpServerThread.Abort();
        Console.WriteLine("[Server] closed \n PRESS CTRL + C TO CLOSE THE CONSOLE");
    }

    static void StringifyBytes(byte[] bytes)
    {
        foreach (byte b in bytes)
        {
            Console.Write(String.Format("0x{0:X2}-", b));
        }
        Console.WriteLine("");
    }

    static void Help()
    {
        Console.WriteLine("[Server] avibile commands:\n" +
        " data\t SHOWS CURRENT STORED DATA\n" +
        " reset\t RESETS STORED DATA\n" +
        " clear\t CLEAR THE CONSOLE\n" +
        " close\t CLOSE SERVER\n" +
        " kick\t KICK BOTH PLAYER TO MAIN MENU\n" +
        " help\t SHOWS LIST OF AVIBILE COMMANDS\n"
        );
    }

    static void ResetData()
    {
        p1Data = new byte[] { 0x4E };
        p2Data = new byte[] { 0x4E };
        seed = random.Next();
        flag = 0;
        //stopWatch.Reset();
        //stopWatch.Start();
        Console.WriteLine("[Server] data resetted ");
    }

    static void KickAndReset()
    {
        p1Data = new byte[] { 0x4B };
        p2Data = new byte[] { 0x4B };
        //stopWatch.Stop();

        Console.WriteLine("[Server] kicking player... ");
    }

    private static void ServerLoop()
    {
        byte[] sdata;
        byte[] receivedData;

        p1Data = new byte[] { 0x4E };
        p2Data = new byte[] { 0x4E };
        seed = random.Next();


        while (true)
        {
            //ServerLoopStart
            try
            {

                //Getdata
                IPEndPoint ep = null;
                receivedData = udpc.Receive(ref ep);

                //Ingame
                if (receivedData[0] == 0x41)
                {
                    p1Data = receivedData;
                    if (p2Data[0] == 0x4E)
                    {
                        sdata = new byte[] { 0x4E };
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }
                    if (p2Data[0] == 0x4B || p2Data[0] == 0x4C)
                    {
                        sdata = new byte[] { 0x4B };
                        p1Data = new byte[] { 0x4C };
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }
                    udpc.Send(p2Data, p2Data.Length, ep);
                }
                if (receivedData[0] == 0x42)
                {
                    p2Data = receivedData;
                    if (p1Data[0] == 0x4E)
                    {
                        sdata = new byte[] { 0x4E };
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }
                    if (p1Data[0] == 0x4B || p1Data[0] == 0x4C)
                    {
                        sdata = new byte[] { 0x4B };
                        p2Data = new byte[] { 0x4C };
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }
                    udpc.Send(p1Data, p1Data.Length, ep);
                }


                //Loading screen
                if (receivedData[0] == 0x6C)
                {
                    if (receivedData.Length == 1)
                    {
                        sdata = new byte[] { 0x4E };
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }

                    if (receivedData[1] == 0x41)
                    {
                        p1Data = receivedData;
                        if (p2Data[0] == 0x4E)
                        {
                            sdata = new byte[] { 0x4E };
                            udpc.Send(sdata, sdata.Length, ep);
                            continue;
                        }
                        sdata = new byte[6];
                        sdata[0] = 0x6C;
                        sdata[1] = p2Data[1];
                        Array.Copy(BitConverter.GetBytes(seed), 0, sdata, 2, 4);
                        udpc.Send(sdata, sdata.Length, ep);
                        flag++;
                    }
                    if (receivedData[1] == 0x42)
                    {
                        p2Data = receivedData;
                        if (p1Data[0] == 0x4E)
                        {
                            sdata = new byte[] { 0x4E };
                            udpc.Send(sdata, sdata.Length, ep);
                            continue;
                        }
                        sdata = new byte[6];
                        sdata[0] = 0x6C;
                        sdata[1] = p1Data[1];
                        Array.Copy(BitConverter.GetBytes(seed), 0, sdata, 2, 4);
                        udpc.Send(sdata, sdata.Length, ep);
                        flag++;
                    }
                }

                //Winning screen
                if (receivedData[0] == 0x57)
                {
                    if (receivedData.Length == 1)
                    {
                        sdata = new byte[] { 0x4E };
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }

                    if (receivedData[1] == 0x41)
                    {
                        sdata = new byte[] { 0x4E };
                        p1Data = sdata;
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }
                    if (receivedData[1] == 0x42)
                    {
                        sdata = new byte[] { 0x4E };
                        p2Data = sdata;
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }
                }

                //Title Screen Reset
                if (receivedData[0] == 0x54)
                {
                    if (receivedData.Length == 1)
                    {
                        sdata = new byte[] { 0x4E };
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }

                    if (receivedData[1] == 0x41)
                    {
                        sdata = new byte[] { 0x4E };
                        p1Data = sdata;
                        udpc.Send(sdata, sdata.Length, ep);
						seed = random.Next();
                        continue;
                    }
                    if (receivedData[1] == 0x42)
                    {
                        sdata = new byte[] { 0x4E };
                        p2Data = sdata;
                        udpc.Send(sdata, sdata.Length, ep);
                        continue;
                    }
                }
            }
            catch (SocketException ex)
            {

                // Handle errors gracefully, e.g., log or attempt to reconnect
            }
        }
    }
}

```

</details>

### Client

<details>
<summary> <h4>NetController.cs (Code)</h4> </summary>

```csharp

public class NetController : MonoBehaviour
{
    [Header("Client")]
    [SerializeField] string ip = "127.0.0.1";
    [SerializeField] int port = 25565;
    static UdpClient udpc;
    float timer = 0;
    private Thread udpDataThread;
    private bool udpRunnig = true;

    private NetData data;

    private NetData thisSideData;

    private MapGenerator map;

    [SerializeField]
    private Transform gameUI;

    static volatile byte[] udpSend = new byte[] { 0x4E };
    static volatile byte[] udpGet = new byte[] { 0x4E };



    [Header("Players")]
    public char playerSide = 'A';
    [SerializeField] Transform player;
    [SerializeField] Transform playerOther;

    private Player playerScript;
    private NETPlayer netPlayerScript;

    private byte rgCheckLeft = 0x00;
    private byte rgCheckRight = 0x00;
    private byte rgSoundCheck = 0x00;

    private ThrowableObject leftObj;
    private ThrowableObject rightObj;
    private Transform playerShootPos;

    private Rigidbody otherplayerRb;

    [Header("Other")]
    [SerializeField] GameManager gameManager;
    private HPBarBG otherHpBarEffect;
    private CellHPBar otherHpCells;
    private sbyte otherHp = 10;

    private byte inactivity = 0x00;
    private bool hasLeft = false;


    private static void SendGetData()
    {
        long timeSpan = 0;
        Stopwatch stopWatch = new Stopwatch();
        Debug.Log("ThreadStarted");

        while (true)
        {
            //Debug.Log("threding");
            try
            {
                IPEndPoint ep = null;
                stopWatch.Reset();
                stopWatch.Start();


                udpc.Send(udpSend, udpSend.Length);


                udpGet = udpc.Receive(ref ep);

                stopWatch.Stop();
                timeSpan = stopWatch.ElapsedMilliseconds;
                if (timeSpan < 33)
                    Thread.Sleep((int)(33 - timeSpan));

            }
            catch (SocketException ex)
            {
                Debug.LogError("Socket Exception: " + ex.Message);
                // Handle errors gracefully, e.g., log or attempt to reconnect
            }
        }
    }

    private void Awake()
    {
        udpSend = new byte[] { 0x4E };
        udpGet = new byte[] { 0x4E };

        inactivity = 0x00;
        hasLeft = false;

        DebugController dbctr = GameObject.FindGameObjectWithTag("DebugCtrl").GetComponent<DebugController>();

        if (dbctr.ip != string.Empty) ip = dbctr.ip;
        if (dbctr.port != 0) port = dbctr.port;
        if (dbctr.playerSide != '0') playerSide = dbctr.playerSide;

        player = (playerSide == 'A' ? GameObject.Find("Player").transform : GameObject.Find("Player2").transform);
        playerOther = (playerSide == 'A' ? GameObject.Find("Player2").transform : GameObject.Find("Player").transform);
        Destroy(playerOther.GetComponent<Player>());

        //gameUI.GetChild(playerSide == 'A' ? 2 : 3).gameObject.SetActive(true);
        //gameUI.GetChild(playerSide == 'A' ? 3 : 2).GetChild(0).gameObject.SetActive(true);

        for (int i = 2; i < gameUI.GetChild(playerSide == 'A' ? 3 : 2).childCount; i++)
        {
            gameUI.GetChild(playerSide == 'A' ? 3 : 2).GetChild(i).gameObject.SetActive(false);
        }

        otherHpBarEffect = gameUI.GetChild(playerSide == 'A' ? 3 : 2).GetChild(0).GetComponent<HPBarBG>();
        otherHpCells = gameUI.GetChild(playerSide == 'A' ? 3 : 2).GetChild(1).GetComponent<CellHPBar>();

        //player.GetComponent<Player>().playerNo = 1;
        netPlayerScript = playerOther.gameObject.AddComponent<NETPlayer>();
        netPlayerScript.playerNo = (playerSide == 'A' ? 2 : 1);

        //Destroy(playerOther.GetComponent<Rigidbody>());
        otherplayerRb = playerOther.GetComponent<Rigidbody>();
        otherplayerRb.isKinematic = true;

        player.transform.GetComponent<Rigidbody>().useGravity = true;
        GameObject.Find((playerSide == 'A' ? "PlayerCam2" : "PlayerCam")).SetActive(false);
        EnablePlayer(player);

        playerScript = player.GetComponent<Player>();
        gameManager.player = playerScript;
        gameManager.netPlayer = netPlayerScript;
        gameManager.netController = this;
    }


    void Start()
    {
        thisSideData = new NetData();
        map = FindAnyObjectByType<MapGenerator>();

        udpc = new UdpClient(ip, port);
        udpc.Client.ReceiveTimeout = 1000;
        udpDataThread = new Thread(new ThreadStart(SendGetData));
        udpDataThread.Start();
    }


    void Update()
    {
        if (playerShootPos == null)
            playerShootPos = playerScript.shootPos;

        PrepareNetData();
        udpSend = NetManager.ParseByte(playerSide, thisSideData);

        if (udpGet[0] == 0x4B)
        {
            SceneManager.LoadScene("OnlineTitleScreen");
        }

        if (udpGet[0] == 0x41 || udpGet[0] == 0x42)
        {
            data = NetManager.RetriveByte(udpGet);

            netPlayerScript.UpdateHP(data.hp);

            hasLeft = true;

            UpdatePosition();
            UpdateShootPos();

            if (otherHp != data.hp)
            {
                otherHpBarEffect.TakeDamage();
                otherHpCells.UpdateHPBarNet(data.hp);
            }
            otherHp = data.hp;

            if ((byte)(data.leftHand - rgCheckLeft) != 0)
            {
                //otherPlayer.ThrowLeftObject();
                if (data.leftObjId != 0 && leftObj == null)
                {
                    Debug.Log($"Enemy Left Object N{data.leftObjId} Taken");
                    leftObj = FindObjectById(data.leftObjId);
                    //grab LeftObject here
                    netPlayerScript.GrabLeftObject(leftObj);
                }
                else
                {
                    Debug.Log("Enemy Left Object Throwed");
                    //throw LeftObject here
                    netPlayerScript.ThrowLeftObject();

                    leftObj = null;
                }


                rgCheckLeft++;

                if (rgCheckLeft >= 0x10)
                    rgCheckLeft -= 0x10;
            }



            if ((byte)(data.rightHand - rgCheckRight) != 0)
            {
                //otherPlayer.ThrowRightObject();

                if (data.rightObjId != 0 && rightObj == null)
                {
                    Debug.Log($"Enemy Right Object N{data.rightObjId} Taken");
                    rightObj = FindObjectById(data.rightObjId);
                    //grab RightObject here
                    netPlayerScript.GrabRightObject(rightObj);
                }
                else
                {
                    Debug.Log("Enemy Right Object Throwed");
                    //throw RightObject here
                    netPlayerScript.ThrowRightObject();

                    rightObj = null;
                }

                rgCheckRight++;

                if (rgCheckRight >= 0x10)
                    rgCheckRight -= 0x10;
            }

            if ((byte)(data.soundFlag - rgSoundCheck) != 0)
            {
                Debug.Log($"Player sound:{data.soundIndex}");
                //call the soundplayer fuction here
                netPlayerScript.PlaySFXEffect(data.soundIndex);

                rgSoundCheck++;

                if (rgSoundCheck >= 0x10)
                    rgSoundCheck -= 0x10;
            }

        }

        if (udpGet[0] == 0x4E && hasLeft)
        {
            inactivity++;
        }

        if (inactivity > 0x10)
        {
            DestroyNetThread();
            SceneManager.LoadScene("OnlineTitleScreen");
        }
    }

    private void OnDestroy()
    {
        DestroyNetThread();
    }

    public void DestroyNetThread()
    {
        Debug.Log("Thread shutdown");
        udpDataThread.Abort();
    }

    void UpdatePosition()
    {
        netPlayerScript.UpdatePosition(data.posX, data.posY, data.posZ, data.rotBody);
    }

    void UpdateShootPos()
    {
        netPlayerScript.tempShootPos.position = new Vector3(data.camPosX, data.camPosY, data.camPosZ);
        netPlayerScript.tempShootPos.eulerAngles = new Vector3(data.camRotX, data.camRotY, 0);
        playerOther.GetChild(1).eulerAngles = new Vector3(data.camRotX, data.camRotY, 0);
    }

    void EnablePlayer(Transform side)
    {
        foreach (Behaviour behaviour in side.GetComponentsInChildren<Behaviour>())
            behaviour.enabled = true;
    }

    ThrowableObject FindObjectById(ushort id)
    {
        for (int i = 0; i < map.objects.Count; i++)
        {
            if (map.objects[i].GetComponent<ThrowableObject>().objectID == id)
                return map.objects[i].GetComponent<ThrowableObject>();
        }
        return null;
    }
}

```

</details>

### Terrain Generation

<details>
<summary> <h4>Noise.cs (Code)</h4> </summary>

```csharp

public static class Noise
{
    public static float[,] GenerateNoiseMap(int mapWidth, int mapHeight, int seed, float scale, int octaves, float persistance, float lacunarity, Vector2 offset)
    {
        float[,] noiseMap = new float[mapWidth, mapHeight];
        
        System.Random prng = new System.Random(seed);
        Vector2[] octaveOffsets = new Vector2[octaves];
        for (int i = 0; i < octaves; i++)
        {
            float offsetX = prng.Next(-100000, 100000) + offset.x;
            float offsetY = prng.Next(-100000, 100000) + offset.y;
            octaveOffsets[i] = new Vector2(offsetX, offsetY);
        }

        if (scale <= 0)
            scale = 0.0001f;

        float maxNoiseHeight = float.MinValue;
        float minNoiseHeight = float.MaxValue;

        float halfWidth = mapWidth / 2f;
        float halfHeight = mapHeight / 2f;

        for (int y = 0; y < mapHeight; y++)
        {
            for (int x = 0; x < mapWidth; x++)
            {
                float amplitude = 1;
                float frequency = 1;
                float noiseHeight = 0;

                for (int i = 0; i< octaves; i++)
                {
                    float sampleX = (x-halfWidth) / scale * frequency + octaveOffsets[i].x;
                    float sampleY = (y-halfHeight) / scale * frequency + octaveOffsets[i].y;

                    float perlinValue = Mathf.PerlinNoise(sampleX, sampleY) * 2 -1;
                    noiseHeight += perlinValue * amplitude;

                    amplitude *= persistance;
                    frequency *= lacunarity;
                }

                if (noiseHeight > maxNoiseHeight)
                    maxNoiseHeight = noiseHeight;
                else if (noiseHeight < minNoiseHeight)
                    minNoiseHeight = noiseHeight;
                
                noiseMap[x, y] = noiseHeight;
            }
        }

        for (int y = 0; y < mapHeight; y++)
        {
            for (int x = 0; x < mapWidth; x++)
            {
                noiseMap[x, y] = Mathf.InverseLerp(minNoiseHeight, maxNoiseHeight, noiseMap[x,y]);
            }
        }

            return noiseMap;
    }
}

```

</details>


## 🧾 Credits

### Planning & Leadership
- コールマン ニコラス
- 山口 敢汰 (Mentor)

### Programming
- ゼイヤーアウン (Leader)  
- チェン ユウレン  
- マリアー二 フランチェスコ パオロ  

### 3D Design
- マイケル クルニアワン (Leader)  
- 井上 葵文  
- 渡邉 優稀  
- アルヴィン スジャディ  
- ジョ ミンコウ  

### 2D Design
- ルンチャルーアン ウィクライカンチャナポーン  
- 岩川 旭 (Mentor)  
- チェン ユウレン  

### Animations
- ボーランド マティアス エリク  

### Effects Design
- 多々木 颯斗  

