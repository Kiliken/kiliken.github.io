
# Powershell as a fast Diagnostic Tool

Today i will cover a bunch of usefull scripts you can easily use to check if a malicus softwere is installed in your Windows machine in cause you have any clue of that software.
My inspiration for this was the hijack that happend some month ago with Notepad++.

WIP...

### Check for specific file.

```
Get-ChildItem -Path C:\ -Recurse -Filter malware.dll -ErrorAction SilentlyContinue

```

```

Get-FileHash -Path "C:\path\to\file" -Algorithm SHA256

```

### Check if currently connecter

```
Get-NetTCPConnection | Where-Object {
    $_.RemoteAddress -in @(
        "127.1.1.0",
        "127.1.1.0",
        "127.1.1.0",
        "127.1.1.0"
    )
}

```

### Check if ever connected to

```
Get-DnsClientCache | Where-Object {
    $_.Entry -match "this|that|something"
}

```