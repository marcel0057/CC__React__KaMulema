$ErrorActionPreference = "Stop"

Write-Host "Demarrage du backend Spring Boot KA MOLEMA..." -ForegroundColor Green
Write-Host "Le serveur lira .env a la racine du projet si le fichier existe." -ForegroundColor Yellow

$springBackend = Join-Path $PSScriptRoot "spring-backend"
$bundledMaven = "C:\Users\auror\Documents\Codex\tools\apache-maven-3.9.15\bin\mvn.cmd"

Push-Location $springBackend
try {
  if (Test-Path ".\mvnw.cmd") {
    .\mvnw.cmd spring-boot:run
  } elseif (Test-Path $bundledMaven) {
    & $bundledMaven spring-boot:run
  } else {
    mvn spring-boot:run
  }
} finally {
  Pop-Location
}
