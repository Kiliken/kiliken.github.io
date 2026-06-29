<a class="btn" href="https://github.com/Kiliken/FrancumEngine">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/githubIcon.svg#icon"></use>
  </svg>
  <span>GitHub</span>
</a>

<a class="btn" href="https://github.com/Kiliken/FrancumEngine/releases">
  <svg class="btn-icon" aria-hidden="true">
    <use xlink:href="./img/downloadIcon.svg#icon"></use>
  </svg>
  <span>Download</span>
</a>

# Francum Engine

## プロジェクトの概要

私は、レンダリングパイプラインを学び、ゲームエンジンがどのように動作するのかを理解するために、ゲームエンジンをゼロから自作することにしました。頻繁にマシンを切り替える必要があるため、手動でのインストールが一切不要で、複雑で肥大化したUIを排除したエンジンを求めていました。

ポータブルな **C++** ツールチェーンとスクリプト優先のワークフローを活用することで、あらゆる **Windows** マシンに即座に展開できるシステムを構築しました。

**OpenGL** を選んだ理由は、習得が容易であり、レンダリングロジック自体の理解に集中できるためですが、将来的には **Vulkan** への移行を計画しており、すでにいくつかのサイドプロジェクトで動作させています。

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=2Jgt69h8ZdM&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

---

## 主な技術的特徴

#### 技術スタック:

| 項目 | 採用技術 | 説明 |
|:--|:--:|--:|
| **コンパイラ** | w64devkit | C++17/20 対応のミニマルなツールチェーン |
| **ウィンドウ管理** | SDL3 | ハードウェア加速ウィンドウイング |
| **グラフィックスAPI** | OpenGL 4.6 (Core Profile) / GLAD | レンダリングおよび OpenGL 関数ローダー |
| **数学ライブラリ** | GLM | ヘッダーのみの線形代数ライブラリ |
| **スクリプト・ブリッジ** | Sol3 (LuaJIT 2.1) | 高性能な Lua ラッパー |
| **アセット解析** | cgltf | 軽量な glTF 2.0 パーサー |

### 1. モダンOpenGLとSPIR-Vシェーダーパイプライン
Vulkanのような低レイヤAPIに近い効率性と予測可能性を持たせるため、モダンなOpenGL機能を活用したアーキテクチャを実装しました。

* **バッファ・状態管理:** **VAO (Vertex Array Objects)** および **UBO (Uniform Buffer Objects)** を活用し、ステートチェンジを最小化。CPUからGPUへのデータ転送を最適化し、グローバルなシェーダー定数を効率的に管理しています。

```cpp
// GLSLのstd140レイアウト仕様に明示的にアライメントされた構造体
struct MaterialIDs
{
    int diffuse;
    int normal;
    int specular;
    int padding; // std140の16バイトアライメント規則を遵守するための手動パディング
};

// ...

Model::Model(/* ... */) 
{
    // 1. 最適なGPUキャッシュローカリティのためのインターリーブされた頂点バッファのセットアップ
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);

    // 頂点属性（Position, UV, Normal, Tangent, Bitangent）がここでマッピングされる...
    glEnableVertexAttribArray(0); 
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, position));
    // [可読性のために省略：属性1から4も同様に設定]

    glGenBuffers(1, &elementbuffer);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, elementbuffer);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), &indices[0], GL_STATIC_DRAW);

    // 2. UBOを介したハードウェアアクセラレーションによるユニフォーム共有
    // マテリアルユニフォームバッファの割り当て
    glGenBuffers(1, &MaterialUBO);
    glBindBuffer(GL_UNIFORM_BUFFER, MaterialUBO);
    glBufferData(GL_UNIFORM_BUFFER, sizeof(MaterialIDs), nullptr, GL_DYNAMIC_DRAW);
    glBindBufferBase(GL_UNIFORM_BUFFER, 1, MaterialUBO); // ユニフォームスロット1にバインド

    glBindVertexArray(0);
}

// ...

struct CameraUBO
{
    glm::mat4 V; // ビュー行列
    glm::mat4 P; // 投影行列
};

// ...

void Camera::BindToShader(){
    // カメラユニフォームバッファの割り当て（複数のシェーダー間で共有）
    glGenBuffers(1, &UBOID);
    glBindBuffer(GL_UNIFORM_BUFFER, UBOID);
    glBufferData(GL_UNIFORM_BUFFER, sizeof(CameraUBO), nullptr, GL_DYNAMIC_DRAW);
    glBindBufferBase(GL_UNIFORM_BUFFER, 2, UBOID); // ユニフォームスロット2にバインド
}
```

* **事前コンパイル済みシェーダー:** 実行時のGLSL文字列コンパイルではなく、**SPIR-V** ワークフローを統合。`glslangvalidator` をオフラインコンパイラとして使用することで、**GLSLまたはHLSL** で記述したシェーダーをバイナリとして読み込めるようにし、読み込み速度の向上と柔軟な開発環境を実現しました。

```cpp
struct BinaryData {
    size_t sizeBytes;
    std::vector<uint32_t> data; // SPIR-Vモジュールは32ビットワードの配列
};

BinaryData Utils::LoadBinaryFile(const char *path)
{
    std::ifstream file(path, std::ios::binary | std::ios::ate);
    if (!file.is_open()) return {};

    size_t fileSize = (size_t)file.tellg();

    // 重要な検証：SPIR-Vファイルは必ず4バイト（32ビットワード）の倍数でなければならない
    if (fileSize % 4 != 0) {
        printf("Error: SPIR-V file corrupted or unaligned: %s\n", path);
        return {};
    }

    BinaryData result;
    result.sizeBytes = fileSize;
    result.data.resize(fileSize / 4); // 32ビットワードの境界に基づいてメモリバッファのサイズを変更

    file.seekg(0, std::ios::beg);
    file.read(reinterpret_cast<char *>(result.data.data()), fileSize);
    file.close();

    return result;
}

// GL_ARB_gl_spirv | GL_ARB_spirv_extensions を使用
GLuint Utils::LoadSPIRV(const char *vertex_file_path, const char *fragment_file_path)
{
    BinaryData vsFile = LoadBinaryFile(vertex_file_path);
    BinaryData fsFile = LoadBinaryFile(fragment_file_path);

    // 事前コンパイルされたバイナリ中間表現（IR）を取り込む
    GLuint VertexShaderID = glCreateShader(GL_VERTEX_SHADER);
    glShaderBinary(1, &VertexShaderID, GL_SHADER_BINARY_FORMAT_SPIR_V_ARB, &vsFile.data[0], (GLsizei)vsFile.sizeBytes);
    
    // エントリポイントの特殊化 — 実行時の完全なコンパイルオーバーヘッドを回避
    glSpecializeShader(VertexShaderID, "VSMain", 0, nullptr, nullptr);

    GLuint FragmentShaderID = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderBinary(1, &FragmentShaderID, GL_SHADER_BINARY_FORMAT_SPIR_V_ARB, &fsFile.data[0], (GLsizei)fsFile.sizeBytes);
    glSpecializeShader(FragmentShaderID, "PSMain", 0, nullptr, nullptr);

    // 近代的で分離可能なプログラムパイプラインをリンクする
    GLuint ProgramID = glCreateProgram();
    glAttachShader(ProgramID, VertexShaderID);
    glAttachShader(ProgramID, FragmentShaderID);
    
    // 柔軟なパイプラインバインディングを可能にするため、プログラムに分離可能（separable）フラグを明示的に設定
    glProgramParameteri(ProgramID, GL_PROGRAM_SEPARABLE, GL_TRUE);
    glLinkProgram(ProgramID);

    // リンク後、中間シェーダーオブジェクトをクリーンアップ
    glDetachShader(ProgramID, VertexShaderID);
    glDetachShader(ProgramID, FragmentShaderID);
    glDeleteShader(VertexShaderID);
    glDeleteShader(FragmentShaderID);

    return ProgramID;
}
```

### 2. Sol3による高度なLuaスクリプト実装
プロトタイピングの高速化と、エンジン本体からのゲームロジックの分離を目的に、**Sol3** を用いてC++ API（トランスフォーム、モデル読み込み、入力処理等）を **Lua** に公開しました。

* **スクリプト主導の開発:** 全てのゲームループをスクリプト側で実行可能にしました。C++による描画バックエンドのパフォーマンスを維持しつつ、再ビルド不要でリアルタイムにロジックを更新できる柔軟性を備えています。

```cpp
class ScriptComponent 
{
public:
    sol::environment env;
    sol::function onStart;
    sol::function onUpdate;
    sol::function onDraw;

    ScriptComponent(sol::state &lua, const std::string &scriptPath)
        // サンドボックス化：グローバルから隔離された、固有のLua環境をインスタンス化する
        : env(lua, sol::create, lua.globals())
    {
        lua.script_file(scriptPath, env);

        // ネイティブのライフサイクルフックをスクリプト側のイベントハンドラーにバインドする
        onStart  = env["OnStart"];
        onUpdate = env["OnUpdate"];
        onDraw   = env["OnDraw"];
    }

    void Start()  { if (onStart.valid())  onStart(); }
    void Update(float dt) { if (onUpdate.valid()) onUpdate(dt); }
    void Draw()   { if (onDraw.valid())   onDraw(); }
};

// --- ネイティブAPIのリフレクション & 型登録 ---
void BindEngineToLua(sol::state &lua)
{
    // ネイティブC++の「Object」エンティティコンポーネント構造をLua VMに公開する
    lua.new_usertype<Object>("Object",
        sol::constructors<Object()>(),
        "Update",      &Object::Update,
        "Draw",        &Object::Draw,
        "SetPosition", &Object::SetPosition,
        "SetRotation", &Object::SetRotation,
        "SetScale",    &Object::SetScale
    );

    // ゲームプレイスクリプトから直接、実行時のアセット操作を許可する
    lua.new_usertype<Model>("Model",
        "SetTexture",     &Model::SetTexture,
        "SetNormalMap",   &Model::SetNormalMap,
        "SetSpecularMap", &Model::SetSpecularMap,
        "SetColor",       &Model::SetColor
    );

    // ハードウェア入力のポーリングシステムを登録する
    lua.new_usertype<Inputs>("Inputs",
        "IsKeyDown", &Inputs::IsKeyDown
    );
	
	// カメラ操作システムを登録する
    lua.new_usertype<Camera>("Camera", 
        "SetPosition", &Camera::SetPosition,
        "SetRotation", &Camera::SetRotation,
        "SetProjMode", &Camera::SetProjMode
    );
}
```


### 3. 高効率なアセットインジェクション (glTF & OBJ)
モダンなグラフィックスワークフローとの親和性を考慮し、**glTF 2.0** を主要フォーマットとして採用しました。

* **メッシュデータ処理:** **cgltf** ライブラリを使用し、JSON形式の `.gltf` およびバイナリ形式の `.glb` の両方を高速にパースするローダーを実装。
* **レガシーサポート:** モデリング工程での互換性を維持するため、**Wavefront .obj** 形式もサポートし、多様な3Dツールに対応しています。

### 4. ポータブルな「ゼロ・インストール」開発環境
従来のIDEや重いパッケージマネージャーによるオーバーヘッドを排除するため、**Batch/PowerShell** を組み合わせた独自のエコシステムを構築しました。

* **ワークフロー:** 単一の実行ファイルにより、ホスト環境の検証、**w64devkit** (Portable GCC/Make) の設定、**Lua** ランタイムの構成を自動で行います。

```
# setup/InstallEngine.ps1 (環境自動構築スクリプト)
$ProjectRoot = "$($PSScriptRoot)\.."

# 1. ディレクトリ構造の自動生成（決定論的なビルド環境の確立）
New-Item -Path "$($ProjectRoot)\dep" -ItemType Directory -Force | Out-Null
New-Item -Path "$($ProjectRoot)\build" -ItemType Directory -Force | Out-Null
New-Item -Path "$($ProjectRoot)\dep\include\sol" -ItemType Directory -Force | Out-Null
New-Item -Path "$($ProjectRoot)\dep\lib" -ItemType Directory -Force | Out-Null

$sdlDownloadUrl = "https://github.com/libsdl-org/SDL/releases/download/release-3.4.10/SDL3-devel-3.4.10-mingw.zip"
$glmDownloadUrl = "https://github.com/g-truc/glm/releases/download/1.0.2/glm-1.0.2.zip"
$imguiDownloadUrl = "https://github.com/ocornut/imgui/archive/refs/tags/v1.92.5.zip"

# 2. 冪等性（Idempotency）を保証した条件付きアセットダウンロード
if ( -not (Test-Path "$($PSScriptRoot)\sdl.zip")){
	curl.exe -L "$sdlDownloadUrl" -o "$($PSScriptRoot)\sdl.zip" --progress-bar
}
if ( -not (Test-Path "$($PSScriptRoot)\glm.zip")){
	curl.exe -L "$glmDownloadUrl" -o "$($PSScriptRoot)\glm.zip" --progress-bar
}
if ( -not (Test-Path "$($PSScriptRoot)\imgui.zip")){
	curl.exe -L "$imguiDownloadUrl" -o "$($PSScriptRoot)\imgui.zip" --progress-bar
}

# 3. .NETアセンブリを使用したアーカイブの解凍処理
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$($PSScriptRoot)\sdl.zip", "$($PSScriptRoot)")
[System.IO.Compression.ZipFile]::ExtractToDirectory("$($PSScriptRoot)\glm.zip", "$($PSScriptRoot)")
[System.IO.Compression.ZipFile]::ExtractToDirectory("$($PSScriptRoot)\imgui.zip", "$($ProjectRoot)\dep\include")

# 4. サードパーティ製ライブラリ（インクルードヘッダー / バイナリ）のマッピング
# SDL3の配置
Copy-Item -Path "$($PSScriptRoot)\SDL3-3.4.10\x86_64-w64-mingw32\include\SDL3" -Destination "$($ProjectRoot)\dep\include" -Recurse
Copy-Item -Path "$($PSScriptRoot)\SDL3-3.4.10\x86_64-w64-mingw32\bin\SDL3.dll" -Destination "$($ProjectRoot)\build" -Force
Copy-Item -Path "$($PSScriptRoot)\SDL3-3.4.10\x86_64-w64-mingw32\lib\libSDL3.dll.a" -Destination "$($ProjectRoot)\dep\lib" -Force

# GLM / GLAD / Sol3 / cgltf / ImGui の各種マッピング処理（一連の依存関係の集約）
Copy-Item -Path "$($PSScriptRoot)\glm\glm" -Destination "$($ProjectRoot)\dep\include" -Recurse
Copy-Item -Path "$($PSScriptRoot)\common\sol.hpp" -Destination "$($ProjectRoot)\dep\include\sol" -Force
Copy-Item -Path "$($PSScriptRoot)\common\cgltf.h" -Destination "$($($ProjectRoot))\dep\include" -Force

Rename-Item -Path "$($ProjectRoot)\dep\include\imgui-1.92.5" -NewName "imgui"
Copy-Item -Path "$($ProjectRoot)\dep\include\imgui\backends\imgui_impl_opengl3.cpp" -Destination "$($ProjectRoot)\dep\include\imgui"
Copy-Item -Path "$($ProjectRoot)\dep\include\imgui\backends\imgui_impl_sdl3.cpp" -Destination "$($ProjectRoot)\dep\include\imgui"

# 5. ワークスペースのクリーンアップ（不要な中間展開ディレクトリの自動破棄）
Remove-Item -Path "$($PSScriptRoot)\SDL3-3.4.10" -Recurse -Force
Remove-Item -Path "$($PSScriptRoot)\glm" -Recurse -Force

return 0
```

---

## 技術的な成長と考察
このプロジェクトを通じて、非常に多くの教訓を得られたと感じています。

#### グラフィックスAPIと近代的なレンダリングアーキテクチャ
グラフィックスAPIについても多くを学びました。当然ながらレンダリングパイプラインについても学習し、**OpenGL 3.3** から始めて **4.6** に至るまでを経験したことで、パイプラインの進化や、**SPIR-V**、明示的なメモリ管理を伴うセミプリコンパイル済みシェーダといった現代のソリューションにどのように到達したのかを理解することができました。さらに、リンクのために **GLAD** のようなモダンなライブラリの使用を余儀なくされたことで、グラフィックスAPIがシステムによってどのように呼び出され、管理されているのかを把握できました。これは、**Vulkan** を **LunarG** なしでロードする方法を理解する大きな足がかりとなりました。**GLAD** を介して呼び出しとリンクを行い、手動の作業とリポジトリにコピーしたシステム用 .dll ファイルを追加することで、拡張機能を実装することができたからです。

#### ビルドパイプラインとツールチェーン
IDEを使わずにポータブルコンパイラを利用したことで、プログラムのコンパイル、リンク、ビルドという一連のパイプライン全体を理解することができました。コンパイラを通常とは異なる視点から捉えることで、`gcc` のような各種コンパイラの仕組みを理解できただけでなく、他のプロジェクトで以前から使用しており、現在も使用しているツール（**Visual Studio** の `cl` など）についても、より深く理解できるようになりました。

#### 環境の自動化と依存関係管理
`batch` ファイルや **Windows PowerShell** を活用して、ファイルのダウンロード、展開、移動を自動化し、環境を最適化することで、複数の依存関係をセットアップし、堅牢でポータブルな作業環境を構築する方法を学びました。

#### アセットインポートと3Dパイプライン
3Dモデルについても、頂点、マテリアル、テクスチャがゲームエンジン内でどのようにインポートされ、処理されるのかについて深く学びました。

#### クロスエンジンへの応用と最適化マインドセット
最近になって、このプロジェクトで得た知識を **Unity** や **Unreal** といった他の分野のゲーム制作にも無意識のうちに応用し始めていることに気づきました。レンダリングがどのように実行されるか（どのグラフィックスAPIをいつ使用するかなど）をより慎重に検討するようになり、肥大化したUIを効率化するツールの作成や、商用エンジン特有の低速で複雑なビルドシステムの最適化など、エンジン自体の改善に注力するようになりました。

---

## 今後の展望

* **スクリプタブルUI:** **Sol3** と **ImGui** を統合し、 **Lua** スクリプトからカスタムUIを開発可能にする。
* **物理エンジンの統合:** 独自の衝突判定システムの実装、または **Bullet Physics** の統合。
* **スタンドアロン配布:** アセットとスクリプトを単一の実行ファイルに埋め込み、配布を容易にするビルドシステムの開発。
* **モダンなテクスチャパイプライン:** 現在の `.dds`(DirectDraw Surface) から、より圧縮効率と互換性に優れた `.ktx2`(Khronos Texture) フォーマットへの移行。
* **APIの進化:** **OpenGL** から **Vulkan** へ完全に移行し、ハードウェアのメモリ管理とコマンドバッファのより緻密な制御を実現する。