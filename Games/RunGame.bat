:: Francesco Paolo Mariani
:: なんか問題があったらchromePathを自分のパソコンのchomeパスにしてください。
@echo off
set chromePath="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
%chromePath% --user-data-dir="C:\VirtualBrowserUser" --allow-file-access-from-files --allow-file-access --allow-cross-origin-auth-prompt --window-size=1280,720 --hide-scrollbars --app="file:///%cd%/index.html"