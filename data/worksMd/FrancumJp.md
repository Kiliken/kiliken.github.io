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

**OpenGLを採用した、率直（Frank）でポータブル、そして軽量なゲームエンジン。**

Francum Engineは、すぐに開発を始めたいエンジニアのために設計されました。「Frankly Portable（率直に言ってポータブル）」という名の通り、リポジトリには独自のツールチェーン（コンパイラ、ビルドシステム、スクリプト環境）が同梱されています。外部ソフトウェアをインストールすることなく、あらゆるWindowsマシンでゲームのビルドと実行が可能です。

<iframe class="ytframe" src="https://www.youtube.com/embed/?autoplay=1&amp;controls=1&amp;disablekb=1&amp;loop=1&amp;mute=1&amp;playlist=f9MxPtcVE4Y&amp;playsinline=1&amp;rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>

---

## 🚀 特徴
* **軽量:** 最小限のメモリフットプリントと高速な起動。
* **ポータブル:** 設定済みの `g++`、`CMake`、`Lua` を内蔵。クローンしてすぐにコードを書けます。
* **OpenGL 駆動:** モダンな OpenGL を活用した効率的なレンダリング。
* **率直な設計:** 隠れた「マジック」のない、透明性の高い API。

---

## 🛠️ はじめに

### 推奨環境
* **OS:** Windows 10/11 (x64)
* **グラフィックス:** OpenGL 4.6 をサポートする GPU。

### 依存ライブラリ
Francum は以下のライブラリを利用しています：
* **ウィンドウ/コンテキスト:** GLFW
* **リンカー/ローダー:** GLAD
* **数学ライブラリ:** GLM
* **UI:** ImGui
* **スクリプト:** Sol3

### インストール方法

1. **リポジトリのクローン**: FrancumEngine リポジトリをローカルマシンにダウンロードまたはクローンします。

2. **セットアップの実行**: プロジェクトのルートディレクトリに移動し、`SetupProject.bat` を実行します。これにより、ポータブルツールチェーンの設定が自動的に行われます。

3. **ビルド**: **VS Code** でフォルダを開き、`Ctrl + Shift + B` を押してエンジンをコンパイルします。

---

## 📑 ドキュメント
準備中 (WIP)

