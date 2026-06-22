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

## 担当部分・実装実績


## 🖥️ サーバーサイド・アーキテクチャ

物理トポロジーには、同期されたLANインフラ（標準のイーサネットを介して物理スイッチングハブに接続）上の専用クライアント・サーバーモデルを採用しました。

![NetImage](./TGS25/assets/netSetup.png)

高頻度なチックスレート制約下において、最小限のレイテンシとルーティングスループットの最大化を両立するため、C#で独自の超軽量UDPルーティングサーバーを開発しました。このサーバーは低オーバーヘッドのネットワーククロスブリッジとして機能し、パケット化されたバイトペイロードをプレイヤー間で順次ルーティングします。その際、ホストインターフェース上でのバッファ膨張や処理オーバーヘッドを排除するため、構造的なデータ検証は最小限に留める設計にしています。

```csharp
// ============================================================================
// Server-Side Implementation Of UDP
// ============================================================================

/*
Flags Description:
0x4E (N) : Null, not empty
0x41 (A) : Player A data recived
0x42 (B) : Player B data recived
0x4B (K) : Starting flag for Kick function (player still in the session)
0x4C (L) : Last flag of the Kick function (player already left the session)
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


    public static void Main()
    {
        Thread udpServerThread;
        udpServerThread = new Thread(new ThreadStart(ServerLoop));
        udpServerThread.Start();
        string command = "";
        Console.WriteLine("[Server] started on port " + port);

        do {
			    /* Server Interface Console */
        } while (command != "close");

        udpServerThread.Abort();
        Console.WriteLine("[Server] closed \n PRESS CTRL + C TO CLOSE THE CONSOLE");
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
            catch (SocketException ex) { /* Handle disconnects / timeouts */ }
        }
    }
}
```

## 🧵 クライアントサイド・リアルタイムI/O並行処理

クライアント側のエンジンレイヤーでは、メインのシミュレーションループにおける同期的な実行ブロックを防ぐため、ネットワークI/O処理を完全に分離（デカップリング）させました。

パケットのシリアライズおよびデシリアライズを継続的にループ処理する専用のバックグラウンドのワーカースレッドを実装。ハードウェア精度を持つ `Stopwatch` を用いてリアルタイムのデルタタイムを計測することで、高精度なスリープ間隔を用いてワーカースレッドの実行を動的に制御（スロットリング）しています。これにより、ネットワークの更新レートを正確に約30Hzに固定し、メインの描画（レンダリング）スレッドのCPUリソース枯渇（スタベーション）を完全に防ぎ、ローカルのソケットバッファの混雑を回避しています。

```csharp
// ============================================================================
// Real-Time UDP Network IO & State Interleaving Engine
// ============================================================================

// Background worker thread: Decouples network I/O blocking calls from the main render loop
private static void SendGetData()
{
    long timeSpan = 0;
    Stopwatch stopWatch = new Stopwatch();

    while (true)
    {
        try
        {
            IPEndPoint ep = null;
            stopWatch.Reset();
            stopWatch.Start();

            // Fire-and-forget streaming of the packed byte payload
            udpc.Send(udpSend, udpSend.Length);
            udpGet = udpc.Receive(ref ep);

            // Throttle network tick rate (~30Hz) to prevent main thread starvation 
            // and unneeded bandwidth usage on the local socket interface.
            stopWatch.Stop();
            timeSpan = stopWatch.ElapsedMilliseconds;
            if (timeSpan < 33)
                Thread.Sleep((int)(33 - timeSpan));
        }
        catch (SocketException) { /* Handle disconnects / timeouts */ }
    }
}

// Main thread simulation step: Dispatches received data into the engine systems
void Update()
{
    PrepareNetData();
    udpSend = NetManager.ParseByte(playerSide, thisSideData);

    // Protocol Routing: Sync transforms and process network events
    if (udpGet[0] == 0x41 || udpGet[0] == 0x42)
    {
        data = NetManager.RetriveByte(udpGet);
        
        // Inline state application for remote proxy entity
        netPlayerScript.UpdateHP(data.hp);
        UpdatePosition();
        UpdateShootPos();

        // Sequential Event Handlers: Utilizing bitwise delta-checks (rolling counter flags)
        // to reliably trigger discrete structural actions (throwing/grabbing) over an unreliable UDP stream.
        if ((byte)(data.leftHand - rgCheckLeft) != 0)
        {
            if (data.leftObjId != 0 && leftObj == null)
            {
                leftObj = FindObjectById(data.leftObjId);
                netPlayerScript.GrabLeftObject(leftObj);
            }
            else
            {
                netPlayerScript.ThrowLeftObject();
                leftObj = null;
            }
            rgCheckLeft = (byte)((rgCheckLeft + 1) % 0x10);
        }
        
        // [Right hand and Audio effect event dispatching follows identical layout...]
    }
}

```		

## ⛰️ 決定論的プロシージャル地形生成

大量のネットワークシリアライズやメッシュストリーミングによるオーバーヘッドを発生させずに、毎試合異なるアリーナのレイアウトを構築するため、決定論的（デタミニスティック）なプロシージャル地形ジェネレーターを設計しました。

このシステムは、連続的なパーリンノイズ分布の上層に、マルチオクターブの分数ブラウン運動（fBm: Fractional Brownian Motion）アルゴリズムを重ねることで構成されています。初期のマッチメイク・ハンドシェイク時に抽象化されたランダムシード値をネットワーク経由で共有することで、両クライアントが同一の擬似ランダムな方向性オクターブオフセットを動的に計算。複雑な周波数をサンプリングした上で、生成されたハイトマップバッファに対して正規化処理を実行します。これにより、ネットワーク帯域の消費コストをゼロに抑えながら、完全に同期された同一の地形をリアルタイムに生成することを実現しました。

```csharp
// ============================================================================
// Noise Generator
// ============================================================================

public static float[,] GenerateNoiseMap(int mapWidth, int mapHeight, int seed, float scale, int octaves, float persistence, float lacunarity, Vector2 offset)
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

                amplitude *= persistence;
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

```

---

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

