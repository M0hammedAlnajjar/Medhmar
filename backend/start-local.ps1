# Run from any directory; credentials exist only in this process and its child.
$ErrorActionPreference = 'Stop'

if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    throw 'Maven was not found on PATH. Install/configure Maven, then retry.'
}
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw 'Java was not found on PATH. Configure JDK 21, then retry.'
}

$previousUrl = $env:DB_URL
$previousUsername = $env:DB_USERNAME
$previousPassword = $env:DB_PASSWORD
$exitCode = 1

try {
    if ([string]::IsNullOrWhiteSpace($env:DB_URL)) {
        $env:DB_URL = 'jdbc:mysql://localhost:3306/gulf_racing'
    }
    if ([string]::IsNullOrWhiteSpace($env:DB_USERNAME) -or $env:DB_USERNAME -eq '${DB_USERNAME}') {
        $username = Read-Host 'MySQL username'
        if ([string]::IsNullOrWhiteSpace($username) -or $username -eq '${DB_USERNAME}') {
            throw 'Enter your actual MySQL username.'
        }
        $env:DB_USERNAME = $username.Trim()
    }
    if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD) -or $env:DB_PASSWORD -eq '${DB_PASSWORD}') {
        $securePassword = Read-Host 'MySQL password (hidden)' -AsSecureString
        $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
        try {
            $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
            if ([string]::IsNullOrEmpty($env:DB_PASSWORD)) {
                throw 'A non-empty MySQL password is required by this launcher.'
            }
        }
        finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
            $securePassword.Dispose()
        }
    }

    Push-Location $PSScriptRoot
    try {
        & mvn spring-boot:run
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
}
finally {
    $env:DB_URL = $previousUrl
    $env:DB_USERNAME = $previousUsername
    $env:DB_PASSWORD = $previousPassword
}

exit $exitCode
