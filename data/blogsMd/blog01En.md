
# Powershell as a fast Diagnostic Tool

Today, I will cover a bunch of useful scripts you can easily use to check if malicious software is installed on your Windows machine, in case you suspect a compromise. 
My inspiration for this was the hijack that happened a few months ago involving Notepad++.

(WIP)...

### Check for specific file

```
&copy&
Get-ChildItem -Path C:\ -Recurse -Filter malware.dll -ErrorAction SilentlyContinue

```

```
&copy&
Get-FileHash -Path "C:\path\to\file" -Algorithm SHA256

```

### Check if currently connected

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

### Check if ever connected to

```
&copy&
Get-DnsClientCache | Where-Object {
    $_.Entry -match "this|that|something"
}

```