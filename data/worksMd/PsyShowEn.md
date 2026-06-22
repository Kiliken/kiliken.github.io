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

**PSYCHIC SHOWDOWN** is a 3D action multiplayer game developed for **Tokyo Game Show 2025 (TGS25)** as part of an academic game development project. It blends competitive arena combat with procedurally generated environments and dynamic item interactions.



<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=HMy0Zgg9xYg&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>


---

## 📌 Overview

- **Genre:** 3D Online Multiplayer Arena Battle  
- **Platform:** PC
- **Engine:** Unity  
- **Event:** Tokyo Game Show 2025 (TGS25)

Compete against another psychic combatant in a small arena where the map and item placements are randomly generated every match. Collect and use different items to outmaneuver your opponent before time runs out.

---

## 🕹️ Gameplay

### 🎯 Core Loop

1. Two players enter a procedurally generated arena  
2. Players collect items scattered across the map  
3. Items are used to damage or disrupt the opponent  
4. The match ends when time runs out  
5. The player with the highest remaining HP wins  

---

### 🔥 Key Features

- **Procedural Arenas**  
  Every match features a new arena layout for high replayability.

- **Interactive Items**  
  Various throwable and usable items that affect combat strategy.

- **Competitive Multiplayer**  
  Designed specifically for head-to-head psychic battles.

---
## My Contributions

## 🖥️ SERVER-SIDE ARCHITECTURE

The physical topology utilized a dedicated client-server model over a synchronized LAN infrastructure (connected via standard Ethernet to a physical switch hub). 

![NetImage](./TGS25/assets/netSetup.png)

To ensure minimal latency and maximize routing throughput under high-frequency tick constraints, I developed a custom, ultra-lightweight UDP routing server in C#. The server acts as a low-overhead network cross-bridge, routing packed byte payloads sequentially between players with minimal structural validation to eliminate buffer inflation and processing overhead on the host interface.

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

## 🧵 CLIENT-SIDE REAL-TIME IO SPREAD

On the client engine layer, network I/O operations are fully decoupled from the primary simulation thread to eliminate synchronous execution blocking. 

I implemented a dedicated background worker thread to continuously loop packet serialization and deserialization. By tracking real-time delta times via hardware-accurate `Stopwatch` intervals, the worker thread dynamically throttles execution using high-precision sleep intervals. This keeps the network tick rate locked to a clean ~30Hz, entirely protecting the main render thread from starvation and avoiding socket buffer congestion.

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

## ⛰️ DETERMINISTIC PROCEDURAL GENERATION

To establish highly variable arena layouts without the overhead of heavy network serialization or mesh streaming, I designed a deterministic procedural terrain generator.

The system utilizes a multi-octave Fractional Brownian Motion (fBm) algorithm built on top of coherent Perlin noise distributions. By passing an abstracted random seed over the initial matchmaking handshake, both clients dynamically compute identical pseudo-random directional octave offsets, sample complex frequencies, and execute a normalization pass on the resulting heightmap buffer. This achieves absolute runtime parity across the network at zero bandwidth cost.

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
- Coleman Nicholas  
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

