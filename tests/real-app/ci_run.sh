#!/bin/bash
# CI: ایک جانچ چلاؤ، پورا نتیجہ out/<نام>.log میں (artifact کے ساتھ)، اور ناکامی ہو تو
# FAIL / Traceback سطریں — اور ہمیشہ آخری سطریں — GitHub کی annotations میں، تاکہ PR کے صفحے
# (اور API) پر وجہ نظر آئے (job کا پورا log ہر جگہ سے نہیں کھلتا)۔
# استعمال: bash ci_run.sh real_test.py
t="$1"
log="out/${t%.py}.log"
mkdir -p out
python "$t" 2>&1 | tee "$log"
rc=${PIPESTATUS[0]}
if [ "$rc" -ne 0 ]; then
  grep -aE "^FAIL|^  ✗|Traceback|Error:|Exception" "$log" | head -15 | while IFS= read -r line; do
    echo "::error title=${t}::${line:0:900}"
  done
  tail_txt=$(tail -n 25 "$log" | cut -c1-240 | tr '\n' '|' )
  echo "::error title=${t} (exit ${rc}, last lines)::${tail_txt:0:6000}"
fi
exit "$rc"
