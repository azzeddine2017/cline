import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { existsSync } from "fs"

/**
 * محلل الكود المتقدم - يوفر فهمًا أعمق لبنية المشروع والعلاقات بين الملفات
 * يساعد Cline على اتخاذ قرارات أفضل عند تعديل الكود
 */
export class AdvancedCodeAnalyzer {
	private projectGraph: DependencyGraph = new DependencyGraph()
	private codePatterns: CodePatternDetector = new CodePatternDetector()
	private semanticAnalyzer: SemanticAnalyzer = new SemanticAnalyzer()

	/**
	 * تحليل المشروع بأكمله
	 * @param rootPath مسار المشروع
	 * @returns نتائج التحليل
	 */
	async analyzeProject(rootPath: string): Promise<ProjectAnalysis> {
		// تحليل بنية المشروع وإنشاء رسم بياني للتبعيات
		await this.buildDependencyGraph(rootPath)

		// اكتشاف أنماط الكود المستخدمة في المشروع
		const patterns = await this.codePatterns.detectPatterns(rootPath)

		// تحليل دلالي للكود
		const semantics = await this.semanticAnalyzer.analyzeProject(rootPath)

		return {
			dependencyGraph: this.projectGraph,
			detectedPatterns: patterns,
			semanticAnalysis: semantics,
		}
	}

	/**
	 * تحليل ملف واحد
	 * @param filePath مسار الملف
	 * @returns نتائج التحليل
	 */
	async analyzeFile(filePath: string): Promise<FileAnalysis> {
		// تحليل ملف واحد
		const dependencies = await this.projectGraph.getFileDependencies(filePath)
		const patterns = await this.codePatterns.detectPatternsInFile(filePath)
		const semantics = await this.semanticAnalyzer.analyzeFile(filePath)

		return {
			filePath,
			dependencies,
			patterns,
			semantics,
		}
	}

	/**
	 * إيجاد أفضل المواقع لإجراء التعديلات
	 * @param task وصف المهمة
	 * @returns اقتراحات التعديل
	 */
	async findOptimalEditLocations(task: string): Promise<EditSuggestion[]> {
		// تحديد أفضل المواقع لإجراء التعديلات بناءً على المهمة
		const suggestions: EditSuggestion[] = []

		// تحليل المهمة لفهم ما يحتاج إلى تغيير
		const taskKeywords = this.extractKeywords(task)

		// البحث عن الملفات ذات الصلة
		const relevantFiles = await this.findRelevantFiles(taskKeywords)

		// تحليل كل ملف لإيجاد أفضل مكان للتعديل
		for (const file of relevantFiles) {
			const fileAnalysis = await this.analyzeFile(file)
			const editLocations = await this.findEditLocationsInFile(file, fileAnalysis, taskKeywords)
			suggestions.push(...editLocations)
		}

		// ترتيب الاقتراحات حسب الثقة
		return suggestions.sort((a, b) => b.confidence - a.confidence)
	}

	/**
	 * اقتراح تحسينات للكود
	 * @returns اقتراحات التحسين
	 */
	async suggestRefactorings(): Promise<RefactoringSuggestion[]> {
		// اقتراح تحسينات للكود بناءً على التحليل
		const suggestions: RefactoringSuggestion[] = []

		// البحث عن التكرار في الكود
		const duplications = await this.findCodeDuplications()
		for (const duplication of duplications) {
			suggestions.push({
				type: "extract_method",
				files: duplication.files,
				description: `استخراج الكود المتكرر في دالة مشتركة`,
				benefit: "تحسين قابلية الصيانة وتقليل التكرار",
			})
		}

		// البحث عن الدوال الطويلة
		const longMethods = await this.findLongMethods()
		for (const method of longMethods) {
			suggestions.push({
				type: "split_method",
				files: [method.file],
				description: `تقسيم الدالة الطويلة ${method.name} إلى دوال أصغر`,
				benefit: "تحسين قابلية القراءة والصيانة",
			})
		}

		return suggestions
	}

	/**
	 * بناء رسم بياني للتبعيات
	 * @param rootPath مسار المشروع
	 */
	private async buildDependencyGraph(rootPath: string): Promise<void> {
		try {
			// الحصول على قائمة الملفات في المشروع
			const files = await this.getProjectFiles(rootPath)

			// إضافة العقد للرسم البياني
			for (const file of files) {
				this.projectGraph.addNode(file, { type: this.getFileType(file) })
			}

			// تحليل التبعيات بين الملفات
			for (const file of files) {
				const dependencies = await this.findFileDependencies(file)
				for (const dependency of dependencies) {
					this.projectGraph.addEdge(file, dependency)
				}
			}
		} catch (error) {
			console.error("Error building dependency graph:", error)
		}
	}

	/**
	 * الحصول على قائمة الملفات في المشروع
	 * @param rootPath مسار المشروع
	 * @returns قائمة الملفات
	 */
	private async getProjectFiles(rootPath: string): Promise<string[]> {
		try {
			const files: string[] = []
			const ignorePatterns = ["node_modules", ".git", "dist", "build", "out"]

			// استخدام vscode.workspace.findFiles للحصول على الملفات
			const uris = await vscode.workspace.findFiles("**/*.*", `**/{${ignorePatterns.join(",")}}/**`)

			for (const uri of uris) {
				files.push(uri.fsPath)
			}

			return files
		} catch (error) {
			console.error("Error getting project files:", error)
			return []
		}
	}

	/**
	 * تحديد نوع الملف
	 * @param filePath مسار الملف
	 * @returns نوع الملف
	 */
	private getFileType(filePath: string): string {
		const extension = path.extname(filePath).toLowerCase()

		// تصنيف الملفات حسب الامتداد
		const fileTypes: Record<string, string> = {
			".ts": "typescript",
			".js": "javascript",
			".jsx": "react",
			".tsx": "react-typescript",
			".html": "html",
			".css": "css",
			".scss": "scss",
			".json": "json",
			".md": "markdown",
			".py": "python",
			".java": "java",
			".c": "c",
			".cpp": "cpp",
			".cs": "csharp",
			".go": "go",
			".rb": "ruby",
			".php": "php",
		}

		return fileTypes[extension] || "unknown"
	}

	/**
	 * إيجاد تبعيات الملف
	 * @param filePath مسار الملف
	 * @returns قائمة التبعيات
	 */
	private async findFileDependencies(filePath: string): Promise<string[]> {
		try {
			const dependencies: string[] = []
			const content = await fs.readFile(filePath, "utf-8")
			const fileType = this.getFileType(filePath)

			// البحث عن التبعيات حسب نوع الملف
			if (
				fileType === "typescript" ||
				fileType === "javascript" ||
				fileType === "react" ||
				fileType === "react-typescript"
			) {
				// البحث عن عبارات الاستيراد
				const importRegex = /import\s+(?:[\w*{}\s,]+)\s+from\s+['"]([^'"]+)['"]/g
				let match
				while ((match = importRegex.exec(content)) !== null) {
					const importPath = match[1]
					if (!importPath.startsWith(".")) {
						continue
					} // تجاهل المكتبات الخارجية

					// تحويل المسار النسبي إلى مسار مطلق
					const absolutePath = this.resolveImportPath(filePath, importPath)
					if (absolutePath) {
						dependencies.push(absolutePath)
					}
				}
			}

			return dependencies
		} catch (error) {
			console.error(`Error finding dependencies for ${filePath}:`, error)
			return []
		}
	}

	/**
	 * تحويل مسار استيراد نسبي إلى مسار مطلق
	 * @param sourcePath مسار الملف المصدر
	 * @param importPath مسار الاستيراد
	 * @returns المسار المطلق
	 */
	private resolveImportPath(sourcePath: string, importPath: string): string | null {
		try {
			const sourceDir = path.dirname(sourcePath)
			let resolvedPath = path.resolve(sourceDir, importPath)

			// التحقق من وجود الملف مع امتدادات مختلفة
			const extensions = [".ts", ".tsx", ".js", ".jsx", ".json"]

			// إذا كان المسار لا يحتوي على امتداد، جرب الامتدادات المختلفة
			if (!path.extname(resolvedPath)) {
				for (const ext of extensions) {
					const pathWithExt = resolvedPath + ext
					if (existsSync(pathWithExt)) {
						return pathWithExt
					}
				}

				// جرب البحث عن index.* في المجلد
				for (const ext of extensions) {
					const indexPath = path.join(resolvedPath, `index${ext}`)
					if (existsSync(indexPath)) {
						return indexPath
					}
				}

				return null
			}

			// إذا كان المسار يحتوي على امتداد، تحقق من وجود الملف
			if (existsSync(resolvedPath)) {
				return resolvedPath
			}

			return null
		} catch (error) {
			console.error(`Error resolving import path ${importPath} from ${sourcePath}:`, error)
			return null
		}
	}

	/**
	 * استخراج الكلمات المفتاحية من المهمة
	 * @param task وصف المهمة
	 * @returns الكلمات المفتاحية
	 */
	private extractKeywords(task: string): string[] {
		// استخراج الكلمات المفتاحية من المهمة
		// تنفيذ بسيط: تقسيم النص إلى كلمات وإزالة الكلمات الشائعة
		const words = task.toLowerCase().split(/\s+/)
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
		return words.filter((word) => !commonWords.includes(word) && word.length > 2)
	}

	/**
	 * إيجاد الملفات ذات الصلة بالكلمات المفتاحية
	 * @param keywords الكلمات المفتاحية
	 * @returns الملفات ذات الصلة
	 */
	private async findRelevantFiles(keywords: string[]): Promise<string[]> {
		try {
			if (keywords.length === 0) {
				return []
			}

			// الحصول على جميع ملفات المشروع
			const allFiles = await this.getProjectFiles(vscode.workspace.rootPath || "")
			const relevantFiles: string[] = []
			const keywordRegexes = keywords.map((keyword) => new RegExp(keyword, "i"))

			// البحث في محتوى الملفات
			for (const file of allFiles) {
				try {
					// تجاهل الملفات الكبيرة جدًا
					const stats = await fs.stat(file)
					if (stats.size > 1024 * 1024) {
						// تجاهل الملفات أكبر من 1 ميجابايت
						continue
					}

					// قراءة محتوى الملف
					const content = await fs.readFile(file, "utf-8")

					// التحقق من وجود الكلمات المفتاحية في المحتوى
					let matchCount = 0
					for (const regex of keywordRegexes) {
						if (regex.test(content) || regex.test(file)) {
							matchCount++
						}
					}

					// إذا كان هناك تطابق كافٍ، أضف الملف إلى القائمة
					if (matchCount >= Math.ceil(keywordRegexes.length * 0.3)) {
						// على الأقل 30% من الكلمات المفتاحية
						relevantFiles.push(file)
					}
				} catch (error) {
					// تجاهل أخطاء قراءة الملف
					continue
				}
			}

			// ترتيب الملفات حسب الأهمية (عدد الكلمات المفتاحية المطابقة)
			return relevantFiles
		} catch (error) {
			console.error("Error finding relevant files:", error)
			return []
		}
	}

	/**
	 * إيجاد مواقع التعديل في ملف
	 * @param filePath مسار الملف
	 * @param fileAnalysis تحليل الملف
	 * @param keywords الكلمات المفتاحية
	 * @returns اقتراحات التعديل
	 */
	private async findEditLocationsInFile(
		filePath: string,
		fileAnalysis: FileAnalysis,
		keywords: string[],
	): Promise<EditSuggestion[]> {
		try {
			// قراءة محتوى الملف
			const content = await fs.readFile(filePath, "utf-8")
			const lines = content.split("\n")
			const suggestions: EditSuggestion[] = []

			// البحث عن الدوال والفئات في الملف
			const functionRegex = /function\s+(\w+)/g
			const classRegex = /class\s+(\w+)/g
			const methodRegex = /(\w+)\s*\([^)]*\)\s*{/g

			// البحث عن الدوال
			let match
			while ((match = functionRegex.exec(content)) !== null) {
				const functionName = match[1]
				const lineIndex = this.getLineNumberForPosition(content, match.index)

				// التحقق من صلة الدالة بالكلمات المفتاحية
				if (this.isRelevantToKeywords(functionName, keywords)) {
					suggestions.push({
						filePath,
						position: { line: lineIndex, character: 0 },
						suggestion: `تعديل الدالة ${functionName}`,
						confidence: 0.7,
					})
				}
			}

			// البحث عن الفئات
			while ((match = classRegex.exec(content)) !== null) {
				const className = match[1]
				const lineIndex = this.getLineNumberForPosition(content, match.index)

				// التحقق من صلة الفئة بالكلمات المفتاحية
				if (this.isRelevantToKeywords(className, keywords)) {
					suggestions.push({
						filePath,
						position: { line: lineIndex, character: 0 },
						suggestion: `تعديل الفئة ${className}`,
						confidence: 0.8,
					})
				}
			}

			// البحث عن الطرق
			while ((match = methodRegex.exec(content)) !== null) {
				const methodName = match[1]
				const lineIndex = this.getLineNumberForPosition(content, match.index)

				// التحقق من صلة الطريقة بالكلمات المفتاحية
				if (this.isRelevantToKeywords(methodName, keywords)) {
					suggestions.push({
						filePath,
						position: { line: lineIndex, character: 0 },
						suggestion: `تعديل الطريقة ${methodName}`,
						confidence: 0.6,
					})
				}
			}

			// ترتيب الاقتراحات حسب الثقة
			return suggestions.sort((a, b) => b.confidence - a.confidence)
		} catch (error) {
			console.error(`Error finding edit locations in ${filePath}:`, error)
			return []
		}
	}

	/**
	 * التحقق من صلة النص بالكلمات المفتاحية
	 * @param text النص
	 * @param keywords الكلمات المفتاحية
	 * @returns هل النص ذو صلة
	 */
	private isRelevantToKeywords(text: string, keywords: string[]): boolean {
		const lowerText = text.toLowerCase()
		return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))
	}

	/**
	 * الحصول على رقم السطر لموضع في النص
	 * @param content محتوى الملف
	 * @param position الموضع
	 * @returns رقم السطر
	 */
	private getLineNumberForPosition(content: string, position: number): number {
		const textBeforePosition = content.substring(0, position)
		return textBeforePosition.split("\n").length - 1
	}

	/**
	 * إيجاد التكرار في الكود
	 * @returns معلومات التكرار
	 */
	private async findCodeDuplications(): Promise<CodeDuplication[]> {
		// البحث عن التكرار في الكود
		// سيتم تنفيذ هذا لاحقًا
		return []
	}

	/**
	 * إيجاد الدوال الطويلة
	 * @returns معلومات الدوال الطويلة
	 */
	private async findLongMethods(): Promise<LongMethod[]> {
		// البحث عن الدوال الطويلة
		// سيتم تنفيذ هذا لاحقًا
		return []
	}
}

/**
 * فئة لإدارة رسم بياني للتبعيات
 */
export class DependencyGraph {
	private nodes: Map<string, FileNode> = new Map()
	private edges: Map<string, string[]> = new Map()

	/**
	 * إضافة عقدة للرسم البياني
	 * @param filePath مسار الملف
	 * @param metadata بيانات وصفية
	 */
	addNode(filePath: string, metadata: any): void {
		this.nodes.set(filePath, { path: filePath, metadata })
	}

	/**
	 * إضافة حافة للرسم البياني
	 * @param from مسار الملف المصدر
	 * @param to مسار الملف الهدف
	 */
	addEdge(from: string, to: string): void {
		if (!this.edges.has(from)) {
			this.edges.set(from, [to])
		} else {
			this.edges.get(from)!.push(to)
		}
	}

	/**
	 * الحصول على تبعيات ملف
	 * @param filePath مسار الملف
	 * @returns مسارات الملفات التي يعتمد عليها
	 */
	async getFileDependencies(filePath: string): Promise<string[]> {
		return this.edges.get(filePath) || []
	}

	/**
	 * تحليل تأثير التغييرات
	 * @param filePath مسار الملف
	 * @returns الملفات التي قد تتأثر بالتغييرات
	 */
	getImpactAnalysis(filePath: string): string[] {
		// تحليل تأثير التغييرات في ملف معين على بقية المشروع
		// سيتم تنفيذ هذا لاحقًا
		return []
	}
}

/**
 * فئة لاكتشاف أنماط الكود
 */
export class CodePatternDetector {
	/**
	 * اكتشاف أنماط الكود في المشروع
	 * @param rootPath مسار المشروع
	 * @returns الأنماط المكتشفة
	 */
	async detectPatterns(rootPath: string): Promise<DetectedPattern[]> {
		// اكتشاف أنماط الكود في المشروع
		// سيتم تنفيذ هذا لاحقًا
		return []
	}

	/**
	 * اكتشاف أنماط الكود في ملف
	 * @param filePath مسار الملف
	 * @returns الأنماط المكتشفة
	 */
	async detectPatternsInFile(filePath: string): Promise<DetectedPattern[]> {
		// اكتشاف أنماط الكود في ملف واحد
		// سيتم تنفيذ هذا لاحقًا
		return []
	}
}

/**
 * فئة للتحليل الدلالي
 */
export class SemanticAnalyzer {
	/**
	 * تحليل دلالي للمشروع
	 * @param rootPath مسار المشروع
	 * @returns نتائج التحليل
	 */
	async analyzeProject(rootPath: string): Promise<SemanticAnalysis> {
		// تحليل دلالي للمشروع
		// سيتم تنفيذ هذا لاحقًا
		return { entities: [], relationships: [] }
	}

	/**
	 * تحليل دلالي لملف
	 * @param filePath مسار الملف
	 * @returns نتائج التحليل
	 */
	async analyzeFile(filePath: string): Promise<SemanticAnalysis> {
		// تحليل دلالي لملف واحد
		// سيتم تنفيذ هذا لاحقًا
		return { entities: [], relationships: [] }
	}
}

// أنواع البيانات
export interface FileNode {
	path: string
	metadata: any
}

export interface DetectedPattern {
	name: string
	locations: string[]
	confidence: number
}

export interface SemanticAnalysis {
	entities: any[]
	relationships: any[]
}

export interface ProjectAnalysis {
	dependencyGraph: DependencyGraph
	detectedPatterns: DetectedPattern[]
	semanticAnalysis: SemanticAnalysis
}

export interface FileAnalysis {
	filePath: string
	dependencies: string[]
	patterns: DetectedPattern[]
	semantics: SemanticAnalysis
}

export interface EditSuggestion {
	filePath: string
	position: { line: number; character: number }
	suggestion: string
	confidence: number
}

export interface RefactoringSuggestion {
	type: string
	files: string[]
	description: string
	benefit: string
}

export interface CodeDuplication {
	code: string
	files: string[]
}

export interface LongMethod {
	name: string
	file: string
	length: number
}
