
# PowerShell as a Fast Diagnostic Tool

Today, I will cover a bunch of useful scripts you can easily use to check if malicious software is installed on your Windows machine, in case you suspect a compromise. 

My inspiration for this was the hijack that happened a few months ago involving Notepad++, where malicious actors weaponized a compromised plugin and updater mechanism to drop a rogue DLL into the application directory. When a trusted application like Notepad++ loads a malicious DLL, it can easily bypass standard security alerts.

Fortunately, you don't always need heavy, slow security suites to do a quick sanity check. PowerShell is built right into Windows and acts as a incredibly fast, native diagnostic tool. Here are a few quick scripts you can run right now to investigate your system.

### Check for a Specific File

If a threat intelligence report or a security blog identifies a specific malicious file name or a rogue DLL associated with a breach, your first step should be hunting for it on your local drive.

The following command recursively scans your `C:\` drive for a specific file name, quietly ignoring permission errors so your terminal doesn't get flooded with red text:

```
&copy&
Get-ChildItem -Path C:\ -Recurse -Filter malware.dll -ErrorAction SilentlyContinue

```

If you find a suspicious file and need to verify if it's actually malicious, you can generate its unique cryptographic fingerprint (hash) and check it against databases like VirusTotal:

```
&copy&
Get-FileHash -Path "C:\path\to\file" -Algorithm SHA256

```

### Check Current Network Connections

Malware often needs to talk to a Command and Control (C2) server to receive instructions or exfiltrate your data. If you have a list of known malicious IP addresses, you can check if your machine is actively communicating with them right now.

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

### Check DNS Cache

Even if the malware isn't actively communicating at the exact second you run a command, Windows keeps a temporary history of the domain names your computer has recently looked up. By querying the DNS client cache, you can see if your machine recently tried to connect to known malicious domains.

```
&copy&
Get-DnsClientCache | Where-Object {
    $_.Entry -match "this|that|something"
}

```

### Conclusion

PowerShell is an incredibly versatile tool for live incident response. By keeping a handful of these basic hunting scripts ready, you can transform from a passive user into a proactive defender of your own machine.