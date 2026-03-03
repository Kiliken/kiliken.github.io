
# Powershell as a fast Diagnostic Tool

Today, I will cover a bunch of useful scripts you can easily use to check if malicious software is installed on your Windows machine, in case you suspect a compromise. 
My inspiration for this was the hijack that happened a few months ago involving Notepad++.

(WIP)...

### Check for specific file

```
Get-ChildItem -Path C:\ -Recurse -Filter malware.dll -ErrorAction SilentlyContinue

```

```

Get-FileHash -Path "C:\path\to\file" -Algorithm SHA256

```

### Check if currently connected

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