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

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=2YjD539dECo&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

## My Contribution

### Rendering

<details>
<summary> <h4>main.cpp (Code)</h4> </summary>

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

</details>