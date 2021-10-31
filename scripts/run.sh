#!/bin/bash
SCRIPT_DIR="$(dirname $0)/../src/main.ts"
deno run --unstable --allow-read --allow-write --allow-net $SCRIPT_DIR