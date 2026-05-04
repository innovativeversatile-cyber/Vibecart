"use strict";

/**
 * npm 10+ can omit the `expo` executable from `node_modules/.bin` when the `expo`
 * package is primarily resolved as a peer (see lockfile `peer: true`), while still
 * linking other bins from the same package. EAS runs `npx expo prebuild`, which
 * requires that shim — recreate the same layout npm would generate.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const binDir = path.join(root, "node_modules", ".bin");
const expoCli = path.join(root, "node_modules", "expo", "bin", "cli");

function writeIfChanged(filePath, contents) {
  try {
    if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === contents) {
      return;
    }
  } catch {
    /* write */
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function main() {
  if (!fs.existsSync(expoCli)) {
    console.warn("[ensure-expo-cli-bin] skip: expo CLI not found at", expoCli);
    return;
  }
  if (!fs.existsSync(binDir)) {
    console.warn("[ensure-expo-cli-bin] skip: .bin missing");
    return;
  }

  const unix = `#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")

case \`uname\` in
    *CYGWIN*|*MINGW*|*MSYS*)
        if command -v cygpath > /dev/null 2>&1; then
            basedir=\`cygpath -w "$basedir"\`
        fi
    ;;
esac

if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/../expo/bin/cli" "$@"
else
  exec node  "$basedir/../expo/bin/cli" "$@"
fi
`;

  const cmd = `@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\\node.exe" (
  SET "_prog=%dp0%\\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\..\\expo\\bin\\cli" %*
`;

  const ps1 = `#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent

$exe=""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  $exe=".exe"
}
$cli = [System.IO.Path]::GetFullPath((Join-Path $basedir "..\expo\bin\cli"))
$ret=0
if (Test-Path "$basedir/node$exe") {
  if ($MyInvocation.ExpectingInput) {
    $input | & "$basedir/node$exe"  $cli $args
  } else {
    & "$basedir/node$exe"  $cli $args
  }
  $ret=$LASTEXITCODE
} else {
  if ($MyInvocation.ExpectingInput) {
    $input | & "node$exe"  $cli $args
  } else {
    & "node$exe"  $cli $args
  }
  $ret=$LASTEXITCODE
}
exit $ret
`;

  const shPath = path.join(binDir, "expo");
  const cmdPath = path.join(binDir, "expo.cmd");
  const ps1Path = path.join(binDir, "expo.ps1");

  writeIfChanged(shPath, unix);
  writeIfChanged(cmdPath, cmd);
  writeIfChanged(ps1Path, ps1);

  try {
    fs.chmodSync(shPath, 0o755);
  } catch {
    /* Windows */
  }
}

main();
