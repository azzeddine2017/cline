import { Task } from "../task"

/**
 * واجهة للمهام التي يمكن استخدامها في نظام التعلم
 * تعريف الحد الأدنى من الواجهة المطلوبة للتعامل مع المهام
 */
export interface TaskInterface {
	taskId?: string
	getContext?(): string
	setTaskContext?(context: string): void
	applyLearning?(patterns: any[], preferences: Map<string, string>): void
}

/**
 * نظام التعلم الذاتي - يتيح لـ Cline التعلم من تفاعلات المستخدم وتحسين أدائه مع مرور الوقت
 * يساعد على تكييف سلوك Cline ليناسب احتياجات المستخدم بشكل أفضل
 */
export class SelfLearningSystem {
	private feedbackMemory: FeedbackMemory = new FeedbackMemory()
	private patternLearner: PatternLearner = new PatternLearner()
	private preferenceLearner: PreferenceLearner = new PreferenceLearner()
	private enabled: boolean = true

	/**
	 * تعيين حالة تفعيل نظام التعلم
	 * @param enabled حالة التفعيل
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled
		console.log(`Self learning system ${enabled ? 'enabled' : 'disabled'}`)
	}

	/**
	 * التعلم من ردود فعل المستخدم
	 * @param taskId معرف المهمة
	 * @param feedback رد فعل المستخدم
	 */
	async learnFromFeedback(taskId: string, feedback: UserFeedback): Promise<void> {
		// تخزين ردود فعل المستخدم
		await this.feedbackMemory.storeFeedback(taskId, feedback)

		// تحليل ردود الفعل لاكتشاف الأنماط
		if (feedback.type === "positive") {
			await this.patternLearner.learnPositivePattern(feedback.context, feedback.action)
		} else if (feedback.type === "negative") {
			await this.patternLearner.learnNegativePattern(feedback.context, feedback.action)
		}

		// تعلم تفضيلات المستخدم
		await this.preferenceLearner.learnPreference(feedback)
	}

	/**
	 * تطبيق ما تم تعلمه على مهمة
	 * @param task المهمة
	 * @param contextOverride تجاوز السياق (اختياري)
	 */
	async applyLearning(task: Task | TaskInterface, contextOverride?: string): Promise<void> {
		// التحقق من تفعيل نظام التعلم
		if (!this.enabled) {
			console.log("Self learning system is disabled. Skipping learning application.")
			return
		}

		try {
			// الحصول على الأنماط ذات الصلة
			// استخدام الوصف أو المعلومات المتاحة من المهمة
			let contextStr = ""

			// استخدام السياق المتجاوز إذا تم توفيره
			if (contextOverride) {
				contextStr = contextOverride
			} else {
				// محاولة الحصول على سياق المهمة بطرق مختلفة
				if ("taskId" in task && task.taskId) {
					contextStr += `Task ID: ${task.taskId} `
				}

				// استخدام أي معلومات أخرى متاحة
				// نحاول الوصول إلى الخصائص بشكل آمن
				try {
					// محاولة الحصول على سياق المهمة من خلال getContext إذا كانت متاحة
					if ("getContext" in task) {
						// استخدام type assertion لإخبار TypeScript بأن task له خاصية getContext
						const taskWithContext = task as { getContext(): string }
						const context = taskWithContext.getContext()
						if (context && typeof context === "string") {
							contextStr += context
						}
					}
				} catch (e) {
					// تجاهل الخطأ
					console.warn("Error getting task context:", e)
				}
			}

			// تحليل السياق لاستخراج معلومات إضافية
			const contextInfo = this.analyzeContext(contextStr)

			// الحصول على الأنماط ذات الصلة
			const relevantPatterns = await this.patternLearner.getRelevantPatterns(contextStr)

			// الحصول على تفضيلات المستخدم
			const userPreferences = await this.preferenceLearner.getUserPreferences()

			// تحسين التفضيلات بناءً على تحليل السياق
			const enhancedPreferences = this.enhancePreferences(userPreferences, contextInfo)

			// تعديل سلوك المهمة بناءً على ما تم تعلمه
			if ("applyLearning" in task) {
				// استخدام type assertion لإخبار TypeScript بأن task له خاصية applyLearning
				const taskWithApplyLearning = task as { applyLearning(patterns: any[], preferences: Map<string, string>): void }

				// تطبيق التعلم على المهمة
				taskWithApplyLearning.applyLearning(relevantPatterns, enhancedPreferences)

				// تعيين سياق المهمة إذا كان ذلك ممكنًا
				if ("setTaskContext" in task && contextInfo.enhancedContext) {
					const taskWithSetContext = task as { setTaskContext(context: string): void }
					try {
						// إضافة معلومات التعلم إلى سياق المهمة
						const learningContext = JSON.stringify({
							appliedPatterns: relevantPatterns.length,
							appliedPreferences: enhancedPreferences.size,
							contextInfo: {
								domain: contextInfo.domain,
								language: contextInfo.language,
								complexity: contextInfo.complexity,
							}
						})

						taskWithSetContext.setTaskContext(learningContext)
					} catch (e) {
						console.warn("Error setting task context:", e)
					}
				}

				console.log(
					"Applied learning to task:",
					relevantPatterns.length,
					"patterns and",
					enhancedPreferences.size,
					"preferences",
					`(domain: ${contextInfo.domain}, language: ${contextInfo.language})`
				)
			} else {
				console.warn("Task does not support applyLearning method")
			}
		} catch (error) {
			console.error("Error applying learning to task:", error)
		}
	}

	/**
	 * تحليل سياق المهمة
	 * @param context سياق المهمة
	 * @returns معلومات السياق
	 */
	private analyzeContext(context: string): ContextInfo {
		const contextInfo: ContextInfo = {
			domain: "general",
			language: "unknown",
			complexity: "medium",
			enhancedContext: null,
		}

		// تحليل المجال
		const domainPatterns = {
			web: ["html", "css", "dom", "browser", "frontend", "website", "webpage", "web"],
			backend: ["server", "api", "database", "sql", "nosql", "rest", "graphql", "backend"],
			mobile: ["android", "ios", "mobile", "app", "react native", "flutter", "swift", "kotlin"],
			desktop: ["desktop", "electron", "windows", "macos", "linux", "gui", "ui"],
			devops: ["docker", "kubernetes", "ci/cd", "pipeline", "deploy", "aws", "azure", "cloud"],
			data: ["data", "analytics", "machine learning", "ai", "statistics", "visualization", "pandas"],
			gaming: ["game", "unity", "unreal", "3d", "rendering", "physics", "animation"],
		}

		// تحليل اللغة
		const languagePatterns = {
			typescript: ["typescript", "ts", "interface", "type", "enum"],
			javascript: ["javascript", "js", "node", "npm", "yarn", "react", "vue", "angular"],
			python: ["python", "py", "pip", "django", "flask", "numpy", "pandas"],
			java: ["java", "spring", "maven", "gradle", "jvm"],
			csharp: ["c#", "csharp", ".net", "asp.net", "xamarin"],
			go: ["go", "golang", "goroutine"],
			rust: ["rust", "cargo", "ownership", "borrowing"],
			ruby: ["ruby", "rails", "gem"],
			php: ["php", "composer", "laravel", "symfony"],
			swift: ["swift", "ios", "xcode", "cocoa"],
			kotlin: ["kotlin", "android", "jetpack"],
		}

		// تحليل التعقيد
		const complexityPatterns = {
			low: ["simple", "basic", "beginner", "easy", "straightforward"],
			medium: ["moderate", "intermediate", "standard"],
			high: ["complex", "advanced", "difficult", "expert", "sophisticated", "optimization"],
		}

		// تحليل المجال
		for (const [domain, patterns] of Object.entries(domainPatterns)) {
			if (patterns.some(pattern => context.toLowerCase().includes(pattern))) {
				contextInfo.domain = domain
				break
			}
		}

		// تحليل اللغة
		for (const [language, patterns] of Object.entries(languagePatterns)) {
			if (patterns.some(pattern => context.toLowerCase().includes(pattern))) {
				contextInfo.language = language
				break
			}
		}

		// تحليل التعقيد
		for (const [complexity, patterns] of Object.entries(complexityPatterns)) {
			if (patterns.some(pattern => context.toLowerCase().includes(pattern))) {
				contextInfo.complexity = complexity
				break
			}
		}

		// إنشاء سياق محسن
		contextInfo.enhancedContext = `Domain: ${contextInfo.domain}, Language: ${contextInfo.language}, Complexity: ${contextInfo.complexity}`

		return contextInfo
	}

	/**
	 * تحسين التفضيلات بناءً على تحليل السياق
	 * @param preferences التفضيلات الأصلية
	 * @param contextInfo معلومات السياق
	 * @returns التفضيلات المحسنة
	 */
	private enhancePreferences(
		preferences: Map<string, string>,
		contextInfo: ContextInfo
	): Map<string, string> {
		// نسخ التفضيلات الأصلية
		const enhancedPreferences = new Map(preferences)

		// إضافة تفضيلات خاصة بالمجال
		if (contextInfo.domain !== "general") {
			enhancedPreferences.set("domain", contextInfo.domain)
		}

		// إضافة تفضيلات خاصة باللغة
		if (contextInfo.language !== "unknown") {
			enhancedPreferences.set("language", contextInfo.language)
		}

		// إضافة تفضيلات خاصة بالتعقيد
		enhancedPreferences.set("complexity", contextInfo.complexity)

		// تعديل التفضيلات بناءً على المجال واللغة
		if (contextInfo.domain === "web" && !enhancedPreferences.has("code_style")) {
			enhancedPreferences.set("code_style", "web_standard")
		}

		if (contextInfo.language === "typescript" && !enhancedPreferences.has("code_style")) {
			enhancedPreferences.set("code_style", "typescript_standard")
		}

		return enhancedPreferences
	}

	/**
	 * توليد رؤى من البيانات المتعلمة
	 * @returns الرؤى المتولدة
	 */
	async generateInsights(): Promise<LearningInsight[]> {
		// توليد رؤى من البيانات المتعلمة
		const patternInsights = await this.patternLearner.generateInsights()
		const preferenceInsights = await this.preferenceLearner.generateInsights()

		return [...patternInsights, ...preferenceInsights]
	}

	/**
	 * تصدير ما تم تعلمه
	 * @returns بيانات التعلم
	 */
	async exportLearning(): Promise<LearningExport> {
		// تصدير ما تم تعلمه لاستخدامه في جلسات مستقبلية
		return {
			patterns: await this.patternLearner.exportPatterns(),
			preferences: await this.preferenceLearner.exportPreferences(),
			feedback: await this.feedbackMemory.exportFeedback(),
		}
	}

	/**
	 * استيراد بيانات التعلم
	 * @param learningData بيانات التعلم
	 */
	async importLearning(learningData: LearningExport): Promise<void> {
		// استيراد بيانات التعلم من جلسات سابقة
		await this.patternLearner.importPatterns(learningData.patterns)
		await this.preferenceLearner.importPreferences(learningData.preferences)
		await this.feedbackMemory.importFeedback(learningData.feedback)
	}
}

/**
 * فئة لتخزين ردود فعل المستخدم
 */
export class FeedbackMemory {
	private feedback: Map<string, UserFeedback[]> = new Map()

	/**
	 * تخزين رد فعل
	 * @param taskId معرف المهمة
	 * @param feedback رد الفعل
	 */
	async storeFeedback(taskId: string, feedback: UserFeedback): Promise<void> {
		if (!this.feedback.has(taskId)) {
			this.feedback.set(taskId, [feedback])
		} else {
			this.feedback.get(taskId)!.push(feedback)
		}
	}

	/**
	 * تصدير ردود الفعل
	 * @returns ردود الفعل
	 */
	async exportFeedback(): Promise<Map<string, UserFeedback[]>> {
		return new Map(this.feedback)
	}

	/**
	 * استيراد ردود الفعل
	 * @param feedback ردود الفعل
	 */
	async importFeedback(feedback: Map<string, UserFeedback[]>): Promise<void> {
		this.feedback = new Map(feedback)
	}
}

/**
 * فئة لتعلم أنماط الكود
 */
export class PatternLearner {
	private positivePatterns: Map<string, number> = new Map()
	private negativePatterns: Map<string, number> = new Map()

	/**
	 * تعلم نمط إيجابي
	 * @param context السياق
	 * @param action الإجراء
	 */
	async learnPositivePattern(context: string, action: string): Promise<void> {
		const pattern = this.extractPattern(context, action)
		const currentCount = this.positivePatterns.get(pattern) || 0
		this.positivePatterns.set(pattern, currentCount + 1)
	}

	/**
	 * تعلم نمط سلبي
	 * @param context السياق
	 * @param action الإجراء
	 */
	async learnNegativePattern(context: string, action: string): Promise<void> {
		const pattern = this.extractPattern(context, action)
		const currentCount = this.negativePatterns.get(pattern) || 0
		this.negativePatterns.set(pattern, currentCount + 1)
	}

	/**
	 * الحصول على الأنماط ذات الصلة
	 * @param context السياق
	 * @returns الأنماط ذات الصلة
	 */
	async getRelevantPatterns(context: string): Promise<RelevantPattern[]> {
		// إيجاد الأنماط ذات الصلة بالسياق الحالي
		const relevantPatterns: RelevantPattern[] = []

		// البحث في الأنماط الإيجابية
		for (const [pattern, count] of this.positivePatterns.entries()) {
			if (this.isPatternRelevant(pattern, context)) {
				relevantPatterns.push({
					pattern,
					confidence: count / 10, // تبسيط: الثقة تزداد مع عدد المرات
					isPositive: true,
				})
			}
		}

		// البحث في الأنماط السلبية
		for (const [pattern, count] of this.negativePatterns.entries()) {
			if (this.isPatternRelevant(pattern, context)) {
				relevantPatterns.push({
					pattern,
					confidence: count / 10,
					isPositive: false,
				})
			}
		}

		// ترتيب الأنماط حسب الثقة
		return relevantPatterns.sort((a, b) => b.confidence - a.confidence)
	}

	/**
	 * توليد رؤى من الأنماط المتعلمة
	 * @returns الرؤى المتولدة
	 */
	async generateInsights(): Promise<LearningInsight[]> {
		// توليد رؤى من الأنماط المتعلمة
		const insights: LearningInsight[] = []

		// تحليل الأنماط الإيجابية الأكثر شيوعًا
		const topPositivePatterns = Array.from(this.positivePatterns.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)

		for (const [pattern, count] of topPositivePatterns) {
			insights.push({
				type: "positive_pattern",
				description: `نمط مفضل: ${pattern}`,
				confidence: count / 10,
				source: "pattern_learner",
			})
		}

		// تحليل الأنماط السلبية الأكثر شيوعًا
		const topNegativePatterns = Array.from(this.negativePatterns.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)

		for (const [pattern, count] of topNegativePatterns) {
			insights.push({
				type: "negative_pattern",
				description: `نمط غير مفضل: ${pattern}`,
				confidence: count / 10,
				source: "pattern_learner",
			})
		}

		return insights
	}

	/**
	 * تصدير الأنماط
	 * @returns بيانات الأنماط
	 */
	async exportPatterns(): Promise<PatternExport> {
		return {
			positive: new Map(this.positivePatterns),
			negative: new Map(this.negativePatterns),
		}
	}

	/**
	 * استيراد الأنماط
	 * @param patterns بيانات الأنماط
	 */
	async importPatterns(patterns: PatternExport): Promise<void> {
		this.positivePatterns = new Map(patterns.positive)
		this.negativePatterns = new Map(patterns.negative)
	}

	/**
	 * استخراج نمط من السياق والإجراء
	 * @param context السياق
	 * @param action الإجراء
	 * @returns النمط
	 */
	private extractPattern(context: string, action: string): string {
		// استخراج نمط من السياق والإجراء
		// تحسين: استخراج الكلمات المفتاحية من السياق والإجراء

		// تنظيف السياق والإجراء
		const cleanContext = this.cleanText(context)
		const cleanAction = this.cleanText(action)

		// استخراج الكلمات المفتاحية من السياق
		const contextKeywords = this.extractKeywords(cleanContext, 5)

		// استخراج الكلمات المفتاحية من الإجراء
		const actionKeywords = this.extractKeywords(cleanAction, 3)

		// دمج الكلمات المفتاحية لإنشاء نمط
		return `${contextKeywords.join("_")}:${actionKeywords.join("_")}`
	}

	/**
	 * تنظيف النص
	 * @param text النص
	 * @returns النص المنظف
	 */
	private cleanText(text: string): string {
		// إزالة علامات الترقيم والأحرف الخاصة
		return text
			.toLowerCase()
			.replace(/[^\w\s]/g, " ")
			.replace(/\s+/g, " ")
			.trim()
	}

	/**
	 * استخراج الكلمات المفتاحية من النص
	 * @param text النص
	 * @param maxKeywords الحد الأقصى لعدد الكلمات المفتاحية
	 * @returns الكلمات المفتاحية
	 */
	private extractKeywords(text: string, maxKeywords: number): string[] {
		// تقسيم النص إلى كلمات
		const words = text.split(" ")

		// إزالة الكلمات الشائعة
		const commonWords = [
			"a", "an", "the", "in", "on", "at", "to", "for", "with", "by", "about",
			"like", "through", "over", "before", "between", "after", "since", "without",
			"under", "within", "along", "following", "across", "behind", "beyond",
			"plus", "except", "but", "up", "out", "around", "down", "off", "above", "near",
			"and", "or", "if", "then", "else", "when", "where", "how", "what", "why", "who",
		]

		// فلترة الكلمات الشائعة والكلمات القصيرة
		const filteredWords = words.filter(word =>
			!commonWords.includes(word) && word.length > 2
		)

		// إرجاع الكلمات المفتاحية (الحد الأقصى)
		return filteredWords.slice(0, maxKeywords)
	}

	/**
	 * التحقق من صلة النمط بالسياق
	 * @param pattern النمط
	 * @param context السياق
	 * @returns هل النمط ذو صلة
	 */
	private isPatternRelevant(pattern: string, context: string): boolean {
		// التحقق من صلة النمط بالسياق
		// تحسين: استخدام مقياس التشابه بين النمط والسياق

		// تنظيف السياق
		const cleanContext = this.cleanText(context)

		// تقسيم النمط إلى جزء السياق وجزء الإجراء
		const patternParts = pattern.split(":")
		if (patternParts.length < 1) {
			return false
		}

		// الحصول على كلمات السياق في النمط
		const patternContextKeywords = patternParts[0].split("_")

		// حساب عدد الكلمات المشتركة
		let matchCount = 0
		for (const keyword of patternContextKeywords) {
			if (cleanContext.includes(keyword)) {
				matchCount++
			}
		}

		// حساب درجة التشابه
		const similarity = patternContextKeywords.length > 0
			? matchCount / patternContextKeywords.length
			: 0

		// اعتبار النمط ذو صلة إذا كانت درجة التشابه أكبر من 0.3
		return similarity > 0.3
	}
}

/**
 * فئة لتعلم تفضيلات المستخدم
 */
export class PreferenceLearner {
	private preferences: Map<string, PreferenceData> = new Map()

	/**
	 * تعلم تفضيل من رد فعل
	 * @param feedback رد الفعل
	 */
	async learnPreference(feedback: UserFeedback): Promise<void> {
		// تعلم تفضيلات المستخدم من ردود الفعل
		const category = this.categorizePreference(feedback)
		const value = this.extractPreferenceValue(feedback)

		if (!this.preferences.has(category)) {
			this.preferences.set(category, { value, confidence: 1, lastUpdated: Date.now() })
		} else {
			const current = this.preferences.get(category)!
			if (current.value === value) {
				current.confidence += 1
			} else {
				// إذا كانت القيمة مختلفة، قم بتحديث القيمة إذا كانت الثقة منخفضة
				if (current.confidence < 3) {
					current.value = value
					current.confidence = 1
				} else {
					// إذا كانت الثقة عالية، قلل منها فقط
					current.confidence -= 0.5
				}
			}
			current.lastUpdated = Date.now()
		}
	}

	/**
	 * الحصول على تفضيلات المستخدم
	 * @returns تفضيلات المستخدم
	 */
	async getUserPreferences(): Promise<Map<string, string>> {
		// إرجاع تفضيلات المستخدم الحالية
		const result = new Map<string, string>()
		for (const [category, data] of this.preferences.entries()) {
			if (data.confidence >= 2) {
				result.set(category, data.value)
			}
		}
		return result
	}

	/**
	 * توليد رؤى من تفضيلات المستخدم
	 * @returns الرؤى المتولدة
	 */
	async generateInsights(): Promise<LearningInsight[]> {
		// توليد رؤى من تفضيلات المستخدم
		const insights: LearningInsight[] = []

		for (const [category, data] of this.preferences.entries()) {
			if (data.confidence >= 3) {
				insights.push({
					type: "user_preference",
					description: `تفضيل المستخدم: ${category} = ${data.value}`,
					confidence: data.confidence / 5, // تطبيع الثقة إلى نطاق 0-1
					source: "preference_learner",
				})
			}
		}

		return insights
	}

	/**
	 * تصدير التفضيلات
	 * @returns بيانات التفضيلات
	 */
	async exportPreferences(): Promise<Map<string, PreferenceData>> {
		return new Map(this.preferences)
	}

	/**
	 * استيراد التفضيلات
	 * @param preferences بيانات التفضيلات
	 */
	async importPreferences(preferences: Map<string, PreferenceData>): Promise<void> {
		this.preferences = new Map(preferences)
	}

	/**
	 * تصنيف نوع التفضيل
	 * @param feedback رد الفعل
	 * @returns فئة التفضيل
	 */
	private categorizePreference(feedback: UserFeedback): string {
		// تصنيف نوع التفضيل بناءً على السياق والإجراء
		const context = feedback.context.toLowerCase()
		const action = feedback.action.toLowerCase()
		const details = feedback.details?.toLowerCase() || ""

		// تحديد الفئات المختلفة للتفضيلات مع كلمات مفتاحية أكثر تفصيلاً
		const categories = {
			code_style: [
				"format", "style", "indent", "spacing", "naming", "convention", "tabs", "spaces",
				"bracket", "brace", "semicolon", "camelcase", "snake_case", "kebab-case", "pascal",
				"lint", "prettier", "eslint", "format", "clean", "readable", "consistency"
			],
			ui_preference: [
				"ui", "interface", "color", "theme", "layout", "display", "dark", "light", "contrast",
				"font", "size", "zoom", "panel", "sidebar", "toolbar", "menu", "icon", "button",
				"window", "split", "view", "screen", "resolution", "visibility", "hide", "show"
			],
			language_preference: [
				"language", "typescript", "javascript", "python", "java", "c#", "go", "rust", "ruby",
				"php", "html", "css", "sql", "bash", "shell", "powershell", "markdown", "json", "yaml",
				"xml", "framework", "library", "package", "module", "import", "syntax", "compiler"
			],
			communication_style: [
				"verbose", "concise", "detailed", "brief", "explain", "comment", "documentation",
				"clarity", "simple", "complex", "technical", "beginner", "advanced", "step-by-step",
				"overview", "summary", "comprehensive", "thorough", "quick", "fast", "slow", "careful"
			],
			workflow: [
				"workflow", "process", "steps", "approach", "method", "technique", "strategy",
				"planning", "design", "implementation", "testing", "debugging", "refactoring",
				"review", "collaboration", "solo", "team", "agile", "waterfall", "sprint", "milestone"
			],
			tool_preference: [
				"tool", "editor", "ide", "terminal", "command", "git", "vscode", "intellij", "sublime",
				"atom", "vim", "emacs", "notepad", "browser", "chrome", "firefox", "edge", "safari",
				"extension", "plugin", "addon", "feature", "shortcut", "hotkey", "keyboard", "mouse"
			],
			ai_interaction: [
				"ai", "assistant", "bot", "help", "suggestion", "recommendation", "auto", "automatic",
				"completion", "copilot", "intellisense", "hint", "prompt", "response", "answer",
				"question", "query", "request", "instruction", "command", "directive", "guidance"
			],
			performance: [
				"performance", "speed", "fast", "slow", "optimize", "efficient", "memory", "cpu",
				"resource", "usage", "load", "time", "latency", "response", "quick", "delay", "lag",
				"bottleneck", "profile", "benchmark", "measure", "metric", "improvement", "degradation"
			],
			security: [
				"security", "secure", "protection", "vulnerability", "risk", "threat", "attack",
				"defense", "encrypt", "decrypt", "hash", "password", "authentication", "authorization",
				"permission", "access", "control", "firewall", "sandbox", "isolation", "validation"
			],
		}

		// حساب درجة التطابق لكل فئة
		const categoryScores = new Map<string, number>()

		// دمج السياق والإجراء والتفاصيل للبحث
		const combinedText = `${context} ${action} ${details}`

		// حساب درجة التطابق لكل فئة
		for (const [category, keywords] of Object.entries(categories)) {
			let score = 0
			for (const keyword of keywords) {
				// البحث عن الكلمة المفتاحية في النص المدمج
				if (combinedText.includes(keyword)) {
					// زيادة الدرجة بناءً على طول الكلمة المفتاحية (الكلمات الأطول أكثر تحديدًا)
					score += Math.min(1, keyword.length / 5)
				}
			}

			if (score > 0) {
				categoryScores.set(category, score)
			}
		}

		// إذا تم العثور على فئات متطابقة، اختر الفئة ذات الدرجة الأعلى
		if (categoryScores.size > 0) {
			const sortedCategories = Array.from(categoryScores.entries())
				.sort((a, b) => b[1] - a[1])

			return sortedCategories[0][0]
		}

		// إذا لم يتم العثور على فئة محددة، استخدم تحليل أكثر تفصيلاً
		// استخراج الكلمات المفتاحية من السياق
		const contextWords = context.split(/\s+/)
			.filter(word => word.length > 3)
			.map(word => word.replace(/[^\w]/g, ""))

		// البحث عن كلمة مفتاحية ذات معنى
		for (const word of contextWords) {
			// تجاهل الكلمات الشائعة
			const commonWords = ["this", "that", "with", "from", "have", "what", "when", "where", "which", "there", "their", "about"]
			if (!commonWords.includes(word) && word.length > 3) {
				return word
			}
		}

		// إذا لم يتم العثور على كلمة مفتاحية، استخدم "general"
		return "general"
	}

	/**
	 * استخراج قيمة التفضيل
	 * @param feedback رد الفعل
	 * @returns قيمة التفضيل
	 */
	private extractPreferenceValue(feedback: UserFeedback): string {
		// استخراج قيمة التفضيل بناءً على نوع التفضيل والإجراء
		const type = feedback.type
		const action = feedback.action
		const context = feedback.context
		const details = feedback.details || ""

		// تنظيف النص
		const cleanAction = action.toLowerCase().trim()
		// استخدام السياق في البحث عن الكلمات المفتاحية إذا لزم الأمر
		const combinedContext = context.toLowerCase().trim()
		const cleanDetails = details.toLowerCase().trim()

		// إذا كان رد الفعل إيجابيًا، استخدم تحليل أكثر تفصيلاً
		if (type === "positive") {
			// البحث عن عبارات تشير إلى التفضيل
			const preferPatterns = [
				/أفضل\s+([^.,;!?]+)/i,
				/أحب\s+([^.,;!?]+)/i,
				/استخدم\s+([^.,;!?]+)/i,
				/اختر\s+([^.,;!?]+)/i,
				/يعجبني\s+([^.,;!?]+)/i,
			]

			// البحث في الإجراء والسياق والتفاصيل
			const combinedText = `${cleanAction} ${combinedContext} ${cleanDetails}`

			// البحث عن أول تطابق
			for (const pattern of preferPatterns) {
				const match = combinedText.match(pattern)
				if (match && match[1]) {
					// تنظيف القيمة المستخرجة
					return match[1].trim().split(/\s+/).slice(0, 3).join("_")
				}
			}

			// إذا لم يتم العثور على تطابق، استخدم الكلمات الرئيسية من الإجراء
			const actionWords = cleanAction.split(/\s+/)
			if (actionWords.length > 0) {
				// استخدام أول 3 كلمات كحد أقصى
				return actionWords.slice(0, 3).join("_")
			}

			return cleanAction
		}

		// إذا كان رد الفعل سلبيًا، حاول استخراج البديل المفضل
		if (type === "negative") {
			// البحث عن عبارات تشير إلى البديل المفضل
			const alternativePatterns = [
				/استخدم\s+([^.,;!?]+)\s+بدلاً/i,
				/أفضل\s+([^.,;!?]+)\s+بدلاً/i,
				/بدلاً\s+من\s+ذلك\s+استخدم\s+([^.,;!?]+)/i,
				/يجب\s+استخدام\s+([^.,;!?]+)/i,
				/الأفضل\s+هو\s+([^.,;!?]+)/i,
			]

			// البحث في الإجراء والسياق والتفاصيل
			const combinedText = `${cleanAction} ${combinedContext} ${cleanDetails}`

			// البحث عن أول تطابق
			for (const pattern of alternativePatterns) {
				const match = combinedText.match(pattern)
				if (match && match[1]) {
					// تنظيف القيمة المستخرجة
					return match[1].trim().split(/\s+/).slice(0, 3).join("_")
				}
			}

			// إذا لم يتم العثور على بديل، استخدم علامة "not_" مع الكلمة الرئيسية من الإجراء
			const mainActionWord = cleanAction.split(/\s+/)[0]
			if (mainActionWord && mainActionWord.length > 2) {
				return `not_${mainActionWord}`
			}

			return `not_${cleanAction.substring(0, 10).replace(/\s+/g, "_")}`
		}

		// للردود المحايدة، استخدم تحليل بسيط
		const neutralWords = cleanAction.split(/\s+/).slice(0, 2).join("_")
		return neutralWords || "neutral_preference"
	}
}

// أنواع البيانات
export interface UserFeedback {
	type: "positive" | "negative" | "neutral"
	context: string
	action: string
	timestamp: number
	details?: string
}

export interface RelevantPattern {
	pattern: string
	confidence: number
	isPositive: boolean
}

export interface LearningInsight {
	type: string
	description: string
	confidence: number
	source: string
}

export interface PatternExport {
	positive: Map<string, number>
	negative: Map<string, number>
}

export interface PreferenceData {
	value: string
	confidence: number
	lastUpdated: number
}

export interface LearningExport {
	patterns: PatternExport
	preferences: Map<string, PreferenceData>
	feedback: Map<string, UserFeedback[]>
}

export interface ContextInfo {
	domain: string
	language: string
	complexity: string
	enhancedContext: string | null
}
