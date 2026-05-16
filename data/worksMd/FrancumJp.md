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

[「English」](mdRenderer.html?mdurl=./data/worksMd/FrancumEn.md)

## プロジェクトの概要

私は、レンダリングパイプラインを学び、ゲームエンジンがどのように動作するのかを理解するために、ゲームエンジンをゼロから自作することにしました。頻繁にマシンを切り替える必要があるため、手動でのインストールが一切不要で、複雑で肥大化したUIを排除したエンジンを求めていました。

ポータブルな **C++** ツールチェーンとスクリプト優先のワークフローを活用することで、あらゆる **Windows** マシンに即座に展開できるシステムを構築しました。

 **OpenGL** を選んだ理由は、習得が容易であり、レンダリングロジック自体の理解に集中できるためですが、将来的には **Vulkan** への移行を計画しており、すでにいくつかのサイドプロジェクトで動作させています。

---

## 主な技術的特徴

### 1. ポータブルな「ゼロ・インストール」開発環境
従来のIDEや重いパッケージマネージャーによるオーバーヘッドを排除するため、**Batch/PowerShell** を組み合わせた独自のエコシステムを構築しました。

* **ワークフロー:** 単一の実行ファイルにより、ホスト環境の検証、**w64devkit** (Portable GCC/Make) の設定、**Lua** ランタイムの構成を自動で行います。

```bat
:: //...

:FileCheck
if not exist "%localappdata%/w64devkit" goto InstallGcc
if not exist "%localappdata%/lua-5.3.4" goto InstallLua
if exist "%cd%/dep" goto ExitProgram

:SetupProject
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup/InstallEngine.ps1"
echo Project Setup completed...
pause
exit

:InstallGcc
echo Installing Gcc...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup/InstallGcc.ps1"
echo Waiting for Gcc to finish installing...
pause
goto FileCheck

:InstallLua
echo Installing Lua...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup/InstallLua.ps1"
echo Waiting for Lua to finish installing...
pause
goto FileCheck

:: //...
```

* **技術スタック:**
    * **コンパイラ:** w64devkit (C++17/20 対応のミニマルなツールチェーン)
    * **ウィンドウ管理:** GLFW (ハードウェア加速ウィンドウイング)
    * **グラフィックスAPI:** OpenGL 4.6 (Core Profile) / GLAD
    * **数学ライブラリ:** GLM (ヘッダーのみの線形代数ライブラリ)
    * **スクリプト・ブリッジ:** Sol3 (高性能なLuaラッパー)
    * **アセット解析:** cgltf (軽量なglTF 2.0パーサー)

### 2. モダンOpenGLとSPIR-Vシェーダーパイプライン
Vulkanのような低レイヤAPIに近い効率性と予測可能性を持たせるため、モダンなOpenGL機能を活用したアーキテクチャを実装しました。

* **バッファ・状態管理:** **VAO (Vertex Array Objects)** および **UBO (Uniform Buffer Objects)** を活用し、ステートチェンジを最小化。CPUからGPUへのデータ転送を最適化し、グローバルなシェーダー定数を効率的に管理しています。

```cpp
struct CameraUBO
{
    glm::mat4 M;
    glm::mat4 V;
    glm::mat4 P;
};

struct MaterialIDs
{
    int diffuse;
    int normal;
    int specular;
    int padding; // for std140 specification
};

// ...

Model::Model(/* ... */) {
    // Vertex Array
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    // Vertex Buffer
    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);

    glEnableVertexAttribArray(0); // position
    glVertexAttribPointer(
        0, 3, GL_FLOAT, GL_FALSE,
        sizeof(Vertex),
        (void *)offsetof(Vertex, position));

    // ...

    glEnableVertexAttribArray(4); // bitangent
    glVertexAttribPointer(
        4, 3, GL_FLOAT, GL_FALSE,
        sizeof(Vertex),
        (void *)offsetof(Vertex, bitangent));

    // Index Buffer
    glGenBuffers(1, &elementbuffer);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, elementbuffer);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), &indices[0], GL_STATIC_DRAW);

    DiffuseTexture = loadDDS("../res/baseDiffuse.dds");
    // ...

    glGenBuffers(1, &MaterialUBO);
    glBindBuffer(GL_UNIFORM_BUFFER, MaterialUBO);
    glBufferData(GL_UNIFORM_BUFFER, sizeof(MaterialIDs), nullptr, GL_DYNAMIC_DRAW);
    glBindBufferBase(GL_UNIFORM_BUFFER, 1, MaterialUBO);

    glGenBuffers(1, &CamUBOID);
    glBindBuffer(GL_UNIFORM_BUFFER, CamUBOID);
    glBufferData(GL_UNIFORM_BUFFER, sizeof(CameraUBO), nullptr, GL_DYNAMIC_DRAW);
    glBindBufferBase(GL_UNIFORM_BUFFER, 2, CamUBOID);
    // ...

    glBindVertexArray(0);
}
```

* **事前コンパイル済みシェーダー:** 実行時のGLSL文字列コンパイルではなく、**SPIR-V** ワークフローを統合。`glslangvalidator` をオフラインコンパイラとして使用することで、**GLSLまたはHLSL** で記述したシェーダーをバイナリとして読み込めるようにし、読み込み速度の向上と柔軟な開発環境を実現しました。

```cpp
// Using GL_ARB_gl_spirv | GL_ARB_spirv_extensions
GLuint LoadSPIRV(const char *vertex_file_path, const char *fragment_file_path)
{
	// Load SPIR-V files
	BinaryData vsFile = LoadBinaryFile(vertex_file_path);
	BinaryData fsFile = LoadBinaryFile(fragment_file_path);

	GLint Result = GL_FALSE;
	int InfoLogLength;

	GLuint VertexShaderID = glCreateShader(GL_VERTEX_SHADER);
	glShaderBinary(1, &VertexShaderID, GL_SHADER_BINARY_FORMAT_SPIR_V_ARB, &vsFile.data[0], (GLsizei)vsFile.sizeBytes);
	glSpecializeShader(VertexShaderID, "VSMain", 0, nullptr, nullptr);

	GLuint FragmentShaderID = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderBinary(1, &FragmentShaderID, GL_SHADER_BINARY_FORMAT_SPIR_V_ARB, &fsFile.data[0], (GLsizei)fsFile.sizeBytes);
	glSpecializeShader(FragmentShaderID, "PSMain", 0, nullptr, nullptr);
	
    // Reference: https://wikis.khronos.org/opengl/SPIR-V

	// Link the program
	printf("Linking program\n");
	GLuint ProgramID = glCreateProgram();
	glAttachShader(ProgramID, VertexShaderID);
	glAttachShader(ProgramID, FragmentShaderID);
	glProgramParameteri(ProgramID, GL_PROGRAM_SEPARABLE, GL_TRUE);
	glLinkProgram(ProgramID);

	// Check the program
	glGetProgramiv(ProgramID, GL_LINK_STATUS, &Result);
	glGetProgramiv(ProgramID, GL_INFO_LOG_LENGTH, &InfoLogLength);
	if (InfoLogLength > 0)
	{
		std::vector<char> ProgramErrorMessage(InfoLogLength + 1);
		glGetProgramInfoLog(ProgramID, InfoLogLength, NULL, &ProgramErrorMessage[0]);
		printf("%s\n", &ProgramErrorMessage[0]);
	}

	glDetachShader(ProgramID, VertexShaderID);
	glDetachShader(ProgramID, FragmentShaderID);

	glDeleteShader(VertexShaderID);
	glDeleteShader(FragmentShaderID);

	return ProgramID;
}
```

### 3. Sol3による高度なLuaスクリプト実装
プロトタイピングの高速化と、エンジン本体からのゲームロジックの分離を目的に、**Sol3** を用いてC++ API（トランスフォーム、モデル読み込み、入力処理等）を **Lua** に公開しました。

* **スクリプト主導の開発:** 全てのゲームループをスクリプト側で実行可能にしました。C++による描画バックエンドのパフォーマンスを維持しつつ、再ビルド不要でリアルタイムにロジックを更新できる柔軟性を備えています。

```cpp
std::vector<std::string> GetScriptsInFolder(const std::string &folderPath)
{
    std::vector<std::string> scripts;

    for (const auto &entry : std::filesystem::directory_iterator(folderPath))
    {
        if (entry.is_regular_file())
        {
            auto path = entry.path();
            if (path.extension() == ".lua")
            {
                scripts.push_back(path.string());
            }
        }
    }

    return scripts;
}

void BindFunctions(sol::state &lua)
{
    lua.new_usertype<Object>("Object",
                             sol::constructors<Object()>(),
                              "Update", &Object::Update,
                              "Draw", &Object::Draw,
                              "AddModels", &Object::AddModels,
                              "GetModel", &Object::GetModel,
                              "SetPosition", &Object::SetPosition,
                              "SetRotation", &Object::SetRotation,
                              "SetScale", &Object::SetScale);

    lua.new_usertype<Model>("Model",
                             "SetTexture", &Model::SetTexture,
                             "SetNormalMap", &Model::SetNormalMap,
                             "SetSpecularMap", &Model::SetSpecularMap);

    lua.new_usertype<Inputs>("Inputs", 
                              "IsKeyDown", &Inputs::IsKeyDown);
}
```


### 4. 高効率なアセットインジェクション (glTF & OBJ)
モダンなグラフィックスワークフローとの親和性を考慮し、**glTF 2.0** を主要フォーマットとして採用しました。

* **メッシュデータ処理:** **cgltf** ライブラリを使用し、JSON形式の `.gltf` およびバイナリ形式の `.glb` の両方を高速にパースするローダーを実装。
* **レガシーサポート:** モデリング工程での互換性を維持するため、**Wavefront .obj** 形式もサポートし、多様な3Dツールに対応しています。

---

## 技術的な成長と考察

このプロジェクトを通じて、非常に多くの教訓を得られたと感じています。

まず、IDEを使わずにポータブルコンパイラを利用したことで、プログラムのコンパイル、リンク、ビルドという一連のパイプライン全体を理解することができました。コンパイラを通常とは異なる視点から捉えることで、`gcc` のような各種コンパイラの仕組みを理解できただけでなく、他のプロジェクトで以前から使用しており、現在も使用しているツール（**Visual Studio** の `cl` など）についても、より深く理解できるようになりました。

また、`batch` ファイルや **Windows PowerShell** を活用して、ファイルのダウンロード、展開、移動を自動化し、環境を最適化することで、複数の依存関係をセットアップし、堅牢でポータブルな作業環境を構築する方法を学びました。

グラフィックスAPIについても多くを学びました。当然ながらレンダリングパイプラインについても学習し、**OpenGL 3.3** から始めて **4.6** に至るまでを経験したことで、パイプラインの進化や、**SPIR-V**、明示的なメモリ管理を伴うセミプリコンパイル済みシェーダといった現代のソリューションにどのように到達したのかを理解することができました。さらに、リンクのために **GLAD** のようなモダンなライブラリの使用を余儀なくされたことで、グラフィックスAPIがシステムによってどのように呼び出され、管理されているのかを把握できました。これは、**Vulkan** を **LunarG** なしでロードする方法を理解する大きな足がかりとなりました。**GLAD** を介して呼び出しとリンクを行い、手動の作業とリポジトリにコピーしたシステム用 .dll ファイルを追加することで、拡張機能を実装することができたからです。

さらに、3Dモデルについても、頂点、マテリアル、テクスチャがゲームエンジン内でどのようにインポートされ、処理されるのかについて深く学びました。

最後に、最近になって、このプロジェクトで得た知識を **Unity** や **Unreal** といった他の分野のゲーム制作にも無意識のうちに応用し始めていることに気づきました。レンダリングがどのように実行されるか（どのグラフィックスAPIをいつ使用するかなど）をより慎重に検討するようになり、肥大化したUIを効率化するツールの作成や、商用エンジン特有の低速で複雑なビルドシステムの最適化など、エンジン自体の改善に注力するようになりました。

---

## DEMO

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=f9MxPtcVE4Y&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

---

## 今後の展望

* **プラットフォーム抽象化:** **GLFW** から **SDL3** へ移行し、クロスプラットフォーム対応と入力処理をさらに強化。
* **スタンドアロン配布:** アセットとスクリプトを単一の実行ファイルに埋め込み、配布を容易にするビルドシステムの開発。
* **スクリプタブルUI:** **Sol3** と **ImGui** を統合し、 **Lua** スクリプトからカスタムUIを開発可能にする。
* **物理エンジンの統合:** 独自の衝突判定システムの実装、または **Bullet Physics** の統合。
* **モダンなテクスチャパイプライン:** 現在の `.dds`(DirectDraw Surface) から、より圧縮効率と互換性に優れた `.ktx2`(Khronos Texture) フォーマットへの移行。
* **APIの進化:** **OpenGL** から **Vulkan** へ完全に移行し、ハードウェアのメモリ管理とコマンドバッファのより緻密な制御を実現する。