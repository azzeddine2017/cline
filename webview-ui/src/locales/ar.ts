// Arabic translations
export const ar = {
	// Common
	"common.loading": "جاري التحميل...",
	"common.error": "خطأ",
	"common.success": "تم بنجاح",
	"common.cancel": "إلغاء",
	"common.save": "حفظ",
	"common.close": "إغلاق",
	"common.done": "تم",
	"common.edit": "تعديل",
	"common.delete": "حذف",
	"common.search": "بحث",
	"common.submit": "إرسال",
	"common.back": "رجوع",
	"common.next": "التالي",
	"common.previous": "السابق",
	"common.yes": "نعم",
	"common.no": "لا",
	"common.ok": "موافق",
	"common.settings": "الإعدادات",
	"common.help": "المساعدة",
	"common.about": "حول",
	"common.customInstructions": "تعليمات مخصصة",
	"common.customInstructionsPlaceholder":
		'مثال: "قم بتشغيل اختبارات الوحدة في النهاية"، "استخدم TypeScript مع async/await"، "تحدث بالعربية"',
	"common.customInstructionsDescription": "تتم إضافة هذه التعليمات إلى نهاية رسالة النظام المرسلة مع كل طلب.",
	"common.separateModels": "استخدام نماذج مختلفة لوضعي التخطيط والتنفيذ",
	"common.separateModelsDescription":
		"سيؤدي التبديل بين وضعي التخطيط والتنفيذ إلى الاحتفاظ بواجهة برمجة التطبيقات والنموذج المستخدم في الوضع السابق. قد يكون هذا مفيدًا عند استخدام نموذج استدلال قوي لتصميم خطة لنموذج برمجة أرخص للعمل عليها.",
	"common.telemetry": "السماح بإرسال تقارير الأخطاء والاستخدام المجهولة",
	"common.telemetryDescription":
		"ساعد في تحسين كلاين من خلال إرسال بيانات استخدام مجهولة وتقارير أخطاء. لن يتم إرسال أي كود أو مطالبات أو معلومات شخصية أبدًا.",
	"common.planMode": "وضع التخطيط",
	"common.actMode": "وضع التنفيذ",

	// Welcome View
	"welcome.title": "مرحباً، أنا كلاين",
	"welcome.description":
		"يمكنني القيام بكل أنواع المهام بفضل التطورات في قدرات البرمجة الذاتية لـ Claude 3.7 Sonnet والوصول إلى الأدوات التي تتيح لي إنشاء وتعديل الملفات واستكشاف المشاريع المعقدة واستخدام المتصفح وتنفيذ أوامر الطرفية (بإذنك بالطبع). يمكنني حتى استخدام MCP لإنشاء أدوات جديدة وتوسيع قدراتي.",
	"welcome.getStarted": "البدء",

	// Home Header
	"home.whatCanIDo": "كيف يمكنني مساعدتك؟",
	"home.capabilities":
		"يمكنني تطوير البرمجيات خطوة بخطوة من خلال تعديل الملفات واستكشاف المشاريع وتشغيل الأوامر واستخدام المتصفحات. يمكنني حتى توسيع قدراتي باستخدام أدوات MCP للمساعدة بما يتجاوز إكمال الكود الأساسي.",

	// Chat View
	"chat.placeholder": "أرسل رسالة إلى كلاين...",
	"chat.send": "إرسال",
	"chat.retry": "إعادة المحاولة",
	"chat.stop": "إيقاف",
	"chat.thinking": "يفكر...",
	"chat.generating": "ينشئ...",
	"chat.regenerate": "إعادة الإنشاء",
	"chat.copyCode": "نسخ الكود",
	"chat.copyResponse": "نسخ الرد",

	// Settings View
	"settings.title": "الإعدادات",
	"settings.api": "واجهة برمجة التطبيقات",
	"settings.model": "النموذج",
	"settings.provider": "المزود",
	"settings.apiKey": "مفتاح API",
	"settings.temperature": "درجة الحرارة",
	"settings.maxTokens": "الحد الأقصى للرموز",
	"settings.preferredLanguage": "اللغة المفضلة",
	"settings.preferredLanguageDescription": "اللغة التي يجب أن يستخدمها كلاين للتواصل.",
	"settings.theme": "المظهر",
	"settings.autoApprove": "الموافقة التلقائية",
	"settings.save": "حفظ الإعدادات",

	// Auto Approve Menu
	"autoApprove.enable": "تمكين الموافقة التلقائية",
	"autoApprove.toggleAll": "تبديل الكل",
	"autoApprove.readFiles": "قراءة ملفات المشروع",
	"autoApprove.readAllFiles": "قراءة جميع الملفات",

	// Slash Commands
	"slashCommands.newtask": "إنشاء مهمة جديدة مع سياق من المهمة الحالية",
	"slashCommands.smol": "تكثيف نافذة السياق الحالية",
	"slashCommands.newrule": "إنشاء قاعدة كلاين جديدة بناءً على محادثتك",
	"slashCommands.reportbug": "إنشاء مشكلة على Github مع كلاين",

	// Rules
	"rules.title": "قواعد كلاين",
	"rules.description": "تساعد القواعد كلاين على فهم كيف تريد أن يتصرف",
	"rules.create": "إنشاء قاعدة",
	"rules.edit": "تعديل قاعدة",
	"rules.delete": "حذف قاعدة",
	"rules.name": "اسم القاعدة",
	"rules.content": "محتوى القاعدة",
	"rules.save": "حفظ القاعدة",
	"rules.cancel": "إلغاء",
	"rules.noRules": "لا توجد قواعد حتى الآن. أنشئ واحدة للبدء!",

	// Context
	"context.addFile": "إضافة ملف",
	"context.addFolder": "إضافة مجلد",
	"context.addUrl": "إضافة رابط",
	"context.addProblems": "إضافة مشاكل",
	"context.addTerminal": "إضافة طرفية",
	"context.search": "البحث في الملفات...",

	// Browser
	"browser.launch": "تشغيل المتصفح",
	"browser.navigate": "التنقل",
	"browser.refresh": "تحديث",
	"browser.back": "رجوع",
	"browser.forward": "تقدم",
	"browser.close": "إغلاق المتصفح",

	// Terminal
	"terminal.execute": "تنفيذ الأمر",
	"terminal.stop": "إيقاف الأمر",
	"terminal.clear": "مسح الطرفية",

	// Prompts
	"prompt.default":
		"أنا مساعد ذكاء اصطناعي يُدعى كلاين. يمكنني مساعدتك في مهام البرمجة، والإجابة على الأسئلة، وتقديم المعلومات.",
	"prompt.systemMessage": "أنت كلاين، مساعد ذكاء اصطناعي يساعد في مهام البرمجة وتطوير البرمجيات.",
	"prompt.userMessage": "مرحباً، أحتاج إلى مساعدة في مشروعي.",
	"prompt.assistantMessage": "مرحباً! يسعدني مساعدتك في مشروعك. ما الذي تعمل عليه؟",
}
