Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [System.IO.Compression.ZipFile]::OpenRead('D:\Localwheels\localwheels-vinofyx-deployment.zip')
Write-Host "Total entries: $($z.Entries.Count)"
$z.Entries | Select-Object -First 30 | ForEach-Object { Write-Host $_.FullName }
$z.Dispose()

