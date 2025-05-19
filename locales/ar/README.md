<div align="center"><sub>
<a href="https://github.com/cline/cline/blob/main/README.md" target="_blank">English</a> | العربية | <a href="https://github.com/cline/cline/blob/main/locales/es/README.md" target="_blank">Español</a> | <a href="https://github.com/cline/cline/blob/main/locales/de/README.md" target="_blank">Deutsch</a> | <a href="https://github.com/cline/cline/blob/main/locales/ja/README.md" target="_blank">日本語</a> | <a href="https://github.com/cline/cline/blob/main/locales/zh-cn/README.md" target="_blank">简体中文</a> | <a href="https://github.com/cline/cline/blob/main/locales/zh-tw/README.md" target="_blank">繁體中文</a> | <a href="https://github.com/cline/cline/blob/main/locales/ko/README.md" target="_blank">한국어</a>
</sub></div>

# كلاين – رقم 1 على OpenRouter

<div align="center">
  <a href="https://cline.bot">
    <img src="https://raw.githubusercontent.com/cline/cline/main/assets/cline-logo-white.png" alt="Cline Logo" width="80" height="80">
  </a>
  <p align="center">
    مساعد برمجة ذكي مدعوم بـ Claude 3.7 Sonnet
    <br />
    <a href="https://docs.cline.bot"><strong>استكشف الوثائق »</strong></a>
    <br />
    <br />
    <a href="https://cline.bot">الموقع الرسمي</a>
    ·
    <a href="https://github.com/cline/cline/issues">الإبلاغ عن مشكلة</a>
    ·
    <a href="https://discord.gg/cline">انضم إلى Discord</a>
  </p>
</div>

## نظرة عامة

كلاين هو مساعد برمجة ذكي مدعوم بـ Claude 3.7 Sonnet من Anthropic. يمكنه تطوير البرمجيات خطوة بخطوة من خلال تعديل الملفات واستكشاف المشاريع وتشغيل الأوامر واستخدام المتصفحات. يمكنه حتى توسيع قدراته باستخدام أدوات MCP للمساعدة بما يتجاوز إكمال الكود الأساسي.

## المميزات

- **تطوير البرمجيات خطوة بخطوة**: يقوم كلاين بتحليل المشاريع وتعديل الملفات وتنفيذ الأوامر لمساعدتك في تطوير البرمجيات.
- **استخدام المتصفح**: يمكن لكلاين استخدام المتصفح للبحث عن المعلومات وتنزيل الملفات وتصفح المواقع.
- **توسيع القدرات**: يمكن لكلاين استخدام أدوات MCP لتوسيع قدراته وإنشاء أدوات جديدة.
- **دعم متعدد اللغات**: يدعم كلاين العديد من لغات البرمجة واللغات الطبيعية.

## البدء

<details>
<summary>التثبيت من المصدر</summary>

1. استنساخ المستودع (يتطلب [git-lfs](https://git-lfs.com/)):

    ```bash
    git clone https://github.com/cline/cline.git
    ```

2. فتح المشروع في VSCode:

    ```bash
    code cline
    ```

3. تثبيت التبعيات اللازمة للإضافة وواجهة المستخدم:

    ```bash
    npm run install:all
    ```

4. اضغط على `F5` (أو اختر "تشغيل" -> "بدء التصحيح") لبدء التشغيل وفتح نافذة VSCode جديدة مع الإضافة المحملة. (إذا واجهت مشاكل في بناء المشروع، قد تحتاج إلى تثبيت [إضافة esbuild problem matchers](https://marketplace.visualstudio.com/items?itemName=connor4312.esbuild-problem-matchers))

</details>

<details>
<summary>إنشاء طلب سحب (Pull Request)</summary>

1. قبل إنشاء طلب السحب، قم بإنشاء عنصر changeset:

    ```bash
    npm run changeset
    ```

   سيطلب منك هذا ملء:
   - نوع التغيير (major، minor، patch)
     - `major` → تغيير كبير (1.0.0 → 2.0.0)
     - `minor` → ميزة جديدة (1.0.0 → 1.1.0)
     - `patch` → إصلاح خطأ (1.0.0 → 1.0.1)
   - وصف التغيير الخاص بك

2. قم بإنشاء فرع جديد وارفع التغييرات الخاصة بك:

    ```bash
    git checkout -b my-feature-branch
    git add .
    git commit -m "feat: add my new feature"
    git push -u origin my-feature-branch
    ```

3. انتقل إلى [صفحة GitHub](https://github.com/cline/cline/pulls) وانقر على "New pull request"

</details>

## الترخيص

[Apache 2.0 © 2025 Cline Bot Inc.](./LICENSE)
