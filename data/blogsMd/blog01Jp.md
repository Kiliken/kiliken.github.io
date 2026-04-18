
# 高速な診断ツールとしてのPowerShell

今日は、マルウェアへの感染が疑われる場合に、Windowsマシンに悪意のあるソフトウェアがインストールされていないか簡単に確認できる便利なスクリプトをいくつか紹介します。
数ヶ月前に起きたNotepad++のハイジャック事件が、今回の投稿のきっかけになりました。

「未完成」...

### 特定のファイルの確認

```
&copy&
Get-ChildItem -Path C:\ -Recurse -Filter malware.dll -ErrorAction SilentlyContinue

```

```
&copy&
Get-FileHash -Path "C:\path\to\file" -Algorithm SHA256

```

### 現在接続情報の確認

```
&copy&
Get-NetTCPConnection | Where-Object {
    $_.RemoteAddress -in @(
        "127.1.1.0",
        "127.1.1.0",
        "127.1.1.0",
        "127.1.1.0"
    )
}

```

### 接続情報履歴の確認

```
&copy&
Get-DnsClientCache | Where-Object {
    $_.Entry -match "this|that|something"
}

```