#!/bin/bash
# CI: ایک جانچ چلاؤ، پورا نتیجہ out/<نام>.log میں (artifact کے ساتھ)، اور ناکامی ہو تو
# FAIL / Traceback سطریں GitHub کی annotations میں — تاکہ PR کے صفحے (اور API) پر وجہ نظر آئے۔
# استعمال: bash ci_run.sh real_test.py
t="$1"
mkdir -p out
python "$t" 2>&1 | tee "out/${t%.py}.log"
rc=${PIPESTATUS[0]}
if [ "$rc" -ne 0 ]; then
  grep -E "^FAIL|^  ✗|Traceback|Error:|Exception" "out/${t%.py}.log" | head -20 | while IFS= read -r line; do
    echo "::error title=${t}::${line:0:900}"
  done
fi
exit "$rc"
