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

**OpenGLベースの、率直でポータブルな軽量ゲームエンジン。**

Francum Engineは、すぐに開発を始めたいクリエイターのために設計されました。「究極のポータビリティ（Frankly Portable）」を掲げ、リポジトリには独自のツールチェーン（コンパイラ、ビルドシステム、スクリプト言語）が同梱されています。外部ソフトウェアをインストールすることなく、あらゆるWindowsマシンでゲームのビルドと実行が可能です。

VIDEO HERE

---

## 🚀 特徴
* **軽量:** 最小限のメモリ使用量と高速な起動。
* **ポータブル:** 設定済みの **g++**、**CMake**、**Lua** を内蔵。クローンしてすぐにコードを書けます。
* **OpenGL 駆動:** モダンなOpenGLを活用した効率的なレンダリング。
* **率直な設計:** 隠れた「マジック」のない、透明性の高いAPI。

---

## 🛠️ はじめに

### システム要件
* **OS:** Windows 10/11 (x64)
* **グラフィックス:** OpenGL 3.3以上をサポートするGPU

### 依存関係
Francumは以下のライブラリを使用しています：
* **ウィンドウ/コンテキスト:** GLFW
* **リンカー/ローダー:** GLEW
* **数学ライブラリ:** GLM
* **UI:** ImGui
* **スクリプト:** Sol3

## Code

### Object Renderer

<details>
<summary> <h4>Object.h (Code)</h4> </summary>

```cpp

#define CUBE_MODEL ("CUBE")

extern const unsigned char _binary_cube_obj_start[];
extern const unsigned char _binary_cube_obj_end[];

size_t cubeSize = _binary_cube_obj_end - _binary_cube_obj_start;

std::string cubeData(
    (const char *)_binary_cube_obj_start,
    cubeSize);

struct ObjectConfig
{
    const char *fileName;
    GLuint *prog;
    glm::mat4 *View;
    glm::mat4 *camera;
    glm::vec3 *lightPos;
};

ObjectConfig DefaultObjectConfig;

class Object
{

public:
    Object(const char *fileName, GLuint *prog, glm::mat4 *View, glm::mat4 *camera, glm::vec3 *lightPos);
    Object(const ObjectConfig &cfg);
    Object(const char *fileName);
    Object();

    ~Object();

    void Update(float deltaTime);
    void Draw();

    void Transform(const glm::mat4 &transform);
    void SetPosition(const float& x, const float& y, const float& z);
    void SetRotation(const float& x, const float& y, const float& z);
    void SetScale(const float& x, const float& y, const float& z);

private:
    // Render
    std::vector<glm::vec3> vertices;
    std::vector<glm::vec2> uvs;
    std::vector<glm::vec3> normals;
    std::vector<glm::vec3> tangents;
    std::vector<glm::vec3> bitangents;
    std::vector<unsigned short> indices;

    GLuint elementbuffer;
    GLuint vertexbuffer;
    GLuint uvsbuffer;
    GLuint normalbuffer;
    GLuint tangentbuffer;
    GLuint bitangentbuffer;

    GLuint DiffuseTextureID;
    GLuint NormalTextureID;
    GLuint SpecularTextureID;
    GLuint MatrixID;
    GLuint ModelMatrixID;
    GLuint ModelView3x3MatrixID;
    GLuint viewId;
    GLuint light;

    GLuint DiffuseTexture;
    GLuint NormalTexture;
    GLuint SpecularTexture;

    // Transform
    glm::mat4 *projection;
    glm::mat4 mvp;

    glm::mat4 mv;
    glm::mat3 mv33;

    glm::mat4 Model;
    glm::vec3 localPos;
    glm::vec3 localRot;
    glm::vec3 localScale;

    // External
    GLuint *shaders;

    glm::mat4 *view;
    glm::vec3 *lightPos;
};

Object::Object(const char *fileName, GLuint *prog, glm::mat4 *View, glm::mat4 *camera, glm::vec3 *lightPos)
    : shaders(prog), view(View), projection(camera), lightPos(lightPos)
{

    std::vector<glm::vec3> tempVertices;
    std::vector<glm::vec2> tempUvs;
    std::vector<glm::vec3> tempNormals;
    std::vector<glm::vec3> tempTangents;
    std::vector<glm::vec3> tempBitangents;

    if (fileName == CUBE_MODEL)
    {
        loadOBJ(cubeData, tempVertices, tempUvs, tempNormals);
    }
    else
        loadOBJ(fileName, tempVertices, tempUvs, tempNormals);

    computeTangentBasis(tempVertices, tempUvs, tempNormals, tempTangents, tempBitangents);
    indexVBO_TBN(tempVertices, tempUvs, tempNormals, tempTangents, tempBitangents, indices, vertices, uvs, normals, tangents, bitangents);

    glGenBuffers(1, &elementbuffer);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, elementbuffer);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), &indices[0], GL_STATIC_DRAW);

    glGenBuffers(1, &vertexbuffer);
    glBindBuffer(GL_ARRAY_BUFFER, vertexbuffer);
    glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(glm::vec3), &vertices[0], GL_STATIC_DRAW);

    glGenBuffers(1, &uvsbuffer);
    glBindBuffer(GL_ARRAY_BUFFER, uvsbuffer);
    glBufferData(GL_ARRAY_BUFFER, uvs.size() * sizeof(glm::vec3), &uvs[0], GL_STATIC_DRAW);

    glGenBuffers(1, &normalbuffer);
    glBindBuffer(GL_ARRAY_BUFFER, normalbuffer);
    glBufferData(GL_ARRAY_BUFFER, normals.size() * sizeof(glm::vec3), &normals[0], GL_STATIC_DRAW);

    glGenBuffers(1, &tangentbuffer);
    glBindBuffer(GL_ARRAY_BUFFER, tangentbuffer);
    glBufferData(GL_ARRAY_BUFFER, tangents.size() * sizeof(glm::vec3), &tangents[0], GL_STATIC_DRAW);

    glGenBuffers(1, &bitangentbuffer);
    glBindBuffer(GL_ARRAY_BUFFER, bitangentbuffer);
    glBufferData(GL_ARRAY_BUFFER, bitangents.size() * sizeof(glm::vec3), &bitangents[0], GL_STATIC_DRAW);

    DiffuseTexture = loadDDS("../res/baseDiffuse.dds");
    NormalTexture = loadDDS("../res/baseNormals.dds");
    SpecularTexture = loadDDS("../res/baseSpecular.dds");

    DiffuseTextureID = glGetUniformLocation(*shaders, "DiffuseTextureSampler");
    NormalTextureID = glGetUniformLocation(*shaders, "NormalTextureSampler");
    SpecularTextureID = glGetUniformLocation(*shaders, "SpecularTextureSampler");
    MatrixID = glGetUniformLocation(*shaders, "MVP");
    viewId = glGetUniformLocation(*shaders, "V");
    ModelMatrixID = glGetUniformLocation(*shaders, "M");
    ModelView3x3MatrixID = glGetUniformLocation(*shaders, "MV3x3");
    light = glGetUniformLocation(*shaders, "LightPosition_worldspace");

    Model = glm::mat4(1.0f);
    localPos = glm::vec3(0.0f);
    localRot = glm::vec3(0.0f);
    localScale = glm::vec3(1.0f);
}

Object::Object(const ObjectConfig &cfg)
    : Object(cfg.fileName, cfg.prog, cfg.View, cfg.camera, cfg.lightPos) {}

Object::Object(const char *fileName)
    : Object(fileName, DefaultObjectConfig.prog, DefaultObjectConfig.View, DefaultObjectConfig.camera, DefaultObjectConfig.lightPos) {}

Object::Object()
    : Object(DefaultObjectConfig) {}






void Object::Update(float deltaTime)
{

    Model = glm::mat4(1.0f);
    Model = glm::translate(Model, localPos);
    Model = glm::rotate(Model, localRot.x, {1, 0, 0});
    Model = glm::rotate(Model, localRot.y, {0, 1, 0});
    Model = glm::rotate(Model, localRot.z, {0, 0, 1});
    Model = glm::scale(Model, localScale);

    mv = *view * Model;
    mv33 = glm::mat3(mv);
    mvp = *projection * *view * Model;
}

void Object::Draw()
{
    glUseProgram(*shaders);

    // 1st attribute buffer : vertices
    glEnableVertexAttribArray(0);
    glBindBuffer(GL_ARRAY_BUFFER, vertexbuffer);
    glVertexAttribPointer(
        0,        // attribute 0. No particular reason for 0, but must match the layout in the shader.
        3,        // size
        GL_FLOAT, // type
        GL_FALSE, // normalized?
        0,        // stride
        (void *)0 // array buffer offset
    );

    glEnableVertexAttribArray(1);
    glBindBuffer(GL_ARRAY_BUFFER, uvsbuffer);
    glVertexAttribPointer(
        1,        // attribute. No particular reason for 1, but must match the layout in the shader.
        2,        // size
        GL_FLOAT, // type
        GL_FALSE, // normalized?
        0,        // stride
        (void *)0 // array buffer offset
    );

    glEnableVertexAttribArray(2);
    glBindBuffer(GL_ARRAY_BUFFER, normalbuffer);
    glVertexAttribPointer(
        2,        // attribute
        3,        // size
        GL_FLOAT, // type
        GL_FALSE, // normalized?
        0,        // stride
        (void *)0 // array buffer offset
    );

    glEnableVertexAttribArray(3);
    glBindBuffer(GL_ARRAY_BUFFER, tangentbuffer);
    glVertexAttribPointer(
        3,        // attribute
        3,        // size
        GL_FLOAT, // type
        GL_FALSE, // normalized?
        0,        // stride
        (void *)0 // array buffer offset
    );

    // 5th attribute buffer : bitangents
    glEnableVertexAttribArray(4);
    glBindBuffer(GL_ARRAY_BUFFER, bitangentbuffer);
    glVertexAttribPointer(
        4,        // attribute
        3,        // size
        GL_FLOAT, // type
        GL_FALSE, // normalized?
        0,        // stride
        (void *)0 // array buffer offset
    );

    // This is done in the main loop since each model will have a different MVP matrix (At least for the M part)
    glUniformMatrix4fv(MatrixID, 1, GL_FALSE, &mvp[0][0]);
    glUniformMatrix4fv(ModelMatrixID, 1, GL_FALSE, &Model[0][0]);
    glUniformMatrix4fv(viewId, 1, GL_FALSE, &((*view)[0][0]));
    glUniformMatrix3fv(ModelView3x3MatrixID, 1, GL_FALSE, &mv33[0][0]);

    glUniform3f(light, (*lightPos).x, (*lightPos).y, (*lightPos).z);

    // Bind our diffuse texture in Texture Unit 0
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, DiffuseTexture);
    glUniform1i(DiffuseTextureID, 0);

    // Bind our normal texture in Texture Unit 1
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, NormalTexture);
    glUniform1i(NormalTextureID, 1);

    // Bind our specular texture in Texture Unit 2
    glActiveTexture(GL_TEXTURE2);
    glBindTexture(GL_TEXTURE_2D, SpecularTexture);
    glUniform1i(SpecularTextureID, 2);

    // Draw the triangles !
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, elementbuffer);
    glDrawElements(
        GL_TRIANGLES,      // mode
        indices.size(),    // count
        GL_UNSIGNED_SHORT, // type
        (void *)0          // element array buffer offset
    );

    glDisableVertexAttribArray(0);
    glDisableVertexAttribArray(1);
    glDisableVertexAttribArray(2);
    glDisableVertexAttribArray(3);
    glDisableVertexAttribArray(4);
}

Object::~Object()
{
    glDeleteBuffers(1, &vertexbuffer);
    glDeleteBuffers(1, &uvsbuffer);
    glDeleteBuffers(1, &normalbuffer);
    glDeleteBuffers(1, &uvsbuffer);
    glDeleteBuffers(1, &normalbuffer);
    glDeleteBuffers(1, &tangentbuffer);
    glDeleteBuffers(1, &bitangentbuffer);
    glDeleteTextures(1, &DiffuseTexture);
    glDeleteTextures(1, &NormalTexture);
    glDeleteTextures(1, &SpecularTexture);
}

// Transform Stuff
void Object::Transform(const glm::mat4 &transform)
{
    Model = transform;
}

void Object::SetPosition(const float& x, const float& y, const float& z)
{
    localPos = glm::vec3(x,y,z);
}

void Object::SetRotation(const float& x, const float& y, const float& z)
{
    localRot = glm::radians(glm::vec3(x,y,z));
}

void Object::SetScale(const float& x, const float& y, const float& z)
{
    localScale = glm::vec3(x,y,z);
}

```
</details>

### Camera Input

<details>
<summary> <h4>Inputs.h (Code)</h4> </summary>

```cpp

class Inputs
{
private:
    // window reference
    GLFWwindow *win;

    // win size
    int winWidth, winHeight;

    // mouse Pos
    double xpos, ypos;
    // mouse Scroll
    double scrollY = 0.0;
    // horizontal angle : toward -Z
    float horizontalAngle = 3.14f;
    // vertical angle : 0, look at the horizon
    float verticalAngle = 0.0f;
    // Initial Field of View
    float initialFoV = 45.0f;

    float speed = 3.0f;
    float mouseSpeed = 0.05f;

    bool tabWasDown;

public:
    Inputs(GLFWwindow *mainWindow);
    ~Inputs();
    void Update(float dt);

    // directions
    glm::vec3 direction, right, up;

    // position
    glm::vec3 position = glm::vec3(0, 0, 5);

    bool showUI = false;

    // field of view
    float FoV;
};

Inputs::Inputs(GLFWwindow *mainWindow)
{
    win = mainWindow;
    glfwGetWindowSize(win, &winWidth, &winHeight);
    glfwSetCursorPos(win, winWidth / 2, winHeight / 2);
}

Inputs::~Inputs()
{
}

void Inputs::Update(float dt)
{
    if(!showUI)
    {
        // Get mouse position
        glfwGetCursorPos(win, &xpos, &ypos);
        // Reset mouse position
        glfwSetCursorPos(win, winWidth / 2, winHeight / 2);
    }
    
    horizontalAngle += mouseSpeed * dt * float(winWidth / 2 - xpos);
    verticalAngle += mouseSpeed * dt * float(winHeight / 2 - ypos);

    // Direction : Spherical coordinates to Cartesian coordinates conversion
    direction = glm::vec3(
        cos(verticalAngle) * sin(horizontalAngle),
        sin(verticalAngle),
        cos(verticalAngle) * cos(horizontalAngle));

    // Right vector
    right = glm::vec3(
        sin(horizontalAngle - 3.14f / 2.0f),
        0,
        cos(horizontalAngle - 3.14f / 2.0f));

    // Up vector : perpendicular to both direction and right
    up = glm::cross(right, direction);

    {
        int tabState = glfwGetKey(win, GLFW_KEY_TAB);

        // Move forward
        if (glfwGetKey(win, GLFW_KEY_W) == GLFW_PRESS)
        {
            position += direction * dt * speed;
        }
        // Move backward
        if (glfwGetKey(win, GLFW_KEY_S) == GLFW_PRESS)
        {
            position -= direction * dt * speed;
        }
        // Strafe right
        if (glfwGetKey(win, GLFW_KEY_D) == GLFW_PRESS)
        {
            position += right * dt * speed;
        }
        // Strafe left
        if (glfwGetKey(win, GLFW_KEY_A) == GLFW_PRESS)
        {
            position -= right * dt * speed;
        }
        if(tabState == GLFW_PRESS && !tabWasDown)
        {
            showUI = !showUI;
            glfwSetInputMode(win, GLFW_CURSOR, (showUI ? GLFW_CURSOR_NORMAL : GLFW_CURSOR_HIDDEN));
            glfwSetCursorPos(win, winWidth / 2, winHeight / 2);
        }
        if (glfwGetKey(win, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        {
            glfwSetWindowShouldClose(win, GLFW_TRUE);
        }
        
        tabWasDown = (tabState == GLFW_PRESS);
    }
}

```
</details>

### Lua Scripting

<details>
<summary> <h4>ScriptComponent.h (Code)</h4> </summary>

```cpp

class ScriptComponent
{
public:
    sol::environment env;
    sol::function onStart;
    sol::function onUpdate;
    sol::function onDraw;

    ScriptComponent(sol::state &lua, const std::string &scriptPath);
    ~ScriptComponent();

    void Start();
    void Update(float dt);
    void Draw();

};

ScriptComponent::ScriptComponent(sol::state &lua, const std::string &scriptPath)
    : env(lua, sol::create, lua.globals())
{
    lua.script_file(scriptPath, env);

    onStart = env["OnStart"];
    onUpdate = env["OnUpdate"];
    onDraw = env["OnDraw"];
}

ScriptComponent::~ScriptComponent(){

}

void ScriptComponent::Start()
{
    if (onStart.valid())
        onStart();
}

void ScriptComponent::Update(float dt)
{
    if (onUpdate.valid())
        onUpdate(dt);
}

void ScriptComponent::Draw()
{
    if (onDraw.valid())
        onDraw();
}

// Other Stuff


std::vector<std::string> GetScriptsInFolder(const std::string& folderPath) {
    std::vector<std::string> scripts;

    for (const auto& entry : std::filesystem::directory_iterator(folderPath)) {
        if (entry.is_regular_file()) {
            auto path = entry.path();
            if (path.extension() == ".lua") {
                scripts.push_back(path.string());
            }
        }
    }

    return scripts;
}


void BindFunctions(sol::state& lua) {
    lua.new_usertype<Object>("Object",
        sol::constructors<
            Object(const char*)
        >(),
        "Update", &Object::Update,
        "Draw", &Object::Draw,
        "SetPosition", &Object::SetPosition,
        "SetRotation", &Object::SetRotation,
        "SetScale", &Object::SetScale
    );
}


```