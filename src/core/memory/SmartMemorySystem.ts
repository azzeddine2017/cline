import { TaskManager } from "../task/TaskManager"
import * as vscode from "vscode"
import * as path from "path"

/**
 * نظام الذاكرة الذكي - يتيح لـ Cline تعلم وتذكر المفاهيم والأنماط وتفضيلات المستخدم
 * يحسن من قدرة Cline على التعامل مع المهام المتكررة والمعقدة
 */
export class SmartMemorySystem {
	private taskManager: TaskManager
	private conceptsMemory: Map<string, ConceptMemory> = new Map()
	private patternMemory: Map<string, PatternMemory> = new Map()
	private userPreferencesMemory: UserPreferencesMemory
	private enabled: boolean = true

	constructor(taskManager: TaskManager) {
		this.taskManager = taskManager
		this.userPreferencesMemory = new UserPreferencesMemory()
	}

	/**
	 * تعيين حالة تفعيل نظام الذاكرة
	 * @param enabled حالة التفعيل
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled
		console.log(`Smart memory system ${enabled ? "enabled" : "disabled"}`)
	}

	/**
	 * تعلم مفهوم جديد وتخزينه في الذاكرة
	 * @param concept اسم المفهوم
	 * @param context سياق المفهوم
	 * @param relevance درجة أهمية المفهوم (0-1)
	 */
	async learnConcept(concept: string, context: string, relevance: number): Promise<void> {
		// التحقق من تفعيل نظام الذاكرة
		if (!this.enabled) {
			console.log("Smart memory system is disabled. Skipping concept learning.")
			return
		}

		if (!this.conceptsMemory.has(concept)) {
			this.conceptsMemory.set(concept, {
				name: concept,
				contexts: [context],
				relevanceScore: relevance,
				firstSeen: Date.now(),
				lastUsed: Date.now(),
				usageCount: 1,
			})
		} else {
			const existingConcept = this.conceptsMemory.get(concept)!
			existingConcept.contexts.push(context)
			existingConcept.relevanceScore = Math.max(existingConcept.relevanceScore, relevance)
			existingConcept.lastUsed = Date.now()
			existingConcept.usageCount++
		}
	}

	/**
	 * تعلم نمط كود جديد وتخزينه في الذاكرة
	 * @param pattern اسم النمط
	 * @param examples أمثلة على النمط
	 * @param effectiveness درجة فعالية النمط (0-1)
	 */
	async learnPattern(pattern: string, examples: string[], effectiveness: number): Promise<void> {
		// التحقق من تفعيل نظام الذاكرة
		if (!this.enabled) {
			console.log("Smart memory system is disabled. Skipping pattern learning.")
			return
		}

		if (!this.patternMemory.has(pattern)) {
			this.patternMemory.set(pattern, {
				name: pattern,
				examples: examples,
				effectivenessScore: effectiveness,
				firstSeen: Date.now(),
				lastUsed: Date.now(),
				usageCount: 1,
			})
		} else {
			const existingPattern = this.patternMemory.get(pattern)!
			existingPattern.examples = [...existingPattern.examples, ...examples]
			existingPattern.effectivenessScore = Math.max(existingPattern.effectivenessScore, effectiveness)
			existingPattern.lastUsed = Date.now()
			existingPattern.usageCount++
		}
	}

	/**
	 * تعلم تفضيل جديد للمستخدم
	 * @param category فئة التفضيل
	 * @param preference التفضيل نفسه
	 * @param context سياق التفضيل (اختياري)
	 * @param strength قوة التفضيل (0-1، اختياري)
	 */
	async learnUserPreference(category: string, preference: string, context: string = "", strength: number = 0.7): Promise<void> {
		// التحقق من تفعيل نظام الذاكرة
		if (!this.enabled) {
			console.log("Smart memory system is disabled. Skipping user preference learning.")
			return
		}

		this.userPreferencesMemory.addPreference(category, preference, context, strength)
	}

	/**
	 * استرجاع المعلومات ذات الصلة بالمهمة الحالية
	 * @param taskContext سياق المهمة
	 * @returns المعلومات ذات الصلة
	 */
	async retrieveRelevantMemory(taskContext: string): Promise<RelevantMemory> {
		const relevantConcepts = this.findRelevantConcepts(taskContext)
		const relevantPatterns = this.findRelevantPatterns(taskContext)
		const relevantPreferences = this.userPreferencesMemory.getRelevantPreferences(taskContext)

		return {
			concepts: relevantConcepts,
			patterns: relevantPatterns,
			preferences: relevantPreferences,
		}
	}

	/**
	 * تحديث الذاكرة بناءً على نتائج المهمة
	 * @param taskId معرف المهمة
	 * @param success هل نجحت المهمة
	 */
	async updateMemoryFromTaskResult(taskId: string, success: boolean): Promise<void> {
		try {
			// الحصول على المهمة من TaskManager
			const task = this.taskManager.getTask?.(taskId)
			if (!task) {
				console.warn(`Task with ID ${taskId} not found`)
				return
			}

			// الحصول على سياق المهمة
			let taskContext = ""

			// نحاول استخدام طريقة getTaskContext إذا كانت متاحة
			try {
				// @ts-ignore - نتجاهل خطأ TypeScript لأننا نعلم أن هذه الطريقة موجودة
				if (typeof task.getTaskContext === "function") {
					// @ts-ignore
					taskContext = task.getTaskContext()
				}
			} catch (e) {
				console.warn(`Could not get context for task ${taskId}`, e)
			}
			// تحديث فعالية الأنماط المستخدمة في المهمة
			const usedPatterns = Array.from(this.patternMemory.keys()).filter((pattern) => taskContext.includes(pattern))

			for (const pattern of usedPatterns) {
				const patternData = this.patternMemory.get(pattern)
				if (patternData) {
					// زيادة أو تقليل فعالية النمط بناءً على نجاح المهمة
					if (success) {
						patternData.effectivenessScore = Math.min(1, patternData.effectivenessScore + 0.1)
					} else {
						patternData.effectivenessScore = Math.max(0, patternData.effectivenessScore - 0.1)
					}
					patternData.lastUsed = Date.now()
					patternData.usageCount++
				}
			}

			// تحديث أهمية المفاهيم المستخدمة في المهمة
			const usedConcepts = Array.from(this.conceptsMemory.keys()).filter((concept) => taskContext.includes(concept))

			for (const concept of usedConcepts) {
				const conceptData = this.conceptsMemory.get(concept)
				if (conceptData) {
					// زيادة أو تقليل أهمية المفهوم بناءً على نجاح المهمة
					if (success) {
						conceptData.relevanceScore = Math.min(1, conceptData.relevanceScore + 0.1)
					} else {
						conceptData.relevanceScore = Math.max(0, conceptData.relevanceScore - 0.05)
					}
					conceptData.lastUsed = Date.now()
					conceptData.usageCount++
				}
			}

			// تحديث تفضيلات المستخدم المستخدمة في المهمة
			// استخراج الكلمات المفتاحية من سياق المهمة
			const keywords = taskContext
				.toLowerCase()
				.split(/\s+/)
				.filter((word) => word.length > 2)
				.slice(0, 10) // أخذ أهم 10 كلمات

			// تحديث قوة التفضيلات ذات الصلة
			for (const [category, preferences] of this.userPreferencesMemory.exportPreferences().entries()) {
				for (const preference of preferences) {
					// التحقق مما إذا كان التفضيل مستخدمًا في المهمة
					const isUsed = keywords.some(
						(keyword) =>
							preference.value.toLowerCase().includes(keyword) ||
							(preference.context && preference.context.toLowerCase().includes(keyword)),
					)

					if (isUsed) {
						this.userPreferencesMemory.updatePreferenceStrength(category, preference.value, success)
					}
				}
			}

			// حفظ التغييرات
			await this.persistMemory()
		} catch (error) {
			console.error("Error updating memory from task result:", error)
		}
	}

	/**
	 * حفظ الذاكرة إلى ملفات
	 */
	async persistMemory(): Promise<void> {
		try {
			// حفظ الذاكرة في ملفات يمكن استخدامها في جلسات مستقبلية
			const memoryData = {
				concepts: Array.from(this.conceptsMemory.entries()),
				patterns: Array.from(this.patternMemory.entries()),
				preferences: Array.from(this.userPreferencesMemory.exportPreferences().entries()),
			}

			// التأكد من وجود مجلد الذاكرة
			const workspaceFolders = vscode.workspace.workspaceFolders
			if (!workspaceFolders) {
				console.error("No workspace folder open")
				return
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath
			const memoryDir = path.join(workspaceRoot, ".cline", "memory")

			// إنشاء مجلد الذاكرة إذا لم يكن موجودًا
			await vscode.workspace.fs.createDirectory(vscode.Uri.file(memoryDir))

			// حفظ بيانات الذاكرة
			const memoryFilePath = path.join(memoryDir, "memory.json")
			await vscode.workspace.fs.writeFile(
				vscode.Uri.file(memoryFilePath),
				new Uint8Array(Buffer.from(JSON.stringify(memoryData, null, 2), "utf-8")),
			)

			console.log("Memory persisted successfully")
		} catch (error) {
			console.error("Error persisting memory:", error)
		}
	}

	/**
	 * تحميل الذاكرة من ملفات
	 */
	async loadMemory(): Promise<void> {
		try {
			// التأكد من وجود مجلد الذاكرة
			const workspaceFolders = vscode.workspace.workspaceFolders
			if (!workspaceFolders) {
				console.error("No workspace folder open")
				return
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath
			const memoryFilePath = path.join(workspaceRoot, ".cline", "memory", "memory.json")

			// التحقق من وجود ملف الذاكرة
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(memoryFilePath))
			} catch (error) {
				console.log("No memory file found, starting with empty memory")
				return
			}

			// قراءة ملف الذاكرة
			const memoryFileData = await vscode.workspace.fs.readFile(vscode.Uri.file(memoryFilePath))
			const memoryData = JSON.parse(Buffer.from(memoryFileData).toString("utf-8"))

			// تحميل المفاهيم
			if (memoryData.concepts) {
				this.conceptsMemory = new Map(memoryData.concepts)
			}

			// تحميل الأنماط
			if (memoryData.patterns) {
				this.patternMemory = new Map(memoryData.patterns)
			}

			// تحميل التفضيلات
			if (memoryData.preferences) {
				this.userPreferencesMemory.importPreferences(new Map(memoryData.preferences))
			}

			console.log("Memory loaded successfully")
		} catch (error) {
			console.error("Error loading memory:", error)
		}
	}

	/**
	 * إيجاد المفاهيم ذات الصلة بسياق معين
	 * @param context السياق
	 * @returns المفاهيم ذات الصلة
	 */
	private findRelevantConcepts(context: string): ConceptMemory[] {
		const relevantConcepts: ConceptMemory[] = []
		const contextKeywords = this.extractKeywords(context)

		// خوارزمية متقدمة للبحث عن المفاهيم ذات الصلة
		for (const concept of this.conceptsMemory.values()) {
			// حساب درجة الصلة بالسياق
			let relevanceScore = 0

			// التحقق من وجود اسم المفهوم في السياق
			if (context.toLowerCase().includes(concept.name.toLowerCase())) {
				relevanceScore += 0.5
			}

			// التحقق من وجود سياقات المفهوم في السياق الحالي
			for (const conceptContext of concept.contexts) {
				if (context.toLowerCase().includes(conceptContext.toLowerCase())) {
					relevanceScore += 0.3
				}
			}

			// التحقق من وجود الكلمات المفتاحية في سياقات المفهوم
			const conceptKeywords = concept.contexts.flatMap((c) => this.extractKeywords(c))
			for (const keyword of contextKeywords) {
				if (conceptKeywords.includes(keyword) || concept.name.toLowerCase().includes(keyword)) {
					relevanceScore += 0.1
				}
			}

			// إضافة المفهوم إذا كانت درجة الصلة كافية
			if (relevanceScore > 0.2) {
				// نسخ المفهوم وتعديل درجة الأهمية بناءً على الصلة بالسياق
				const relevantConcept = { ...concept }
				relevantConcept.relevanceScore = (concept.relevanceScore + relevanceScore) / 2
				relevantConcepts.push(relevantConcept)
			}
		}

		// ترتيب المفاهيم حسب الأهمية
		return relevantConcepts.sort((a, b) => b.relevanceScore - a.relevanceScore)
	}

	/**
	 * استخراج الكلمات المفتاحية من النص
	 * @param text النص
	 * @returns الكلمات المفتاحية
	 */
	private extractKeywords(text: string): string[] {
		// تقسيم النص إلى كلمات
		const words = text.toLowerCase().split(/\s+/)

		// إزالة الكلمات الشائعة
		const commonWords = [
			"a",
			"an",
			"the",
			"in",
			"on",
			"at",
			"to",
			"for",
			"with",
			"by",
			"about",
			"like",
			"through",
			"over",
			"before",
			"between",
			"after",
			"since",
			"without",
			"under",
			"within",
			"along",
			"following",
			"across",
			"behind",
			"beyond",
			"plus",
			"except",
			"but",
			"up",
			"out",
			"around",
			"down",
			"off",
			"above",
			"near",
		]

		// إرجاع الكلمات المفتاحية (الكلمات غير الشائعة وطولها أكبر من 2)
		return words.filter((word) => !commonWords.includes(word) && word.length > 2)
	}

	/**
	 * إيجاد الأنماط ذات الصلة بسياق معين
	 * @param context السياق
	 * @returns الأنماط ذات الصلة
	 */
	private findRelevantPatterns(context: string): PatternMemory[] {
		const relevantPatterns: PatternMemory[] = []
		const contextKeywords = this.extractKeywords(context)

		// خوارزمية متقدمة للبحث عن الأنماط ذات الصلة
		for (const pattern of this.patternMemory.values()) {
			// حساب درجة الصلة بالسياق
			let relevanceScore = 0

			// التحقق من وجود اسم النمط في السياق
			if (context.toLowerCase().includes(pattern.name.toLowerCase())) {
				relevanceScore += 0.5
			}

			// التحقق من وجود أمثلة النمط في السياق
			for (const example of pattern.examples) {
				// استخدام مقتطفات من الأمثلة للمقارنة
				const exampleSnippets = this.getSnippets(example, 5)
				for (const snippet of exampleSnippets) {
					if (context.toLowerCase().includes(snippet.toLowerCase())) {
						relevanceScore += 0.3
						break
					}
				}
			}

			// التحقق من وجود الكلمات المفتاحية في أمثلة النمط
			const patternKeywords = pattern.examples.flatMap((e) => this.extractKeywords(e))
			for (const keyword of contextKeywords) {
				if (patternKeywords.includes(keyword) || pattern.name.toLowerCase().includes(keyword)) {
					relevanceScore += 0.1
				}
			}

			// إضافة النمط إذا كانت درجة الصلة كافية
			if (relevanceScore > 0.2) {
				// نسخ النمط وتعديل درجة الفعالية بناءً على الصلة بالسياق
				const relevantPattern = { ...pattern }
				relevantPattern.effectivenessScore = (pattern.effectivenessScore + relevanceScore) / 2
				relevantPatterns.push(relevantPattern)
			}
		}

		// ترتيب الأنماط حسب الفعالية
		return relevantPatterns.sort((a, b) => b.effectivenessScore - a.effectivenessScore)
	}

	/**
	 * الحصول على مقتطفات من نص
	 * @param text النص
	 * @param snippetLength طول المقتطف بالكلمات
	 * @returns المقتطفات
	 */
	private getSnippets(text: string, snippetLength: number): string[] {
		const words = text.split(/\s+/)
		const snippets: string[] = []

		// إذا كان النص قصيرًا، أرجع النص كاملًا
		if (words.length <= snippetLength) {
			return [text]
		}

		// إنشاء مقتطفات بطول محدد
		for (let i = 0; i <= words.length - snippetLength; i += Math.ceil(snippetLength / 2)) {
			const snippet = words.slice(i, i + snippetLength).join(" ")
			snippets.push(snippet)
		}

		return snippets
	}
}

/**
 * فئة لإدارة تفضيلات المستخدم
 */
export class UserPreferencesMemory {
	private preferences: Map<string, UserPreference[]> = new Map()
	private categories: string[] = [
		"code_style",
		"language",
		"framework",
		"editor",
		"ui",
		"communication",
		"documentation",
		"testing",
		"performance",
	]

	/**
	 * إضافة تفضيل جديد
	 * @param category فئة التفضيل
	 * @param preference التفضيل نفسه
	 * @param context سياق التفضيل (اختياري)
	 * @param strength قوة التفضيل (0-1، اختياري)
	 */
	addPreference(category: string, preference: string, context: string = "", strength: number = 0.7): void {
		// التحقق من صحة الفئة
		if (!this.categories.includes(category) && !category.startsWith("custom_")) {
			// إذا لم تكن الفئة معروفة، أضفها كفئة مخصصة
			category = `custom_${category}`
		}

		const newPreference: UserPreference = {
			value: preference,
			context: context,
			strength: strength,
			timestamp: Date.now(),
			usageCount: 1,
		}

		if (!this.preferences.has(category)) {
			this.preferences.set(category, [newPreference])
		} else {
			const existingPreferences = this.preferences.get(category)!
			const existingIndex = existingPreferences.findIndex((p) => p.value === preference)

			if (existingIndex >= 0) {
				// تحديث التفضيل الموجود
				const existingPref = existingPreferences[existingIndex]
				existingPref.strength = Math.max(existingPref.strength, strength)
				existingPref.usageCount++
				existingPref.timestamp = Date.now()

				// إضافة السياق الجديد إذا لم يكن موجودًا
				if (context && !existingPref.context.includes(context)) {
					existingPref.context += (existingPref.context ? ", " : "") + context
				}
			} else {
				// إضافة تفضيل جديد
				existingPreferences.push(newPreference)
			}
		}
	}

	/**
	 * الحصول على التفضيلات ذات الصلة بسياق معين
	 * @param context السياق
	 * @returns التفضيلات ذات الصلة
	 */
	getRelevantPreferences(context: string): Map<string, string[]> {
		const relevantPreferences = new Map<string, string[]>()

		// البحث عن الكلمات المفتاحية في السياق
		const keywords = this.extractKeywords(context)

		// فحص كل فئة من التفضيلات
		for (const [category, preferences] of this.preferences.entries()) {
			const relevantValues: string[] = []

			// فرز التفضيلات حسب القوة والصلة بالسياق
			const sortedPreferences = [...preferences].sort((a, b) => {
				// حساب درجة الصلة بالسياق
				const aRelevance = this.calculateContextRelevance(a, keywords)
				const bRelevance = this.calculateContextRelevance(b, keywords)

				// الترتيب حسب الصلة أولاً، ثم حسب القوة
				if (aRelevance !== bRelevance) {
					return bRelevance - aRelevance
				}
				return b.strength - a.strength
			})

			// أخذ أفضل 3 تفضيلات
			for (const pref of sortedPreferences.slice(0, 3)) {
				relevantValues.push(pref.value)
			}

			if (relevantValues.length > 0) {
				relevantPreferences.set(category, relevantValues)
			}
		}

		return relevantPreferences
	}

	/**
	 * حساب درجة صلة التفضيل بالكلمات المفتاحية
	 * @param preference التفضيل
	 * @param keywords الكلمات المفتاحية
	 * @returns درجة الصلة (0-1)
	 */
	private calculateContextRelevance(preference: UserPreference, keywords: string[]): number {
		if (!preference.context || keywords.length === 0) {
			return 0
		}

		// عدد الكلمات المفتاحية الموجودة في سياق التفضيل
		let matchCount = 0
		for (const keyword of keywords) {
			if (preference.context.toLowerCase().includes(keyword.toLowerCase())) {
				matchCount++
			}
		}

		// حساب درجة الصلة
		return matchCount / keywords.length
	}

	/**
	 * استخراج الكلمات المفتاحية من السياق
	 * @param context السياق
	 * @returns الكلمات المفتاحية
	 */
	private extractKeywords(context: string): string[] {
		// تقسيم النص إلى كلمات
		const words = context.toLowerCase().split(/\s+/)

		// إزالة الكلمات الشائعة
		const commonWords = [
			"a",
			"an",
			"the",
			"in",
			"on",
			"at",
			"to",
			"for",
			"with",
			"by",
			"about",
			"like",
			"through",
			"over",
			"before",
			"between",
			"after",
			"since",
			"without",
			"under",
			"within",
			"along",
			"following",
			"across",
			"behind",
			"beyond",
			"plus",
			"except",
			"but",
			"up",
			"out",
			"around",
			"down",
			"off",
			"above",
			"near",
		]

		// إرجاع الكلمات المفتاحية (الكلمات غير الشائعة وطولها أكبر من 2)
		return words.filter((word) => !commonWords.includes(word) && word.length > 2)
	}

	/**
	 * تحديث قوة التفضيل بناءً على الاستخدام
	 * @param category فئة التفضيل
	 * @param preference التفضيل
	 * @param success هل كان الاستخدام ناجحًا
	 */
	updatePreferenceStrength(category: string, preference: string, success: boolean): void {
		if (!this.preferences.has(category)) {
			return
		}

		const prefs = this.preferences.get(category)!
		const prefIndex = prefs.findIndex((p) => p.value === preference)

		if (prefIndex >= 0) {
			const pref = prefs[prefIndex]

			// زيادة أو تقليل قوة التفضيل بناءً على النجاح
			if (success) {
				pref.strength = Math.min(1, pref.strength + 0.1)
			} else {
				pref.strength = Math.max(0, pref.strength - 0.05)
			}

			pref.usageCount++
			pref.timestamp = Date.now()
		}
	}

	/**
	 * الحصول على أفضل التفضيلات في كل فئة
	 * @returns أفضل التفضيلات
	 */
	getTopPreferences(): Map<string, string> {
		const topPreferences = new Map<string, string>()

		for (const [category, preferences] of this.preferences.entries()) {
			if (preferences.length === 0) {
				continue
			}

			// فرز التفضيلات حسب القوة وعدد الاستخدام
			const sortedPrefs = [...preferences].sort((a, b) => {
				// الترتيب حسب القوة أولاً، ثم حسب عدد الاستخدام
				if (b.strength !== a.strength) {
					return b.strength - a.strength
				}
				return b.usageCount - a.usageCount
			})

			// أخذ أفضل تفضيل
			topPreferences.set(category, sortedPrefs[0].value)
		}

		return topPreferences
	}

	/**
	 * تصدير التفضيلات
	 */
	exportPreferences(): Map<string, UserPreference[]> {
		return this.preferences
	}

	/**
	 * استيراد التفضيلات
	 * @param preferences التفضيلات
	 */
	importPreferences(preferences: Map<string, UserPreference[]>): void {
		this.preferences = preferences
	}
}

// أنواع البيانات
export interface ConceptMemory {
	name: string
	contexts: string[]
	relevanceScore: number
	firstSeen: number
	lastUsed: number
	usageCount: number
}

export interface PatternMemory {
	name: string
	examples: string[]
	effectivenessScore: number
	firstSeen: number
	lastUsed: number
	usageCount: number
}

export interface UserPreference {
	value: string
	context: string
	strength: number
	timestamp: number
	usageCount: number
}

export interface RelevantMemory {
	concepts: ConceptMemory[]
	patterns: PatternMemory[]
	preferences: Map<string, string[]>
}
