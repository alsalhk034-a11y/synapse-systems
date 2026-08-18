# 🚀 دليل النشر على Cloudflare — خطوة بخطوة

## المتطلبات قبل البدء

1. **حساب Cloudflare**: حساب مجاني في [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Node.js 18+** (موجود عندك ✓)
3. **Wrangler CLI**: أداة Cloudflare الرسمية

---

## الخطوة 1: تثبيت Wrangler وتسجيل الدخول

```bash
# تثبيت wrangler globally
npm install -g wrangler

# تسجيل الدخول (سيفتح المتصفح)
wrangler login
```

---

## الخطوة 2: تشغيل سكربت الإعداد التلقائي

```bash
# من جذر المشروع
npm run cf:setup
```

هذا السكربت يقوم بـ:
- ✓ إنشاء D1 Database
- ✓ إنشاء R2 Bucket
- ✓ إنشاء KV Namespace
- ✓ تحديث `wrangler.toml` بالمعرّفات الحقيقية
- ✓ توليد وتخزين الأسرار (JWT_SECRET, ENCRYPTION_KEY)
- ✓ تشغيل الـ Migrations
- ✓ نشر Worker
- ✓ نشر Frontend على Pages

> **⏱ المدة**: 3-5 دقائق

---

## الخطوة 3: تحضير النشر اليدوي (إذا فشل setup التلقائي)

### 3.1 إنشاء D1 Database

```bash
wrangler d1 create synapse-systems-db
```

انسخ الـ `database_id` الناتج وألصقه في `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "synapse-systems-db"
database_id = "الصق_المعرف_هنا"
```

### 3.2 إنشاء R2 Bucket

```bash
wrangler r2 bucket create synapse-files
```

### 3.3 إنشاء KV Namespace

```bash
wrangler kv namespace create CACHE
```

انسخ الـ `id` الناتج وألصقه في `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "الصق_المعرف_هنا"
```

### 3.4 توليد الأسرار

```bash
# ولّد JWT_SECRET (لا تحفظه في الكود!)
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"

# ولّد ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 3.5 رفع الأسرار

```bash
wrangler secret put JWT_SECRET
# الصق القيمة التي ولّدتها

wrangler secret put ENCRYPTION_KEY
wrangler secret put DATABASE_ENCRYPTION_KEY
```

### 3.6 تشغيل Migrations

```bash
wrangler d1 migrations apply synapse-systems-db --remote
```

### 3.7 إدخال البيانات الأولية

```bash
wrangler d1 execute synapse-systems-db --remote --file=./worker/d1/0002_seed.sql
```

---

## الخطوة 4: نشر Worker

```bash
# تثبيت dependencies الخاص بـ Worker
cd worker
npm install
npm run deploy
cd ..
```

ستحصل على رابط مثل:
```
Published synapse-systems
  https://synapse-systems.<your-subdomain>.workers.dev
```

---

## الخطوة 5: نشر Frontend على Pages

### 5.1 بناء Frontend

```bash
npm run build
```

### 5.2 النشر

```bash
wrangler pages deploy dist --project-name synapse-systems-web
```

> **في أول مرة**: سيطلب منك تأكيد إنشاء المشروع. أجب `y`.

بعد النشر ستحصل على رابط مثل:
```
https://synapse-systems-web.pages.dev
```

### 5.3 إضافة Domain مخصص (اختياري)

في Cloudflare Dashboard → Pages → synapse-systems-web → Custom domains:
- أضف `app.your-clinic.com`
- DNS سيتم تحديثه تلقائياً

---

## الخطوة 6: ربط Frontend بالـ Worker

في Pages → synapse-systems-web → Settings → Environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://synapse-systems.<subdomain>.workers.dev/api` |

أو ببساطة اتركها فارغة لاستخدام proxy على نفس النطاق.

---

## الخطوة 7: الدخول لأول مرة

افتح رابط Pages، ثم سجّل دخول بـ:
- **Username**: `admin`
- **Password**: `ChangeMe123!`

> **🚨 فوراً بعد الدخول**: اذهب إلى Settings → Users → غيّر كلمة سر `admin`!

---

## 📊 حدود Cloudflare المجانية (Free Tier)

| المورد | الحد المجاني | يكفي لـ |
|---|---|---|
| **Workers Requests** | 100,000/يوم | عيادة متوسطة |
| **D1 Reads** | 5,000,000/يوم | ~1000 مريض |
| **D1 Writes** | 100,000/يوم | ~2000 عملية/يوم |
| **D1 Storage** | 5 GB | ~10,000 مريض |
| **R2 Storage** | 10 GB | آلاف الملفات |
| **R2 Operations** | 10M/شهر | مريح |
| **Pages Bandwidth** | غير محدود ✓ | ✓ |
| **Pages Builds** | 500/شهر | ✓ |

> **إذا تجاوزت**: التكلفة ~$5/شهر لـ 100K مريض

---

## 🛠️ أوامر مفيدة

```bash
# عرض السجلات الحية
npm run cf:tail

# تنفيذ استعلام على D1
npm run cf:db:shell "SELECT COUNT(*) FROM patients"

# نسخ احتياطي
npm run cf:db:backup

# تشغيل Worker محلياً مع D1 محلي
npm run cf:dev

# تشغيل Frontend + Worker معاً
# Terminal 1: cd worker && npm run dev
# Terminal 2: npm run dev
```

---

## 🆘 حل المشاكل الشائعة

### ❌ "Authentication error [code: 10000]"

```bash
wrangler logout
wrangler login
```

### ❌ "Database not found"

تأكد من تشغيل Migrations:
```bash
cd worker
wrangler d1 migrations apply synapse-systems-db --remote
```

### ❌ CORS errors في المتصفح

في `worker/src/index.ts` تحقق من `c.env.FRONTEND_URL`:
```toml
[vars]
FRONTEND_URL = "https://synapse-systems-web.pages.dev"
```

### ❌ Token ينتهي بسرعة

في `worker/src/index.ts` عدّل `exp`:
```typescript
exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8  // 8 ساعات
```

### ❌ "Secret not set"

```bash
wrangler secret put JWT_SECRET
```

---

## 🔐 قائمة الأمان قبل الإطلاق للإنتاج

- [ ] تغيير كلمة سر `admin` الافتراضية
- [ ] تغيير كلمات سر `doctor` و `nurse` التجريبية
- [ ] إنشاء مستخدمين حقيقيين
- [ ] تخصيص JWT_SECRET (توليد عشوائي قوي)
- [ ] تخصيص ENCRYPTION_KEY
- [ ] تفعيل 2FA على حساب Cloudflare
- [ ] إضافة Domain مخصص مع HTTPS
- [ ] مراجعة CSP headers في `public/_headers`
- [ ] اختبار جميع الصلاحيات
- [ ] عمل نسخة احتياطية أولية

---

## 📞 الدعم

- [Cloudflare Docs](https://developers.cloudflare.com)
- [Hono Framework](https://hono.dev)
- [D1 Documentation](https://developers.cloudflare.com/d1)

---

**بالتوفيق! 🏥**

إذا واجهت أي مشكلة، شغّل `npm run cf:tail` وراقب السجلات.
