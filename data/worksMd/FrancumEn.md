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

## Project Overview
I chose to make a game engine from scratch to learn the rendering pipeline and understand how game engines work. Having to frequently switch between machines, I wanted an engine that requires zero manual installation and avoids complex, bloated UIs. 

By leveraging a portable **C++** toolchain and a script-first workflow, I created a system that can be deployed on any Windows machine instantly. 

I chose **OpenGL** because it is easy and I can focus more on understanding the rendering logic itself, but I'm still planning to switch to **Vulkan** and I already have it working on some side projects.

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=2Jgt69h8ZdM&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

---

## Key Technical Features

#### The Tech Stack:

| Item | Technology | Description |
|:--|:--:|--:|
| **Compiler** | w64devkit | Minimalist, portable C++17/20 toolchain |
| **Windowing & Context** | SDL3 | Hardware-accelerated windowing |
| **Graphics API** | OpenGL 4.6 (Core Profile) / GLAD | Rendering and OpenGL function loader |
| **Mathematics** | GLM | Header-only linear algebra |
| **Scripting Bridge** | Sol3 (LuaJIT 2.1) | High-performance Lua wrapper |
| **Asset Ingestion** | cgltf | Lightweight glTF 2.0 parser |

### 1. Modern OpenGL & SPIR-V Shader Pipeline
I implemented a rendering architecture that utilizes modern OpenGL features to emulate the efficiency and predictability of low-level APIs like Vulkan.
* **Buffer & State Management:** Leveraged **Vertex Array Objects (VAOs)** and **Uniform Buffer Objects (UBOs)** to minimize state changes, streamline CPU-to-GPU data transfer, and efficiently manage global shader constants.

```cpp
// Explicitly aligned structures matching GLSL std140 layout specifications
struct MaterialIDs
{
    int diffuse;
    int normal;
    int specular;
    int padding; // Manual padding to respect std140 16-byte alignment rules
};

// ...

Model::Model(/* ... */) 
{
    // Interleaved Vertex Buffer Setup for Optimal GPU Cache Locality
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);

    // Vertex attributes (Position, UV, Normal, Tangent, Bitangent) are mapped here...
    glEnableVertexAttribArray(0); 
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, position));
    // [Truncated for readability: Attributes 1 through 4 configured identically]

    glGenBuffers(1, &elementbuffer);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, elementbuffer);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), &indices[0], GL_STATIC_DRAW);

    // Hardware-Accelerated Uniform Sharing via UBOs
    // Material Uniform Buffer Allocation
    glGenBuffers(1, &MaterialUBO);
    glBindBuffer(GL_UNIFORM_BUFFER, MaterialUBO);
    glBufferData(GL_UNIFORM_BUFFER, sizeof(MaterialIDs), nullptr, GL_DYNAMIC_DRAW);
    glBindBufferBase(GL_UNIFORM_BUFFER, 1, MaterialUBO); // Bind to uniform slot 1

    glBindVertexArray(0);
}

// ...

struct CameraUBO
{
    glm::mat4 V; // View matrix
    glm::mat4 P; // Projection matrix
};

// ...

void Camera::BindToShader(){
    // Camera Uniform Buffer Allocation (shared across multiple shaders)
    glGenBuffers(1, &UBOID);
    glBindBuffer(GL_UNIFORM_BUFFER, UBOID);
    glBufferData(GL_UNIFORM_BUFFER, sizeof(CameraUBO), nullptr, GL_DYNAMIC_DRAW);
    glBindBufferBase(GL_UNIFORM_BUFFER, 2, UBOID); // Bind to uniform slot 2
}
```

* **Pre-compiled Shader Pipeline:** Moving beyond basic runtime GLSL string compilation, I integrated a **SPIR-V** workflow. By utilizing `glslangvalidator` as an offline compiler, the engine supports a unified pipeline where shaders can be authored in **GLSL or HLSL** and ingested as binary blobs, ensuring cross-language flexibility and faster load times.

```cpp
struct BinaryData {
    size_t sizeBytes;
    std::vector<uint32_t> data; // SPIR-V modules are arrays of 32-bit words
};

BinaryData Utils::LoadBinaryFile(const char *path)
{
    std::ifstream file(path, std::ios::binary | std::ios::ate);
    if (!file.is_open()) return {};

    size_t fileSize = (size_t)file.tellg();

    // Critical Validation: SPIR-V files MUST be a multiple of 4 bytes (32-bit words)
    if (fileSize % 4 != 0) {
        printf("Error: SPIR-V file corrupted or unaligned: %s\n", path);
        return {};
    }

    BinaryData result;
    result.sizeBytes = fileSize;
    result.data.resize(fileSize / 4); // Resize memory buffer based on 32-bit word boundaries

    file.seekg(0, std::ios::beg);
    file.read(reinterpret_cast<char *>(result.data.data()), fileSize);
    file.close();

    return result;
}

// Using GL_ARB_gl_spirv | GL_ARB_spirv_extensions
GLuint Utils::LoadSPIRV(const char *vertex_file_path, const char *fragment_file_path)
{
    BinaryData vsFile = LoadBinaryFile(vertex_file_path);
    BinaryData fsFile = LoadBinaryFile(fragment_file_path);

    // Consume pre-compiled binary intermediate representation (IR)
    GLuint VertexShaderID = glCreateShader(GL_VERTEX_SHADER);
    glShaderBinary(1, &VertexShaderID, GL_SHADER_BINARY_FORMAT_SPIR_V_ARB, &vsFile.data[0], (GLsizei)vsFile.sizeBytes);
    
    // Specialize entry points—skips full runtime compilation overhead
    glSpecializeShader(VertexShaderID, "VSMain", 0, nullptr, nullptr);

    GLuint FragmentShaderID = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderBinary(1, &FragmentShaderID, GL_SHADER_BINARY_FORMAT_SPIR_V_ARB, &fsFile.data[0], (GLsizei)fsFile.sizeBytes);
    glSpecializeShader(FragmentShaderID, "PSMain", 0, nullptr, nullptr);

    // Link modern, separable program pipelines
    GLuint ProgramID = glCreateProgram();
    glAttachShader(ProgramID, VertexShaderID);
    glAttachShader(ProgramID, FragmentShaderID);
    
    // Explicitly flag program as separable to allow flexible pipeline bindings
    glProgramParameteri(ProgramID, GL_PROGRAM_SEPARABLE, GL_TRUE);
    glLinkProgram(ProgramID);

    // Clean up intermediate shader objects post-link
    glDetachShader(ProgramID, VertexShaderID);
    glDetachShader(ProgramID, FragmentShaderID);
    glDeleteShader(VertexShaderID);
    glDeleteShader(FragmentShaderID);

    return ProgramID;
}
```

### 2. High-Level Lua Scripting via Sol3
To facilitate rapid prototyping and decouple gameplay logic from the core engine, I exposed the C++ API (including Transform systems, Model loading, and Input handling) to **Lua** using **Sol3**. 
* **Script-First Iteration:** This architecture allows for the execution of entire game loops within scripts, enabling real-time logic updates without the need for constant recompilation, all while maintaining the raw performance of the C++ rendering backend.

```cpp
class ScriptComponent 
{
public:
    sol::environment env;
    sol::function onStart;
    sol::function onUpdate;
    sol::function onDraw;

    ScriptComponent(sol::state &lua, const std::string &scriptPath)
        // Sandboxing: Instantiating a unique Lua environment isolated from globals
        : env(lua, sol::create, lua.globals())
    {
        lua.script_file(scriptPath, env);

        // Binding native lifecycle hooks to scripted event handlers
        onStart  = env["OnStart"];
        onUpdate = env["OnUpdate"];
        onDraw   = env["OnDraw"];
    }

    void Start()  { if (onStart.valid())  onStart(); }
    void Update(float dt) { if (onUpdate.valid()) onUpdate(dt); }
    void Draw()   { if (onDraw.valid())   onDraw(); }
};

// --- Native API Reflection & Type Registration ---
void BindEngineToLua(sol::state &lua)
{
    // Exposing the native C++ 'Object' entity component structure to the Lua VM
    lua.new_usertype<Object>("Object",
        sol::constructors<Object()>(),
        "Update",      &Object::Update,
        "Draw",        &Object::Draw,
        "SetPosition", &Object::SetPosition,
        "SetRotation", &Object::SetRotation,
        "SetScale",    &Object::SetScale
    );

    // Allowing runtime asset manipulation directly from gameplay scripts
    lua.new_usertype<Model>("Model",
        "SetTexture",     &Model::SetTexture,
        "SetNormalMap",   &Model::SetNormalMap,
        "SetSpecularMap", &Model::SetSpecularMap,
		"SetColor",       &Model::SetColor
    );

    // Registering hardware input polling systems
    lua.new_usertype<Inputs>("Inputs",
		"IsKeyDown", &Inputs::IsKeyDown
	);
	
	// Registering camera handling systems
    lua.new_usertype<Camera>("Camera", 
        "SetPosition", &Camera::SetPosition,
        "SetRotation", &Camera::SetRotation,
        "SetProjMode", &Camera::SetProjMode
	);
}
```

### 3. High-Performance Asset Ingestion (glTF & OBJ)
I adopted the **glTF 2.0** standard as the primary asset format due to its efficiency in modern graphics workflows. 
* **Mesh Data Handling:** Using the **cgltf** library, I implemented a robust loader capable of parsing both JSON-based `.gltf` and binary `.glb` files for high-speed scene ingestion. 
* **Legacy Support:** For maximum compatibility during the modeling phase, the engine maintains secondary support for the **Wavefront .obj** format, ensuring a versatile pipeline for various 3D modeling tools.

### 4. Portable "Zero-Install" Development Environment
To eliminate the overhead of traditional IDEs and heavy package managers, I engineered a custom automation suite using a **Batch/PowerShell hybrid** for instantaneous environment bootstrapping.
* **The Workflow:** A single execution triggers an automated handshake that validates the host environment and configures a **w64devkit** (Portable GCC/Make) toolchain alongside a pre-configured **Lua** runtime.

```bat
# setup/InstallEngine.ps1 (Automated Environment Setup Script)
$ProjectRoot = "$($PSScriptRoot)\.."

# 1. Automatically generate the directory structure (establish a deterministic build environment)
New-Item -Path "$($ProjectRoot)\dep" -ItemType Directory -Force | Out-Null
New-Item -Path "$($ProjectRoot)\build" -ItemType Directory -Force | Out-Null
New-Item -Path "$($ProjectRoot)\dep\include\sol" -ItemType Directory -Force | Out-Null
New-Item -Path "$($ProjectRoot)\dep\lib" -ItemType Directory -Force | Out-Null

$sdlDownloadUrl = "https://github.com/libsdl-org/SDL/releases/download/release-3.4.10/SDL3-devel-3.4.10-mingw.zip"
$glmDownloadUrl = "https://github.com/g-truc/glm/releases/download/1.0.2/glm-1.0.2.zip"
$imguiDownloadUrl = "https://github.com/ocornut/imgui/archive/refs/tags/v1.92.5.zip"

# 2. Conditionally download assets while ensuring idempotency
if ( -not (Test-Path "$($PSScriptRoot)\sdl.zip")){
	curl.exe -L "$sdlDownloadUrl" -o "$($PSScriptRoot)\sdl.zip" --progress-bar
}
if ( -not (Test-Path "$($PSScriptRoot)\glm.zip")){
	curl.exe -L "$glmDownloadUrl" -o "$($PSScriptRoot)\glm.zip" --progress-bar
}
if ( -not (Test-Path "$($PSScriptRoot)\imgui.zip")){
	curl.exe -L "$imguiDownloadUrl" -o "$($PSScriptRoot)\imgui.zip" --progress-bar
}

# 3. Extract archives using the .NET Compression assembly
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$($PSScriptRoot)\sdl.zip", "$($PSScriptRoot)")
[System.IO.Compression.ZipFile]::ExtractToDirectory("$($PSScriptRoot)\glm.zip", "$($PSScriptRoot)")
[System.IO.Compression.ZipFile]::ExtractToDirectory("$($PSScriptRoot)\imgui.zip", "$($ProjectRoot)\dep\include")

# 4. Map third-party libraries (include headers and binaries)

# Install SDL3
Copy-Item -Path "$($PSScriptRoot)\SDL3-3.4.10\x86_64-w64-mingw32\include\SDL3" -Destination "$($ProjectRoot)\dep\include" -Recurse
Copy-Item -Path "$($PSScriptRoot)\SDL3-3.4.10\x86_64-w64-mingw32\bin\SDL3.dll" -Destination "$($ProjectRoot)\build" -Force
Copy-Item -Path "$($PSScriptRoot)\SDL3-3.4.10\x86_64-w64-mingw32\lib\libSDL3.dll.a" -Destination "$($ProjectRoot)\dep\lib" -Force

# Map GLM, GLAD, Sol3, cgltf, and ImGui (aggregate all project dependencies)
Copy-Item -Path "$($PSScriptRoot)\glm\glm" -Destination "$($ProjectRoot)\dep\include" -Recurse
Copy-Item -Path "$($PSScriptRoot)\common\sol.hpp" -Destination "$($ProjectRoot)\dep\include\sol" -Force
Copy-Item -Path "$($PSScriptRoot)\common\cgltf.h" -Destination "$($($ProjectRoot))\dep\include" -Force

Rename-Item -Path "$($ProjectRoot)\dep\include\imgui-1.92.5" -NewName "imgui"
Copy-Item -Path "$($ProjectRoot)\dep\include\imgui\backends\imgui_impl_opengl3.cpp" -Destination "$($ProjectRoot)\dep\include\imgui"
Copy-Item -Path "$($ProjectRoot)\dep\include\imgui\backends\imgui_impl_sdl3.cpp" -Destination "$($ProjectRoot)\dep\include\imgui"

# 5. Clean up the workspace (remove unnecessary temporary extraction directories)
Remove-Item -Path "$($PSScriptRoot)\SDL3-3.4.10" -Recurse -Force
Remove-Item -Path "$($PSScriptRoot)\glm" -Recurse -Force

return 0
```

---

## Technical Growth & Reflection
I feel like I learned a lot of lessons from this project.

#### Graphics APIs & Modern Rendering Architecture
I learned a lot about graphics APIs. Naturally, I learned the rendering pipeline; starting from **OpenGL** **3.3** and ending with **4.6** allowed me to see the evolution of the pipeline and how we arrived at modern solutions like **SPIR-V** and semi-precompiled shaders with explicit memory management. Furthermore, being forced to use modern libraries for linking, like **GLAD**, helped me understand how graphics APIs are called and managed by the system. This gave me a big boost in understanding how to load **Vulkan** without **LunarG**, as **GLAD** can call it, link it, and add extensions with some manual work and extra system .dll files copied into the repository.

#### Build Pipelines & Toolchains
Having to work with a portable compiler without an IDE made me understand the whole pipeline of compiling, linking, and building a program. Seeing compilers from a different perspective not only made me understand how different compilers like `gcc` work, but also helped me better understand the counterparts (such as **Visual Studio**'s `cl` and other tools) that I used to use and still use on other projects.

#### Environment Automation & Dependency Management
I learned how to set up multiple dependencies and create a robust, portable work environment with the help of `batch` files and **Windows PowerShell** to download, extract, and move files to optimize the environment.

#### Asset Ingestion & 3D Pipelines
I learned a great deal about 3D models and how vertices, materials, and textures are imported and processed inside a game engine.

#### Cross-Engine Application & Optimization Mindset
I have noticed lately that I am unconsciously starting to apply the knowledge I gained from this project to other areas, such as games in **Unity** or **Unreal**. I find myself being more careful with how rendering is executed (like which graphics API to use and when) and focusing more on how to optimize the engine itself by making tools to streamline bloated UIs or the slow, intricate build systems that sometimes come with those large commercial engines.

---

## Future Roadmap
* **Scriptable UI:** Integrating **Sol3** with **ImGui** to enable fully custom UI development directly within **Lua** scripts.
* **Physics Integration:** Developing a custom collision detection system or integrating a dedicated library like **Bullet Physics**.
* **Stand-alone Distribution:** Developing a build system that embeds all assets and scripts into a single executable for seamless game distribution.
* **Modern Texture Pipeline:** Transitioning from the current `.dds` (DirectDraw Surface) system to the `.ktx2` (Khronos Texture) format for better compression and GPU compatibility.
* **API Evolution:** Transitioning from **OpenGL** to **Vulkan** to gain granular control over hardware memory management and command buffer execution.