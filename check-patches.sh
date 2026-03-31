#!/bin/bash
# Check that custom patches are present after update
# Run: bash check-patches.sh

ERRORS=0

echo "=== Checking cabinet patches ==="

# 1. yandex_cid in localStorage
if grep -q 'localStorage.setItem.*yandex_cid' src/hooks/useAnalyticsCounters.ts 2>/dev/null; then
  echo "✅ yandex_cid setItem"
else
  echo "❌ yandex_cid setItem MISSING in useAnalyticsCounters.ts"
  ERRORS=$((ERRORS+1))
fi

# 2. getClientID
if grep -q 'getClientID' src/hooks/useAnalyticsCounters.ts 2>/dev/null; then
  echo "✅ getClientID"
else
  echo "❌ getClientID MISSING in useAnalyticsCounters.ts"
  ERRORS=$((ERRORS+1))
fi

# 3. fireAnalyticsEvent export
if grep -q 'export function fireAnalyticsEvent' src/hooks/useAnalyticsCounters.ts 2>/dev/null; then
  echo "✅ fireAnalyticsEvent"
else
  echo "❌ fireAnalyticsEvent MISSING in useAnalyticsCounters.ts"
  ERRORS=$((ERRORS+1))
fi

# 4. referrer in PurchaseRequest
if grep -q 'referrer' src/api/landings.ts 2>/dev/null; then
  echo "✅ referrer in PurchaseRequest"
else
  echo "❌ referrer MISSING in landings.ts"
  ERRORS=$((ERRORS+1))
fi

# 5. referrer in QuickPurchase handleSubmit
if grep -q 'referrer.*document.referrer\|document.referrer.*referrer' src/pages/QuickPurchase.tsx 2>/dev/null; then
  echo "✅ referrer in QuickPurchase"
else
  echo "❌ referrer MISSING in QuickPurchase.tsx"
  ERRORS=$((ERRORS+1))
fi

# 6. purchase_click reachGoal
if grep -q 'purchase_click' src/pages/QuickPurchase.tsx 2>/dev/null; then
  echo "✅ purchase_click goal"
else
  echo "❌ purchase_click MISSING in QuickPurchase.tsx"
  ERRORS=$((ERRORS+1))
fi

# 7. landing_referrer in index.html
if grep -q 'landing_referrer' index.html 2>/dev/null; then
  echo "✅ landing_referrer in index.html"
else
  echo "❌ landing_referrer MISSING in index.html"
  ERRORS=$((ERRORS+1))
fi

# 8. yandex_cid in QuickPurchase
if grep -q 'yandex_cid' src/pages/QuickPurchase.tsx 2>/dev/null; then
  echo "✅ yandex_cid in QuickPurchase"
else
  echo "❌ yandex_cid MISSING in QuickPurchase.tsx"
  ERRORS=$((ERRORS+1))
fi

# 9. ym_counter_id in localStorage
if grep -q 'ym_counter_id' src/hooks/useAnalyticsCounters.ts 2>/dev/null; then
  echo "✅ ym_counter_id"
else
  echo "❌ ym_counter_id MISSING in useAnalyticsCounters.ts"
  ERRORS=$((ERRORS+1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ All patches OK"
else
  echo "❌ $ERRORS patches MISSING — fix before deploy!"
  exit 1
fi
