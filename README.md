# dio-license — آف لائن لائسنس ٹوکن (خامی 9 کا آف لائن حصہ)

مقصد: قدم 4 کی DB enforcement **آن لائن** لکھائی روکتی ہے۔ یہ Edge Function
**آف لائن** کے لیے حل دیتا ہے: لاگ اِن پر سرور subscription جانچ کر ایک
**مختصر مدت، دستخط شدہ (ECDSA P-256) لائسنس ٹوکن** دیتا ہے۔ کلائنٹ صرف **عوامی
کلید** سے تصدیق کرتا ہے — جعل سازی یا میعاد بڑھانا ممکن نہیں۔ آف لائن رسائی صرف
اسی ٹوکن کی میعاد تک؛ کوئی خودکار 30-دن trial نہیں۔

کرپٹو اسکیم Node پر جانچی گئی: valid ✓ · tampered ✗ · expired ✗ · forged ✗۔

## 1) کلید کی جوڑی بنائیں (ایک بار)

مقامی طور پر یہ چلائیں (Node 18+):

```js
// keygen.mjs
const s = globalThis.crypto.subtle;
const kp = await s.generateKey({ name:'ECDSA', namedCurve:'P-256' }, true, ['sign','verify']);
const pub = await s.exportKey('jwk', kp.publicKey);
const priv = await s.exportKey('jwk', kp.privateKey);
console.log('PRIVATE (Supabase secret):', JSON.stringify(priv));
console.log('PUBLIC  (client):', JSON.stringify({ kty:pub.kty, crv:pub.crv, x:pub.x, y:pub.y }));
```
`node keygen.mjs`

- **PRIVATE JWK** → صرف سرور (نیچے secret)۔ کبھی کلائنٹ میں نہ ڈالیں۔
- **PUBLIC JWK** → `license-token.js` میں `DIO_LICENSE_PUB_JWK` کی جگہ (x, y)۔

## 2) Deploy + secrets

```bash
supabase functions deploy dio-license --no-verify-jwt
supabase secrets set DIO_LICENSE_PRIV_JWK='{"kty":"EC","crv":"P-256","d":"...","x":"...","y":"..."}'
# SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY khud-ba-khud mojood hote hain
```
(`--no-verify-jwt` اس لیے کہ ہم JWT خود function میں verify کرتے ہیں۔)

## 3) کلائنٹ وائرنگ (subscription.js)

`index.html` میں `license-token.js` شامل کریں (subscription.js سے پہلے)، پھر:

- **آن لائن لاگ اِن کے بعد** (مثلاً `loginSuccess` یا `checkSubscription` کے آن لائن راستے میں):
  ```js
  try { await dioRefreshLicense(); } catch(_){}
  ```
- **`checkSubscription()` کے OFFLINE branch** میں `trial/30` کی جگہ:
  ```js
  if (!navigator.onLine) {
    const lic = await dioLicenseValid();
    if (lic.valid) return { status:'active', daysLeft: Math.ceil((lic.entitledUntil-Date.now())/86400000), plan:'آف لائن اجازت' };
    return { status:'expired', daysLeft:0, plan:'میعاد ختم — ایک بار آن لائن آئیں' };
  }
  ```
  اسی طرح top-level `catch` اور error branch میں بھی `trial/30` واپس کرنے کے بجائے
  `dioLicenseValid()` پر انحصار کریں (fail-open ختم)۔

> احتیاط (لاک آؤٹ سے بچاؤ): پہلی بار جب افسر آن لائن ہو، `dioRefreshLicense()`
> ضرور چلے تاکہ ٹوکن مل جائے۔ ورنہ نیا افسر جو کبھی آن لائن نہ آیا ہو، آف لائن
> بلاک ہو سکتا ہے۔ اسی لیے اسے آن لائن لاگ اِن کے فوراً بعد اور وقتاً فوقتاً چلائیں۔

## 4) میعاد

- عام افسر: `min(subscription.expires_at, اب + 48 گھنٹے)` — یعنی زیادہ سے زیادہ 48
  گھنٹے کی آف لائن کھڑکی، پھر آن لائن تجدید۔
- superadmin/admin: ہر بار 72 گھنٹے۔

یہ نمبر `index.ts` میں تبدیل کیے جا سکتے ہیں۔
