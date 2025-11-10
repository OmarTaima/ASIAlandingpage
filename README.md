# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## صفحة المنتج (RTL بالعربية)

تمت إضافة صفحة منتج مخصصة للعطور باللغة العربية وبالاتجاه من اليمين لليسار، مع الميزات التالية:

- فيديو للمنتج يتكرر تلقائيًا عند الانتهاء (من `src/assets/ME MODA.mp4`).
- عروض: 2 عطور مقابل 500 جنيه، و4 عطور مقابل 800 جنيه.
- فئات رجالي/نسائي مع إبقاء الاختيارات محفوظة عند التنقل بين الفئات.
- عدّاد يوضح عدد المختارات والمتبقي وفق العرض المحدد.
- ملخص شبيه بالسلة مع إمكانية مسح الاختيارات.
- زر "أطلب الآن" ينقلك إلى نموذج تأكيد الطلب في نفس الصفحة.
- نموذج يتضمن: الاسم، الهاتف، العنوان، ملاحظات، مع إظهار السعر، وسعر التوصيل الثابت 40 جنيه، والإجمالي.

### التشغيل محليًا

1. تثبيت الاعتمادات:

```powershell
npm install
```

2. تشغيل بيئة التطوير:

```powershell
npm run dev
```

3. أو بناء النسخة الإنتاجية:

```powershell
npm run build
```

> ملاحظة: يمكن تغيير ملف الفيديو أو استبداله بوضع ملف آخر في `src/assets/` وتعديل المسار في `src/ProductPage.jsx` عند الحاجة.
