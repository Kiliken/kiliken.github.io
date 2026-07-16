$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8000/")
$listener.Start()

Write-Host "Serving $PWD at http://localhost:8000/"
Write-Host "Press Ctrl+C to stop."

try {
    while ($listener.IsListening) {

        # Wait for a request, but don't block forever.
        $task = $listener.GetContextAsync()

		while (-not $task.Wait(100)) {
			# wakes up every 100 ms so Ctrl+C can be handled
		}

		$context = $task.Result
        $request = $context.Request
        $response = $context.Response

        $relativePath = $request.Url.LocalPath.TrimStart('/')

        if ($relativePath -eq "") {
            $relativePath = "main.html"
        }

        $path = Join-Path $PWD $relativePath

        if (Test-Path $path -PathType Leaf) {

            switch ([IO.Path]::GetExtension($path).ToLower()) {
                ".html" { $response.ContentType = "text/html" }
                ".js"   { $response.ContentType = "application/javascript" }
                ".css"  { $response.ContentType = "text/css" }
                ".json" { $response.ContentType = "application/json" }
                ".wasm" { $response.ContentType = "application/wasm" }
                ".data" { $response.ContentType = "application/octet-stream" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".jpeg" { $response.ContentType = "image/jpeg" }
                ".gif"  { $response.ContentType = "image/gif" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                default { $response.ContentType = "application/octet-stream" }
            }

            $bytes = [IO.File]::ReadAllBytes($path)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        else {
            $response.StatusCode = 404
        }

        $response.OutputStream.Close()
    }
}
finally {
    Write-Host "`nStopping server..."
    $listener.Stop()
    $listener.Close()
}