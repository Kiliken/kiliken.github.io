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
[「日本語」](mdRenderer.html?mdurl=./data/worksMd/FrancumJp.md)

## Project Overview
I chose to make a game engine from scratch to learn the rendering pipeline and understand how game engines work. Having to frequently switch between machines, I wanted an engine that requires zero manual installation and avoids complex, bloated UIs. 

By leveraging a portable **C++** toolchain and a script-first workflow, I created a system that can be deployed on any Windows machine instantly. 

I chose **OpenGL** because it is easy and I can focus more on understanding the rendering logic itself, but I'm still planning to switch to **Vulkan** and I already have it working on some side projects.

---

## Key Technical Features

### 1. Portable "Zero-Install" Development Environment
To eliminate the overhead of traditional IDEs and heavy package managers, I engineered a custom automation suite using a **Batch/PowerShell hybrid** for instantaneous environment bootstrapping.
* **The Workflow:** A single execution triggers an automated handshake that validates the host environment and configures a **w64devkit** (Portable GCC/Make) toolchain alongside a pre-configured **Lua** runtime.

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

* **The Tech Stack:**
    * **Compiler:** w64devkit (Minimalist, portable C++17/20 toolchain)
    * **Windowing & Context:** GLFW (Hardware-accelerated windowing)
    * **Graphics API:** OpenGL 4.6 (Core Profile) via GLAD
    * **Mathematics:** GLM (Header-only linear algebra)
    * **Scripting Bridge:** Sol3 (High-performance Lua wrapper)
    * **Asset Ingestion:** cgltf (Lightweight glTF 2.0 parser)

### 2. Modern OpenGL & SPIR-V Shader Pipeline
I implemented a rendering architecture that utilizes modern OpenGL features to emulate the efficiency and predictability of low-level APIs like Vulkan.
* **Buffer & State Management:** Leveraged **Vertex Array Objects (VAOs)** and **Uniform Buffer Objects (UBOs)** to minimize state changes, streamline CPU-to-GPU data transfer, and efficiently manage global shader constants.

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

* **Pre-compiled Shader Pipeline:** Moving beyond basic runtime GLSL string compilation, I integrated a **SPIR-V** workflow. By utilizing `glslangvalidator` as an offline compiler, the engine supports a unified pipeline where shaders can be authored in **GLSL or HLSL** and ingested as binary blobs, ensuring cross-language flexibility and faster load times.

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

### 3. High-Level Lua Scripting via Sol3
To facilitate rapid prototyping and decouple gameplay logic from the core engine, I exposed the C++ API (including Transform systems, Model loading, and Input handling) to **Lua** using **Sol3**. 
* **Script-First Iteration:** This architecture allows for the execution of entire game loops within scripts, enabling real-time logic updates without the need for constant recompilation, all while maintaining the raw performance of the C++ rendering backend.

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

### 4. High-Performance Asset Ingestion (glTF & OBJ)
I adopted the **glTF 2.0** standard as the primary asset format due to its efficiency in modern graphics workflows. 
* **Mesh Data Handling:** Using the **cgltf** library, I implemented a robust loader capable of parsing both JSON-based `.gltf` and binary `.glb` files for high-speed scene ingestion. 
* **Legacy Support:** For maximum compatibility during the modeling phase, the engine maintains secondary support for the **Wavefront .obj** format, ensuring a versatile pipeline for various 3D modeling tools.

---

## Technical Growth & Reflection
I feel like I learned a lot of lessons from this project.

First of all, having to work with a portable compiler without an IDE made me understand the whole pipeline of compiling, linking, and building a program. Seeing compilers from a different perspective not only made me understand how different compilers like `gcc` work, but also helped me better understand the counterparts (such as **Visual Studio**'s `cl` and other tools) that I used to use and still use on other projects.

I learned how to set up multiple dependencies and create a robust, portable work environment with the help of `batch` files and **Windows PowerShell** to download, extract, and move files to optimize the environment.

I also learned a lot about graphics APIs. Naturally, I learned the rendering pipeline; starting from **OpenGL** **3.3** and ending with **4.6** allowed me to see the evolution of the pipeline and how we arrived at modern solutions like **SPIR-V** and semi-precompiled shaders with explicit memory management. Furthermore, being forced to use modern libraries for linking, like **GLAD**, helped me understand how graphics APIs are called and managed by the system. This gave me a big boost in understanding how to load **Vulkan** without **LunarG**, as **GLAD** can call it, link it, and add extensions with some manual work and extra system .dll files copied into the repository.

I also learned a great deal about 3D models and how vertices, materials, and textures are imported and processed inside a game engine.

Finally, I have noticed lately that I am unconsciously starting to apply the knowledge I gained from this project to other areas, such as games in **Unity** or **Unreal**. I find myself being more careful with how rendering is executed (like which graphics API to use and when) and focusing more on how to optimize the engine itself by making tools to streamline bloated UIs or the slow, intricate build systems that sometimes come with those large commercial engines.

---

## Demo

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=f9MxPtcVE4Y&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

---

## Future Roadmap
* **Platform Abstraction:** Migrating from **GLFW** to **SDL3** to further enhance cross-platform portability and input handling.
* **Stand-alone Distribution:** Developing a build system that embeds all assets and scripts into a single executable for seamless game distribution.
* **Scriptable UI:** Integrating **Sol3** with **ImGui** to enable fully custom UI development directly within **Lua** scripts.
* **Physics Integration:** Developing a custom collision detection system or integrating a dedicated library like **Bullet Physics**.
* **Modern Texture Pipeline:** Transitioning from the current `.dds` (DirectDraw Surface) system to the `.ktx2` (Khronos Texture) format for better compression and GPU compatibility.
* **API Evolution:** Transitioning from **OpenGL** to **Vulkan** to gain granular control over hardware memory management and command buffer execution.