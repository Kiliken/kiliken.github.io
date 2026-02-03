<a class="btn" href="https://github.com/Kiliken/SinNoHate">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/githubIcon.svg#icon"></use>
  </svg>
  <span>GitHub</span>
</a>

<a class="btn" href="https://github.com/Kiliken/SinNoHate/releases">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/downloadIcon.svg#icon"></use>
  </svg>
  <span>Download</span>
</a>


# 罪の果て
_(シンのはて)_

[OpenSiv3D](https://siv3d.github.io/ja-jp/) フレームワークを使用して開発された、**ハイスピード・トップダウン・アーケードシューティング**です。ゲームジャム「[Bandai Namco Studio Cup | Siv3D Game Jam 2025](https://siv3d.github.io/ja-jp/event/gamejam/)」の参加作品として制作されました。

<a href="https://bandainamcostudios.connpass.com/event/364446/">
  <img src="https://raw.githubusercontent.com/Siv3D/siv3d.site.resource/main/v7/bnscup.png"/>
</a>


---

## 🎬 プレゼンテーション


<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=8uXQnZTJJ5E&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

---


## 🎮 操作方法

| アクション | キー |
| :---: | :---: |
| 移動 | WASD |
| 攻撃 | Space / MouseL |
| 終了 | Esc |


### 遊び方
押し寄せる敵の波を退け、画面上のすべての「罪（Sins）」を浄化することが目的です。最終ボスを倒して翼を取り戻し、地獄からの脱出を目指しましょう。

---

## My Contribution

### Enemies

<details>
<summary> <h4>main.cpp (Code)</h4> </summary>

```cpp

// EnemyLoop
if(!gameOver.gameOver){
    for (auto enemy = enemies.begin(); enemy != enemies.end();)
    {
        if (enemy->Update())
        {
            enemy = enemies.erase(enemy);
            continue;
        }

        bool erased = false;
        for (const auto &bullet : playerController.GetBullets())
        {
            if (bullet->GetCollider()->intersects(enemy->GetCollider()))
            {
                if (RandomInt32() % 20 < 1)
                    hearts << Hearts(enemy->GetCollider().center, &playerController);

                enemySound.stop();
                bullet->OnHit();
                effect.add<Spark>(enemy->GetCollider().center,enemy->GetEnemyType());
                enemy = enemies.erase(enemy);
                enemySound.play();
                erased = true;
                currentScore += enemyScore;
                break;
            }
        }

        if (!erased)
            ++enemy;
    }
}

{

    // Draw the enemies
    Graphics2D::SetPSTexture(1, enemyPaletteTexture);
    const ScopedCustomShader2D shader{paletteSwap}; // enemy shader palette

    for (auto &enemy : enemies)
    {
        Graphics2D::SetPSConstantBuffer(1, enemyPalette[enemy.GetEnemyType()]);
        enemy.Draw();
    }

    if (map.currentLayer == map.layerCount - 1 && boss.GetStatus())
    {
        Graphics2D::SetPSConstantBuffer(1, enemyPalette[boss.GetCurretType()]);
        boss.Draw();
    }
}


```

</details>

### Palette Shader

<details>
<summary> <h4>colorSwap.hlsl  (Code)</h4> </summary>

```cpp

//
//	Textures
//
Texture2D g_texture0 : register(t0);
Texture2D g_texture1 : register(t1);
SamplerState g_sampler0 : register(s0);
SamplerState g_sampler1 : register(s1);

namespace s3d
{
	//
	//	VS Output / PS Input
	//
	struct PSInput
	{
		float4 position : SV_POSITION;
		float4 color : COLOR0;
		float2 uv : TEXCOORD0;
	};
}

cbuffer PSConstants2D : register(b0)
{
	float4 g_colorAdd;
	float4 g_sdfParam;
	float4 g_sdfOutlineColor;
	float4 g_sdfShadowColor;
	float4 g_internal;
}

cbuffer PaletteSettings : register(b1)
{
	uint currentPalette;
}

//
//	Functions
//


float absf(float x)
{
    return (x < 0.0f) ? -x : x;
}

float4 PS_PaletteSwap(s3d::PSInput input) : SV_TARGET
{
    float4 texColor = g_texture0.Sample(g_sampler0, input.uv);

    uint paletteWidth, paletteHeight;
    g_texture1.GetDimensions(paletteWidth, paletteHeight);

    float stepX = 1.0f / paletteWidth;
    float stepY = 1.0f / paletteHeight;
	
    for (uint i = 0; i < paletteWidth; i++)
    {
        float2 sourceUV = float2((i + 0.5f) * stepX, 0.5f * stepY);
        float4 sourceColor = g_texture1.Sample(g_sampler1, sourceUV);

        float3 diff = texColor.rgb - sourceColor.rgb;
		
        if (absf(diff.r) < 0.01f && absf(diff.g) < 0.01f && absf(diff.b) < 0.01f && texColor.a > 0.01f)
        {
            float2 targetUV = float2((i + 0.5f) * stepX, (currentPalette + 0.5f) * stepY);
            float4 targetColor = g_texture1.Sample(g_sampler1, targetUV);
            texColor = targetColor;
        }
    }

    return (texColor * input.color) + g_colorAdd;
}



```

</details>

### Particles

<details>
<summary> <h4>utils.h (Code)</h4> </summary>

```cpp

struct Spark : IEffect
{
    Array<Particle> m_particles;
    Texture enemyPalette;

    explicit Spark(const Vec2 &start, const int8_t &type)
        : m_particles(50),enemyPalette{Resource(U"Assets/EnemyPalette.png")}
    {
        for (auto &particle : m_particles)
        {
            particle.start = (start + RandomVec2(12.0));
            particle.velocity = (RandomVec2(1.0) * Random(100.0));
            particle.type = type;
            particle.color = ((RandomUint8() % 5) + 3);
        }
    }

    bool update(double t) override
    {
        for (const auto &particle : m_particles)
        {
            const Vec2 pos = (particle.start + particle.velocity * t + 0.5 * t * t * Vec2{0, 240});

            const double size = 10.0 * (1.0 - t);
            const double angle = pos.x * 10_deg;

            enemyPalette(particle.color, particle.type, 1, 1).resized(size).rotated(angle).drawAt(pos);
        }

        return (t < 1.0);
    }
};

struct RingEffect : IEffect
{
    Vec2 m_pos;

    ColorF m_color;

    explicit RingEffect(const Vec2 &pos)
        : m_pos{pos}, m_color{Palette::Lightcoral} {}

    bool update(double t) override
    {
        // Easing
        const double e = EaseOutExpo(t);

        Circle{m_pos, (e * 100)}.drawFrame((20.0 * (1.0 - e)), m_color);

        return (t < 1.0);
    }
};

struct Feathers : IEffect
{
    Array<Particle> m_particles;
    Texture featherTexture;

    explicit Feathers(const Vec2 &start)
        : m_particles(7), featherTexture{Resource(U"Assets/featherSprite.png")}
    {
        for (auto &particle : m_particles)
        {
            particle.start = start + RandomVec2(8.0) + Vec2{0.0, 15.0};
            particle.velocity = Vec2{Random(-20.0, 20.0), Random(-30.0, -10.0)};
        }
    }

    bool update(double t) override
    {
        for (const auto &particle : m_particles)
        {
            double sway = 20.0 * Sin(2.0 * t + particle.start.y * 0.1);

            Vec2 pos = particle.start + particle.velocity * t + 0.5 * Vec2{0, 40.0} * t * t;
            pos.x += sway;

            const double size = 16.0 * (1.0 - t * 0.5);
            const double angle = sway * 0.05;

            featherTexture.resized(size).rotated(angle).drawAt(pos);
        }

        return (t < 2.0);
    }
};

```

</details>

---

## 👥 メンバー
* **Nicholas Pike Coleman** : 企画、サウンドデザイン
* **Zayar Aung** : プログラマー
* **Kento Hara** : プログラマー
* **Francesco Paolo Mariani** : プログラマー
* **Yu Ren Chen** : 2Dデザイン、プログラマー


---


## 🎵 外部アセット

| 用途 | 出典 / ライセンス | 作曲家 / 曲名 |
| :--- | :--- | :--- |
| **タイトルBGM** | [Uppbeat.io](https://uppbeat.io/t/locran/lacrimosa-requiem-mozart) | Locran - *Lacrimosa Requiem* (Mozart) |
| **ゲーム中BGM** | [Archive.org](https://archive.org/details/lp_dante-symphony_franz-liszt-margit-lszlo-the-budapest-phil) | Franz Liszt - *Dante Symphony* |