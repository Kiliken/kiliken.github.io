<a class="btn" href="https://github.com/Kiliken/Direct2D_FPS">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/githubIcon.svg#icon"></use>
  </svg>
  <span>GitHub</span>
</a>

<a class="btn" href="https://github.com/Kiliken/Direct2D_FPS/releases">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/downloadIcon.svg#icon"></use>
  </svg>
  <span>Download</span>
</a>


# Direct2D Raycaster

Direct2D Raycasterは、Wolfenstein 3Dなどの初期3Dゲームで採用されたクラシックなレイキャスティング技術を学ぶことを目的とした教育用プロジェクトです。描画には Microsoft Direct2D、ウィンドウ管理や入力処理には SDL3 を使用し、3DグラフィックスAPIを用いずに2D描画のみで擬似3D空間を描画するレンダラーを実装しました。

レイキャスティングによる壁描画、テクスチャマッピング、ビルボードスプライト描画、深度バッファを用いたオクルージョン処理など、初期3Dエンジンで用いられていた基本的なレンダリング手法を一から実装しています。

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=2YjD539dECo&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

## 担当部分・実装実績

### レンダリング

プレイヤーの視点からスクリーンの各列に対してレイを射出し、DDA（Digital Differential Analyzer）アルゴリズムを用いてマップ内の壁との交差判定を行うレイキャスティング処理を実装しました。

壁との衝突位置からテクスチャ座標を算出し、CPU上でテクスチャをサンプリングしてフレームバッファへ直接描画しています。また、壁の向きに応じた簡易ライティングや、スプライト描画のための深度バッファ（Z-buffer）も実装し、壁による適切なオクルージョン処理を実現しています。

```cpp
for (int x = 0; x < width; ++x)
        {
            float camX = ((2.0f * x) / (float)width) - 1.0f;

            D2D_POINT_2F dir = {
                std::cos(player->angle) + planeHalf * camX * (-std::sin(player->angle)),
                std::sin(player->angle) + planeHalf * camX * (std::cos(player->angle))};

            int mapX = (int)player->pos.x;
            int mapY = (int)player->pos.y;

            float sideDistX;
            float sideDistY;

            float deltaDistX = (dir.x == 0.0f) ? 1e30f : std::fabs(1.0f / dir.x);
            float deltaDistY = (dir.y == 0.0f) ? 1e30f : std::fabs(1.0f / dir.y);

            int stepX;
            int stepY;

            int hit = 0;
            int side = 0;
            int tile = 0;

            if (dir.x < 0)
            {
                stepX = -1;
                sideDistX = (player->pos.x - mapX) * deltaDistX;
            }
            else
            {
                stepX = 1;
                sideDistX = (mapX + 1.0f - player->pos.x) * deltaDistX;
            }

            if (dir.y < 0)
            {
                stepY = -1;
                sideDistY = (player->pos.y - mapY) * deltaDistY;
            }
            else
            {
                stepY = 1;
                sideDistY = (mapY + 1.0f - player->pos.y) * deltaDistY;
            }

            while (!hit)
            {
                if (sideDistX < sideDistY)
                {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                }
                else
                {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }

                tile = getTile(mapX, mapY);

                if (mapX < 0 || mapX >= mapWidth || mapY < 0 || mapY >= mapHeight)
                {
                    hit = 1;
                    break;
                }
                if (tile != '.')
                {
                    hit = 1;
                }
            }

            float perpWallDist = (side == 0) ? (sideDistX - deltaDistX) : (sideDistY - deltaDistY);
            if (perpWallDist < 0.0001f)
                perpWallDist = 0.0001f;

            int lineHeight = (int)(height / perpWallDist);
            int drawStart = -lineHeight / 2 + (int)halfH;
            int drawEnd = lineHeight / 2 + (int)halfH;
            if (drawStart < 0)
                drawStart = 0;
            if (drawEnd >= height)
                drawEnd = height - 1;

            int wallTextureNum = (int)wallTypes.find(tile)->second;

            double wallX;
            if (side == 0)
                wallX = player->pos.y + perpWallDist * dir.y;
            else
                wallX = player->pos.x + perpWallDist * dir.x;
            wallX -= floor(wallX);

            int texX = int(wallX * double(texture_wall_size));
            if (side == 0 && dir.x > 0)
                texX = texture_wall_size - texX - 1;
            if (side == 1 && dir.y < 0)
                texX = texture_wall_size - texX - 1;

            double step = 1.0 * double(texture_wall_size) / lineHeight;
            double texPos = (drawStart - height / 2 + lineHeight / 2) * step;

            float shade = (side == 1) ? 0.75f : 1.0f;

            texture_coords.x = texX + (wallTextureNum % 4) * texture_wall_size;

            for (int y = 0; y < height; y++)
            {
                int currentPixel = (y * width + x) * 4;

                if (y <= drawStart || y >= drawEnd)
                {
                    pixels[currentPixel + 0] = 0x00;
                    pixels[currentPixel + 1] = 0x00;
                    pixels[currentPixel + 2] = 0x00;
                    pixels[currentPixel + 3] = 0x00;
                    continue;
                }

                int texY = (int)texPos & (texture_wall_size - 1);
                texPos += step;

                texture_coords.y = texY + (wallTextureNum / 4) * texture_wall_size;

                SDL_Color pixelColor = GetPixelColor(textureBitmap, texture_coords.x, texture_coords.y);

                pixels[currentPixel + 0] = BYTE(pixelColor.b * shade);
                pixels[currentPixel + 1] = BYTE(pixelColor.g * shade);
                pixels[currentPixel + 2] = BYTE(pixelColor.r * shade);
                pixels[currentPixel + 3] = 0xFF;
            }

            depthBuffer[x] = perpWallDist;
        }

bitmap->CopyFromMemory(nullptr, pixels.data(), width * 4);

pRenderTarget->DrawBitmap(bitmap, D2D1::RectF(0, 0, (FLOAT)width, (FLOAT)height));

enemyManager.RenderBillboards(pRenderTarget, enemyBrush, textureBitmap, depthBuffer,
                              width, height, halfH, player->pos, player->angle, planeHalf);
```


## 移動判定

プレイヤーやエンティティの移動判定を担当する処理です。

単一点ではなく矩形（AABB）として当たり判定を行い、オブジェクトが占有する範囲内のすべてのマップタイルを走査することで、壁へのめり込みやマップ外への移動を防止しています。

```cpp
bool canMove(D2D_POINT_2F position, D2D_POINT_2F size)
{
    // create the corners of the rectangle
    D2D_POINT_2F upper_left = D2D1::Point2F(position.x - size.x / 2.0f, position.y - size.y / 2.0f);
    D2D_POINT_2F lower_right = D2D1::Point2F(position.x + size.x / 2.0f, position.y + size.y / 2.0f);

    if (upper_left.x < 0.0 || upper_left.y < 0.0 || lower_right.x >= mapWidth || lower_right.y >= mapHeight)
    {
        return false; // out of map bounds
    }
    
    // loop through each map tile within the rectangle. The rectangle could be multiple tiles in size!
    for (int y = upper_left.y; y <= lower_right.y; ++y)
    {
        for (int x = upper_left.x; x <= lower_right.x; ++x)
        {
            if (getTile(x, y) != '.')
            {
                return false;
            }
        }
    }
    return true;
}
```

## マップ検証

ゲーム開始前にマップデータの整合性を検証するためのバリデーション処理です。

以下の内容をチェックしています。

- マップサイズが定義値と一致しているか
- 未定義のタイルタイプが含まれていないか
- マップ外周が壁で囲まれているか

これにより、不正なマップデータによる描画エラーやゲーム進行中の予期しない挙動を未然に防止しています。

```cpp
bool mapCheck() {
    // check size
    int mapSize = sizeof(worldMap) - 1; // - 1 because sizeof also counts the final NULL character
    if (mapSize != mapWidth * mapHeight)
    {
        fprintf(stderr, "Map size(%d) is not mapWidth * mapHeight(%d)\n", mapSize, mapWidth * mapHeight);
        return false;
    }

    for (int y = 0; y < mapHeight; ++y)
    {
        for (int x = 0; x < mapWidth; ++x)
        {
            char tile = getTile(x, y);
            // check if tile type is valid
            if (tile != '.' && wallTypes.find(tile) == wallTypes.end())
            {
                fprintf(stderr, "map tile at [%3d,%3d] has an unknown tile type(%c)\n", x, y, tile);
                return false;
            }
            // check if edges are walls
            if ((y == 0 || x == 0 || y == mapHeight - 1 || x == mapWidth - 1) &&
                tile == '.')
            {
                fprintf(stderr, "map edge at [%3d,%3d] is a floor (should be wall)\n", x, y);
                return false;
            }
        }
    }
```