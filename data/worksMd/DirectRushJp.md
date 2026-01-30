<a class="btn" href="https://github.com/FujiyoshKirari/DirectRush/">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/githubIcon.svg#icon"></use>
  </svg>
  <span>GitHub</span>
</a>

<a class="btn" href="https://github.com/FujiyoshKirari/DirectRush/releases">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/downloadIcon.svg#icon"></use>
  </svg>
  <span>Download</span>
</a>

# Direct Rush

**学校の共同プロジェクトとして制作された、スピード感あふれるUnityパズルマッチゲーム。**

精密な操作とカオスが入り混じるハイスピードなゲームプレイが特徴です。独自の **「フィーバーシステム」** を搭載しており、フィーバー発動中はパズルを消すごとに強力なビームが放たれ、シールドにダメージを与えます。敵の防御を打ち砕くことで新しいパズルピースが解放され、ゲームが進行していきます。

VIDEO HERE

本プロジェクトは、**幕張メッセ**で開催された展示会 **「[2026 we are JIKEI COM 若きクリエーター展](https://www.jikeicom.jp/wearejikeicom_tokyo/index.php)」** にて出展・発表されました。

<a href="https://www.jikeicom.jp/wearejikeicom_tokyo/index.php">
  <img src="https://www.jikeicom.jp/wearejikeicom_tokyo/assets/img/top/mv/logo_black.png" width="512"/>
</a>

---

## 担当した部分

### Puzzle Controller

```csharp

public bool InitiateStage()
{
    byte pieceSurround = 0b0;
    sbyte k = 10;
    sbyte jicCheck = 0;

    for (sbyte i = 0; i < stageSize.x; i++)
    {
        for (sbyte j = 0; j < stageSize.y; j++)
        {
            if (pieces[i, j].obj != null)
                Destroy(pieces[i, j].obj);
            pieces[i, j].obj = Instantiate(piecePrefab, GlobalUtils.GetPosByIndex(i, j, stageSize), Quaternion.identity);
            pieces[i, j].obj.transform.SetParent(transform);
            pieces[i, j].script = pieces[i, j].obj.GetComponent<Piece>();
            pieces[i, j].script.IntantiatePiece(i, j, true);
        }
    }

    while (k > 2 || jicCheck < 20)
    {
        pieceSurround = 0b0;
        k = 0;
        for (sbyte i = 0; i < stageSize.x; i++)
        {
            for (sbyte j = 0; j < stageSize.y; j++)
            {
                pieceSurround = CheckNearColor(i, j, pieces[i, j].script.color);
                if ((pieceSurround & 0b0010) != 0)
                {
                    k = 2;
                    while (k < 5)
                    {
                        if (i + k >= stageSize.x)
                            break;

                        if (pieces[i, j].script.color == pieces[i + k, j].script.color)
                            k++;
                        else break;
                    }
                    IsGoingDownSilent(i, j, k, 0b0010);
                }
                if ((pieceSurround & 0b0100) != 0)
                {
                    k = 2;
                    while (k < 5)
                    {
                        if (j + k >= stageSize.y)
                            break;

                        if (pieces[i, j].script.color == pieces[i, j + k].script.color)
                            k++;
                        else break;
                    }
                    IsGoingDownSilent(i, j, k, 0b0100);
                }

            }

        }
        jicCheck++;
        if (jicCheck > 99)
        {
            Debug.LogError($"CHECKED A LOT! {jicCheck} times!");
            Debug.Break();
            break;
        }
    }

    stageSize.y = 7; //set the interactable size of the stage
    Shader.SetGlobalFloat("_ShieldHight", shieldHight[0]);
    return false;
}

void Inputs()
{
    float y;
    float x;

    // Get Screen Input Pos
    if (Input.GetMouseButtonDown(0) && puzzleChecked /* && !pauseManager._isPause*/)
    {
        _mousePos = Input.mousePosition;
        _mouseDown = true;
        _mouseWorldPos = Camera.main.ScreenToWorldPoint(_mousePos);
        arrayPos = GlobalUtils.GetIndexByPos(_mouseWorldPos, stageSize);

        if (arrayPos[0] != -1)
        {
            pieces[arrayPos[0], arrayPos[1]].obj.GetComponent<SpriteRenderer>().enabled = false;
            hoverPiece.GetComponent<Piece>().SetColor(pieces[arrayPos[0], arrayPos[1]].script.color);
            hoverPiece.SetActive(true);
        }

        


        Debug.Log($"pos= {_mouseWorldPos},i= {arrayPos[0]}, j= {arrayPos[1]}");
    }

    if (_mouseDown)
    {
        y = Input.mousePosition.y - _mousePos.y;
        x = Input.mousePosition.x - _mousePos.x;

        hoverPiece.transform.position = Camera.main.ScreenToWorldPoint(new Vector3(Input.mousePosition.x, Input.mousePosition.y,10.0f));


        if (Mathf.Abs(y) + 100 < Mathf.Abs(x * 2))
        {
            
            if (x > 0)
            {
                SwitchPieces(0b0001, arrayPos); // right
            }
            else
            {
                SwitchPieces(0b0100, arrayPos); // left
            }
            _mousePos = Input.mousePosition;
        }
        if (Mathf.Abs(x) + 100 < Mathf.Abs(y * 2))
        {
            if (y > 0)
            {
                SwitchPieces(0b1000, arrayPos); // up
            }
            else
            {
                SwitchPieces(0b0010, arrayPos); // down
            }
            _mousePos = Input.mousePosition;
        }
    }


    //Release input
    if (Input.GetMouseButtonUp(0))
    {
        _mouseDown = false;
        y = Input.mousePosition.y - _mousePos.y;
        x = Input.mousePosition.x - _mousePos.x;
        hoverPiece.transform.position = Vector3.zero;

        hoverPiece.SetActive(false);

        if (arrayPos[0] != -1)
        {
            pieces[arrayPos[0], arrayPos[1]].obj.GetComponent<SpriteRenderer>().enabled = true;
        }
            
    }

}

void SwitchPieces(byte side, sbyte[] piece)
{
    if (piece[0] == -1 || piece[1] == -1)
        return;

    PieceArray swapper = new PieceArray();
    pieces[arrayPos[0], arrayPos[1]].obj.GetComponent<SpriteRenderer>().enabled = true;
    hoverPiece.SetActive(false);

    switch (side)
    {
        case 0b0001:
            Debug.Log("Right");
            if ((sbyte)(piece[0] + 1) >= stageSize.x)
                return;

            swapped[0] = 1;
            swapped[1] = piece[0];
            swapped[2] = piece[1];
            swapped[3] = (sbyte)(piece[0] + 1);
            swapped[4] = piece[1];

            break;
        case 0b0010:
            Debug.Log("Down");
            if ((sbyte)(piece[1] + 1) >= stageSize.y)
                return;

            swapped[0] = 1;
            swapped[1] = piece[0];
            swapped[2] = piece[1];
            swapped[3] = piece[0];
            swapped[4] = (sbyte)(piece[1] + 1);
            break;
        case 0b0100:
            Debug.Log("Left");
            if ((sbyte)(piece[0] - 1) < 0)
                return;

            swapped[0] = 1;
            swapped[1] = piece[0];
            swapped[2] = piece[1];
            swapped[3] = (sbyte)(piece[0] - 1);
            swapped[4] = piece[1];

            break;
        case 0b1000:
            Debug.Log("Up");
            if ((sbyte)(piece[1] - 1) < 0)
                return;

            swapped[0] = 1;
            swapped[1] = piece[0];
            swapped[2] = piece[1];
            swapped[3] = piece[0];
            swapped[4] = (sbyte)(piece[1] - 1);
            break;
    }

    pieces[swapped[1], swapped[2]].script.MovePiece(swapped[3], swapped[4], GlobalUtils.GetPosByIndex(swapped[3], swapped[4], stageSize));
    pieces[swapped[3], swapped[4]].script.MovePiece(swapped[1], swapped[2], GlobalUtils.GetPosByIndex(swapped[1], swapped[2], stageSize));

    swapper = pieces[swapped[1], swapped[2]];
    pieces[swapped[1], swapped[2]] = pieces[swapped[3], swapped[4]];
    pieces[swapped[3], swapped[4]] = swapper;

    arrayPos[0] = -1;
    arrayPos[1] = -1;
    timerCheck = 0.3f;
    puzzleChecked = false;
    CheckForBeams();
}

public void UpdatePuzzle()
{
    byte pieceSurround = 0b0;
    sbyte k = 0;
    sbyte longest = 0;
    sbyte[] longPos = { -1, -1 };
    byte longesDir = 0b0;

    if (previusStageHight != stageSize.y)
        switch (stageSize.y)
        {
            case 7:
                Shader.SetGlobalFloat("_ShieldHight", shieldHight[0]);
                break;
            case 9:
                Shader.SetGlobalFloat("_ShieldHight", shieldHight[1]);
                break;
            case 11:
                Shader.SetGlobalFloat("_ShieldHight", shieldHight[2]);
                break;
        }

    previusStageHight = stageSize.y;



    for (sbyte i = 0; i < stageSize.x; i++)
    {
        for (sbyte j = 0; j < stageSize.y; j++)
        {
            pieceSurround = CheckNearColor(i, j, pieces[i, j].script.color);
            if ((pieceSurround & 0b0010) != 0) // horizontal (right)
            {
                k = 2;
                while (k < 5)
                {
                    if (i + k >= stageSize.x)
                        break;

                    if (pieces[i, j].script.color == pieces[i + k, j].script.color)
                        k++;
                    else break;
                }

                if (k > longest)
                {
                    longest = k;
                    longPos[0] = i;
                    longPos[1] = j;
                    longesDir = 0b0010;
                }
            }
            if ((pieceSurround & 0b0100) != 0) // vertical (down)
            {
                k = 2;
                while (k < 5)
                {
                    if (j + k >= stageSize.y)
                        break;

                    if (pieces[i, j].script.color == pieces[i, j + k].script.color)
                        k++;
                    else break;
                }

                if (k > longest)
                {
                    longest = k;
                    longPos[0] = i;
                    longPos[1] = j;
                    longesDir = 0b0100;
                }
            }
        }

    }

    if (longest > 2)
    {
        IsGoingDownBeam(longPos[0], longPos[1], longest, longesDir, gameManager.GetIsFever());

        timerCheck = pieceCheckTime; //small pause between blocks
        CheckForBeams();

        swapped[0] = -1; //reset piece to swap
        return;
    }

    // put the piece back
    if (swapped[0] != -1)
    {
        PieceArray swapper = new PieceArray();

        pieces[swapped[1], swapped[2]].script.MovePiece(swapped[3], swapped[4], GlobalUtils.GetPosByIndex(swapped[3], swapped[4], stageSize));
        pieces[swapped[3], swapped[4]].script.MovePiece(swapped[1], swapped[2], GlobalUtils.GetPosByIndex(swapped[1], swapped[2], stageSize));

        swapper = pieces[swapped[1], swapped[2]];
        pieces[swapped[1], swapped[2]] = pieces[swapped[3], swapped[4]];
        pieces[swapped[3], swapped[4]] = swapper;
    }

    puzzleChecked = true;
}

byte CheckNearColor(sbyte x, sbyte y, sbyte color)
{
    if (color == -1) //already in a tris
        return 0b0;

    byte buffer = 0b0;

    if (color == pieces[Math.Min(x + 1, stageSize.x - 1), y].script.color && x < stageSize.x - 1) buffer += 0b0010; // horizontal (right)
    if (color == pieces[x, Math.Min(y + 1, stageSize.y - 1)].script.color && y < stageSize.y - 1) buffer += 0b0100; // vertical (down)

    return buffer;
}



void IsGoingDownBeam(sbyte x, sbyte y, sbyte size, byte side, bool beam = false)
{
    sbyte k = size;
    byte toDeleteCount = 0;

    comboCount++;
    comboTime = comboExpire;

    //GlobalUtils.AssertDeclaration(FindFirstObjectByType<Beam>()).BeamRange(size, GlobalUtils.GetMatchCenter(x, y, stageSize, size, side));
    //soundManager.PlaySE(SEType.BrokBreak);

    PieceArray[] toDelete = new PieceArray[100];

    if ((side & 0b0010) != 0) // horizontal (right)
    {
        bool skipStep = true;
        bool deleteAll = false;
        while (k > 0)
        {
            k--;
            toDelete[toDeleteCount] = pieces[x + k, y];
            toDeleteCount++;

            if (!beam)
            {
                switch (size)
                {
                    case 3:
                        continue; // no extra column deleted
                    case 4:
                        if (k != 1)
                            continue; // middle column deleted
                        break;
                    case 5:
                        if (k == 0 || k == size - 1) // delete all exept first and last column
                            continue;
                        break;
                }

            }
            else

                switch (size)
                {
                    case 3:
                        if (k != 1)
                            continue; // middle column deleted
                        break;
                    case 4:
                        if (k == 3)
                            continue; // delete all exept last column
                        break;
                    case 5:
                        deleteAll = true;
                        continue; // delete all map

                }




            for (int j = stageSize.y - 1; j >= 0; j--)
            {
                toDelete[toDeleteCount] = pieces[x + k, j];
                toDeleteCount++;
            }

        }

        k = size;
        while (k > 0)
        {
            k--;

            if (!beam)
            {
                switch (size)
                {
                    case 3:
                        break; // always iterate
                    case 4:
                        if (k == 1)
                            continue; // dont iterate in the middle
                        break;
                    case 5:
                        if (k != 0 && k != size - 1)
                            continue; // dont iterate on the first and last
                        break;
                }
            }
            else

                switch (size)
                {
                    case 3:
                        if (k == 1)
                            continue; // dont iterate in the middle
                        break;
                    case 4:
                        if (k != 3)
                            continue; // dont iterate for the last
                        break;
                    case 5:
                        continue; // never iterate
                }

            for (sbyte i = (sbyte)(y - 1); i >= 0; i--)
            {
                Debug.Log($"x: {x}; y: {i}");

                pieces[x + k, i].script.MovePiece((sbyte)(x + k), (sbyte)(i + 1), GlobalUtils.GetPosByIndex((sbyte)(x + k), (sbyte)(i + 1), stageSize));
                pieces[x + k, i + 1] = pieces[x + k, i];
            }
        }


        k = size;
        while (k > 0)
        {
            k--;
            skipStep = true;

            if (!beam)
            {
                switch (size)
                {
                    case 3:
                        break; // never skip
                    case 4:
                        if (k == 1)
                            skipStep = false;
                        break; // skip in the middle column
                    case 5:
                        if (k != 0 && k != size - 1)
                            skipStep = false;
                        break; // skip on the first and last column
                }
            }
            else

                switch (size)
                {
                    case 3:
                        if (k == 1)
                            skipStep = false;
                        break; // skip in the middle column
                    case 4:
                        if (k != 3)
                            skipStep = false;
                        break; // skip on the last column
                    case 5:
                        continue; // always skip
                }

            if (skipStep)
            {
                pieces[x + k, 0].obj = Instantiate(piecePrefab, GlobalUtils.GetPosByIndex((sbyte)(x + k), 0, stageSize), Quaternion.identity);
                pieces[x + k, 0].obj.transform.SetParent(transform);
                pieces[x + k, 0].script = pieces[x + k, 0].obj.GetComponent<Piece>();
                pieces[x + k, 0].script.IntantiatePiece((sbyte)(x + k), 0);
            }
            else
            {

                for (int j = stageSize.y - 1; j >= 0; j--)
                {
                    pieces[x + k, j].obj = Instantiate(piecePrefab, GlobalUtils.GetPosByIndex((sbyte)(x + k), (sbyte)j, stageSize), Quaternion.identity);
                    pieces[x + k, j].obj.transform.SetParent(transform);
                    pieces[x + k, j].script = pieces[x + k, j].obj.GetComponent<Piece>();
                    pieces[x + k, j].script.IntantiatePiece((sbyte)(x + k), (sbyte)j);
                }
            }
        }
        

        if (deleteAll)
        {
            for (int j = stageSize.y - 1; j >= 0; j--)
            {
                for (int h = stageSize.x - 1; h >= 0; h--)
                {
                    toDelete[toDeleteCount] = pieces[h, j];
                    toDeleteCount++;

                    //LateInstantiate(false, 0, 6);
                    pieces[h, j].obj = Instantiate(piecePrefab, GlobalUtils.GetPosByIndex((sbyte)(h), (sbyte)j, stageSize), Quaternion.identity);
                    pieces[h, j].obj.transform.SetParent(transform);
                    pieces[h, j].script = pieces[h, j].obj.GetComponent<Piece>();
                    pieces[h, j].script.IntantiatePiece((sbyte)(h), (sbyte)j);
                }
            }
        }

        gameManager.AddScoreAndVoltage(toDeleteCount, comboCount); // add all deteled block to score
        while (toDeleteCount > 0)
        {
            toDeleteCount--;
            toDelete[toDeleteCount].script.DeletePiece();
        }
    }

    if ((side & 0b0100) != 0) // vertical (down)
    {
        bool skipStep = true;
        bool deleteAll = false;
        sbyte[] r = { 0, 0, 0, 0, 0 };

        Debug.LogWarning($"R size: {r.Length}");

        while (k > 0)
        {
            k--;
            toDelete[toDeleteCount] = pieces[x, y + k];
            toDeleteCount++;
        }

        if (!beam)
        {
            switch (size)
            {
                case 3:
                    break;
                case 4:
                    r[0] = 25;
                    skipStep = false;
                    break;
                case 5:
                    r[0] = 25;
                    r[1] = (sbyte)(x - 1 < 0 ? 2 : -1);
                    r[2] = (sbyte)(x + 1 >= stageSize.x ? -2 : 1);

                    skipStep = false;
                    break;
            }

        }
        else

            switch (size)
            {
                case 3:
                    r[0] = 25;
                    skipStep = false;
                    break;
                case 4:
                    r[0] = 25;
                    r[1] = (sbyte)(x - 1 < 0 ? 2 : -1);
                    r[2] = (sbyte)(x + 1 >= stageSize.x ? -2 : 1);

                    skipStep = false;
                    break;
                case 5:
                    deleteAll = true;
                    break;

            }

        if (!deleteAll)
            for (int i = 0; i < r.Length; i++)
            {
                if (r[i] == 0)
                    continue;

                if (r[i] == 25)
                    r[i] = 0;

                for (int j = stageSize.y - 1; j >= 0; j--)
                {
                    toDelete[toDeleteCount] = pieces[x + r[i], j];
                    toDeleteCount++;
                }

                if (r[i] == 0)
                    r[i] = 25;
            }

        if (!deleteAll)
            if (skipStep)
            {
                if (y != 0)
                    for (sbyte i = (sbyte)(y - 1); i >= 0; i--)
                    {
                        Debug.Log($"x: {x}; y: {i}");

                        pieces[x, i].script.MovePiece(x, (sbyte)(i + size), GlobalUtils.GetPosByIndex(x, (sbyte)(i + size), stageSize));
                        pieces[x, i + size] = pieces[x, i];
                    }

                for (sbyte i = 0; i < size; i++)
                {
                    pieces[x, i].obj = Instantiate(piecePrefab, GlobalUtils.GetPosByIndex(x, i, stageSize), Quaternion.identity);
                    pieces[x, i].obj.transform.SetParent(transform);
                    pieces[x, i].script = pieces[x, i].obj.GetComponent<Piece>();
                    pieces[x, i].script.IntantiatePiece(x, i);
                }
            }
            else
            {
                for (int i = 0; i < r.Length; i++)
                {
                    if (r[i] == 0)
                        continue;

                    if (r[i] == 25)
                        r[i] = 0;


                    for (int j = stageSize.y - 1; j >= 0; j--)
                    {
                        pieces[x + r[i], j].obj = Instantiate(piecePrefab, GlobalUtils.GetPosByIndex((sbyte)(x + r[i]), (sbyte)j, stageSize), Quaternion.identity);
                        pieces[x + r[i], j].obj.transform.SetParent(transform);
                        pieces[x + r[i], j].script = pieces[x + r[i], j].obj.GetComponent<Piece>();
                        pieces[x + r[i], j].script.IntantiatePiece((sbyte)(x + r[i]), (sbyte)j);
                    }
                }
            }

        if (deleteAll)
        {
            for (int j = stageSize.y - 1; j >= 0; j--)
            {
                for (int h = stageSize.x - 1; h >= 0; h--)
                {
                    toDelete[toDeleteCount] = pieces[h, j];
                    toDeleteCount++;

                    //LateInstantiate(false, 0, 6);
                    pieces[h, j].obj = Instantiate(piecePrefab, GlobalUtils.GetPosByIndex((sbyte)(h), (sbyte)j, stageSize), Quaternion.identity);
                    pieces[h, j].obj.transform.SetParent(transform);
                    pieces[h, j].script = pieces[h, j].obj.GetComponent<Piece>();
                    pieces[h, j].script.IntantiatePiece((sbyte)(h), (sbyte)j);
                }
            }
        }
            
            
            

        gameManager.AddScoreAndVoltage(toDeleteCount, comboCount); // add all deteled block to score
        while (toDeleteCount > 0)
        {
            toDeleteCount--;
            toDelete[toDeleteCount].script.DeletePiece();
        }
    }
}

// debug square position
private void OnDrawGizmos()
{


    float[] offsets = (float[])GlobalUtils.stdOffsets.Clone();
    for (sbyte i = 0; i < stageSize.x; i++)
    {
        for (sbyte j = 0; j < stageSize.y; j++)
        {
            Gizmos.DrawCube(new Vector3(offsets[0] - 0.5f, offsets[1] + 0.5f, 0), Vector3.one / 2);
            offsets[1] -= GlobalUtils.stagePadding;
        }
        offsets[0] += GlobalUtils.stagePadding;
        offsets[1] = GlobalUtils.stdOffsets[1];
    }
}

```


### Block Shaders

```cpp

Shader "Custom/BlockShader"
{
    Properties
    {
        _MainTex ("Sprite Texture", 2D) = "white" {}
        _PaletteTex ("Palette Sprite", 2D) = "white" {}
        _Color ("Tint", Color) = (1,1,1,1)
        _CurrentPalette ("Palette Color", Float) = 0.0
    }

    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" "PreviewType"="Plane" }
        LOD 100
        Cull Off
        Lighting Off
        ZWrite Off
        Blend SrcAlpha OneMinusSrcAlpha

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata_t
            {
                float4 vertex : POSITION;
                float2 texcoord : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
                float height : TEXCOORD1;   // world-space height
            };

            sampler2D _MainTex;
            sampler2D _PaletteTex;
            float4 _MainTex_ST;
            float4 _PaletteTex_TexelSize;
            fixed4 _Color;
            float _CurrentPalette;
            float _ShieldHight = 0.0;

            v2f vert (appdata_t v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.texcoord, _MainTex);

                // Convert to world space and take Y component
                float3 worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;
                o.height = worldPos.y;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 texColor = tex2D(_MainTex, i.uv);

                // Palette texture width
                float paletteWidth = _PaletteTex_TexelSize.z;
                float stepX = 1.0 / paletteWidth;

                // Convert normalized red [0..1] to 0..255
                int red8 = (int)(texColor.r * 255.0);

                // Quantize by 0x22 (34 decimal)
                int quantized = red8 / 0x22;   // integer division
                if (quantized >= paletteWidth) quantized = paletteWidth - 1;

                // Use quantized index
                float2 targetUV = float2((quantized + 0.5) * stepX, 1.0 - ((_CurrentPalette + 1.5) / _PaletteTex_TexelSize.w));

                fixed4 targetColor = tex2D(_PaletteTex, targetUV);

                if (i.height < _ShieldHight)
                    return targetColor -= float4(0.5,0.5,0.5,0);

                return targetColor * _Color;
            }

            ENDCG
        }
    }
}


```

### Block Shaders

```bat

@echo off

if exist "C:\Program Files\Unity\Hub\Editor\2022.3.56f1\Editor\Unity.exe" set unity="C:\Program Files\Unity\Hub\Editor\2022.3.56f1\Editor\Unity.exe"
if exist "D:\Program Files\Unity\Editor\2022.3.56f1\Editor\Unity.exe" set unity="D:\Program Files\Unity\Editor\2022.3.56f1\Editor\Unity.exe"

set projName=DirectRush
set verbose=1


if exist "%cd%\Build\%projName%" rd /s /q "%cd%\Build\%projName%"
md "%cd%\Build\%projName%"


copy "%cd%\DefaultSettingsLauncher.bat" "%cd%\Build\%projName%\GameLauncher.bat"
type nul > "%cd%\Build\%projName%\BuildLogs.log"


cls
start "" %unity% -quit -batchmode -projectPath %cd% -executeMethod CommandLine.FastBuild -logFile "%cd%\Build\%projName%\BuildLogs.log"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0LogReader.ps1" -Command "%cd%\Build\%projName%\BuildLogs.log" "%verbose%"

pause

```

```

$LogPath = $Args[1]
$verboseFlag = $Args[2]

Get-Content "$LogPath" -Wait |
  ForEach-Object {
	
	
	# Skip empty or too-short lines safely
	if ($_.Length -lt 9) {
		
		if ($verboseFlag -eq 1) { Write-Host $_ } 
		return

	}
	
	
    $prefix = $_.Substring(0,9)
    if ($prefix -eq "[ps1bl][E") {
        Write-Host $_ -ForegroundColor Red
    }
    elseif ($prefix -eq "[ps1bl][W") {
        Write-Host $_ -ForegroundColor Yellow
    }
	elseif ($prefix -eq "[ps1bl][S") {
        Write-Host $_ -ForegroundColor Green
    }
    elseif ($prefix -eq "[ps1bl][L") {
        Write-Host $_
    }
	elseif ($verboseFlag -eq 1) { Write-Host $_ } 
	
	
	if ($_ -match "\[ps1bl\]\[Log\] Build Ended...") { break }
	
  }

return 0


```

```csharp

[MenuItem("Build/FastBuild")]
public static void FastBuild()
{

    string[] scenePaths = EditorBuildSettings.scenes
        .Where(s => s.enabled)
        .Select(s => s.path)
        .ToArray();

    BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
    buildPlayerOptions.scenes = scenePaths;
    buildPlayerOptions.locationPathName = $"{Directory.GetParent(Application.dataPath).FullName}/Build/{Application.productName}/{Application.productName}.exe";
    buildPlayerOptions.target = BuildTarget.StandaloneWindows64;
    buildPlayerOptions.options = BuildOptions.None;

    BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
    BuildSummary summary = report.summary;

    foreach (var step in report.steps)
    {
        foreach (var message in step.messages)
        {
            Console.WriteLine($"[ps1bl][{message.type}] {message.content}");
        }
    }

    // Always include summary
    Console.WriteLine("[ps1bl][Log] Build result: " + summary.result);
    if (summary.result == BuildResult.Succeeded)
    {
        Console.WriteLine($"[ps1bl][Success] Build Completed!");
    }
    else
    {
        Console.WriteLine($"[ps1bl][Error] Build Failed!");
    }
    Console.WriteLine("[ps1bl][Log] Total size: " + summary.totalSize + " bytes");
    Console.WriteLine("[ps1bl][Log] Total time: " + summary.totalTime);
    Console.WriteLine("[ps1bl][Log] Build Ended...");

}

```