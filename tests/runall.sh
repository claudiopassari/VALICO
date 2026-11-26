#!/bin/bash
# Esegue la suite di regressione. Da lanciare dalla radice del repository, dopo: cp src/valico.html app.html
mkdir -p /tmp/valico-tests
export NODE_PATH="$(npm root -g 2>/dev/null):$(pwd)/node_modules"
for f in test.js test2.js $(ls tests/ui*.js | xargs -n1 basename | grep -E '^ui[0-9]+\.js$' | sort -V); do
  r=$(timeout 280 node tests/$f 2>&1 | grep -E "pass|PASS|fail|FAIL|Error" | tail -2 | tr '\n' ' ')
  echo "$f: $r"
done
