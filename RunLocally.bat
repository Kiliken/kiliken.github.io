@echo off
set chromePath="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
start "" %chromePath% --user-data-dir="C:\VirtualBrowserUser" --allow-file-access-from-files --allow-file-access --allow-cross-origin-auth-prompt --window-size=1280,720 "file:///%cd%/index.html"