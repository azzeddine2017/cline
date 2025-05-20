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
	private enabled: boolean = true

	/**
	 * تعيين حالة تفعيل محلل الكود
	 * @param enabled حالة التفعيل
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled
		console.log(`Code analyzer ${enabled ? 'enabled' : 'disabled'}`)
	}

	/**
	 * تحليل المشروع بأكمله
	 * @param rootPath مسار المشروع
	 * @returns نتائج التحليل
	 */
	async analyzeProject(rootPath: string): Promise<ProjectAnalysis> {
		// التحقق من تفعيل محلل الكود
		if (!this.enabled) {
			console.log("Code analyzer is disabled. Returning empty analysis.")
			return {
				dependencyGraph: new DependencyGraph(),
				detectedPatterns: [],
				semanticAnalysis: { entities: [], relationships: [] },
			}
		}

		try {
			console.log(`Analyzing project at ${rootPath}...`)

			// تحليل بنية المشروع وإنشاء رسم بياني للتبعيات
			await this.buildDependencyGraph(rootPath)

			// اكتشاف أنماط الكود المستخدمة في المشروع
			const patterns = await this.codePatterns.detectPatterns(rootPath)

			// تحليل دلالي للكود
			const semantics = await this.semanticAnalyzer.analyzeProject(rootPath)

			console.log("Project analysis completed successfully")

			return {
				dependencyGraph: this.projectGraph,
				detectedPatterns: patterns,
				semanticAnalysis: semantics,
			}
		} catch (error) {
			console.error("Error analyzing project:", error)
			return {
				dependencyGraph: new DependencyGraph(),
				detectedPatterns: [],
				semanticAnalysis: { entities: [], relationships: [] },
				error: String(error),
			}
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
		try {
			const duplications: CodeDuplication[] = []
			const files = await this.getProjectFiles(vscode.workspace.rootPath || "")

			// خريطة لتخزين أجزاء الكود وملفاتها
			const codeMap: Map<string, string[]> = new Map()

			// الحد الأدنى لطول الكود المكرر (بالأسطر)
			const MIN_DUPLICATION_LINES = 5

			// فحص كل ملف
			for (const file of files) {
				try {
					// تجاهل الملفات الكبيرة جدًا
					const stats = await fs.stat(file)
					if (stats.size > 1024 * 1024) {
						continue
					}

					// قراءة محتوى الملف
					const content = await fs.readFile(file, "utf-8")
					const lines = content.split("\n")

					// فحص كل مجموعة من الأسطر
					for (let i = 0; i <= lines.length - MIN_DUPLICATION_LINES; i++) {
						// أخذ مجموعة من الأسطر
						const codeBlock = lines.slice(i, i + MIN_DUPLICATION_LINES).join("\n")

						// تجاهل الأسطر الفارغة أو التعليقات
						if (this.isEmptyOrComment(codeBlock)) {
							continue
						}

						// إضافة الكود إلى الخريطة
						if (codeMap.has(codeBlock)) {
							codeMap.get(codeBlock)!.push(file)
						} else {
							codeMap.set(codeBlock, [file])
						}
					}
				} catch (error) {
					// تجاهل أخطاء قراءة الملف
					continue
				}
			}

			// البحث عن التكرار
			for (const [code, files] of codeMap.entries()) {
				// إذا كان الكود موجودًا في أكثر من ملف
				if (files.length > 1) {
					// إزالة التكرار من قائمة الملفات
					const uniqueFiles = Array.from(new Set(files))

					duplications.push({
						code,
						files: uniqueFiles,
					})
				}
			}

			return duplications
		} catch (error) {
			console.error("Error finding code duplications:", error)
			return []
		}
	}

	/**
	 * التحقق مما إذا كان النص فارغًا أو تعليقًا
	 * @param text النص
	 * @returns هل النص فارغ أو تعليق
	 */
	private isEmptyOrComment(text: string): boolean {
		// تجاهل الأسطر الفارغة
		if (text.trim() === "") {
			return true
		}

		// تجاهل التعليقات
		const lines = text.split("\n")
		const nonCommentLines = lines.filter(line => {
			const trimmedLine = line.trim()
			return !(
				trimmedLine.startsWith("//") ||
				trimmedLine.startsWith("/*") ||
				trimmedLine.startsWith("*") ||
				trimmedLine.endsWith("*/")
			)
		})

		return nonCommentLines.length === 0
	}

	/**
	 * إيجاد الدوال الطويلة
	 * @returns معلومات الدوال الطويلة
	 */
	private async findLongMethods(): Promise<LongMethod[]> {
		try {
			const longMethods: LongMethod[] = []
			const files = await this.getProjectFiles(vscode.workspace.rootPath || "")

			// الحد الأقصى لطول الدالة (بالأسطر)
			const MAX_METHOD_LINES = 50

			// فحص كل ملف
			for (const file of files) {
				try {
					// تجاهل الملفات الكبيرة جدًا
					const stats = await fs.stat(file)
					if (stats.size > 1024 * 1024) {
						continue
					}

					// قراءة محتوى الملف
					const content = await fs.readFile(file, "utf-8")

					// البحث عن الدوال
					const methodRegex = /(?:function\s+(\w+)|(\w+)\s*=\s*function|(\w+)\s*\([^)]*\)\s*{)/g
					let match

					while ((match = methodRegex.exec(content)) !== null) {
						// الحصول على اسم الدالة
						const methodName = match[1] || match[2] || match[3]

						// الحصول على موضع بداية الدالة
						const startPos = match.index

						// البحث عن نهاية الدالة
						const methodBody = this.extractMethodBody(content, startPos)

						// حساب عدد الأسطر
						const lines = methodBody.split("\n")

						// إذا كانت الدالة طويلة
						if (lines.length > MAX_METHOD_LINES) {
							longMethods.push({
								name: methodName,
								file,
								length: lines.length,
							})
						}
					}
				} catch (error) {
					// تجاهل أخطاء قراءة الملف
					continue
				}
			}

			// ترتيب الدوال حسب الطول
			return longMethods.sort((a, b) => b.length - a.length)
		} catch (error) {
			console.error("Error finding long methods:", error)
			return []
		}
	}

	/**
	 * استخراج جسم الدالة
	 * @param content محتوى الملف
	 * @param startPos موضع بداية الدالة
	 * @returns جسم الدالة
	 */
	private extractMethodBody(content: string, startPos: number): string {
		// البحث عن أول فتح قوس
		let openBracePos = content.indexOf("{", startPos)
		if (openBracePos === -1) {
			return ""
		}

		// عداد الأقواس
		let braceCount = 1
		let endPos = openBracePos + 1

		// البحث عن القوس المغلق المقابل
		while (braceCount > 0 && endPos < content.length) {
			const char = content[endPos]

			if (char === "{") {
				braceCount++
			} else if (char === "}") {
				braceCount--
			}

			endPos++
		}

		// استخراج جسم الدالة
		return content.substring(openBracePos, endPos)
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
		const impactedFiles: Set<string> = new Set()

		// البحث عن الملفات التي تعتمد على الملف المحدد
		this.findDependentFiles(filePath, impactedFiles)

		// تحويل المجموعة إلى مصفوفة
		return Array.from(impactedFiles)
	}

	/**
	 * البحث عن الملفات التي تعتمد على ملف معين
	 * @param filePath مسار الملف
	 * @param impactedFiles مجموعة الملفات المتأثرة
	 */
	private findDependentFiles(filePath: string, impactedFiles: Set<string>): void {
		// البحث عن الملفات التي تعتمد على الملف المحدد
		for (const [source, targets] of this.edges.entries()) {
			// إذا كان الملف المصدر يعتمد على الملف المحدد
			if (targets.includes(filePath)) {
				// إضافة الملف المصدر إلى قائمة الملفات المتأثرة
				impactedFiles.add(source)

				// البحث عن الملفات التي تعتمد على الملف المصدر (تحليل متعدي)
				this.findDependentFiles(source, impactedFiles)
			}
		}
	}
}

/**
 * فئة لاكتشاف أنماط الكود
 */
export class CodePatternDetector {
	// تعريف أنماط الكود الشائعة
	private patterns: CodePattern[] = [
		{
			name: "singleton",
			description: "نمط Singleton - يضمن وجود نسخة واحدة فقط من الفئة",
			regex: /class\s+(\w+)[\s\S]*?private\s+static\s+instance[\s\S]*?getInstance\s*\(\)/i,
			fileTypes: ["typescript", "javascript", "java", "csharp"],
		},
		{
			name: "factory_method",
			description: "نمط Factory Method - يوفر واجهة لإنشاء كائنات في فئة أصل",
			regex: /class\s+(\w+)[\s\S]*?create(\w+)\s*\([^)]*\)/i,
			fileTypes: ["typescript", "javascript", "java", "csharp", "python"],
		},
		{
			name: "observer",
			description: "نمط Observer - يسمح بإعلام كائنات متعددة بتغييرات في كائن آخر",
			regex: /(addEventListener|on\w+|subscribe|addListener|observe)/i,
			fileTypes: ["typescript", "javascript", "java", "csharp"],
		},
		{
			name: "dependency_injection",
			description: "نمط Dependency Injection - يحقن التبعيات بدلاً من إنشائها داخل الفئة",
			regex: /constructor\s*\(\s*([^)]+)\)/i,
			fileTypes: ["typescript", "javascript"],
		},
		{
			name: "module_pattern",
			description: "نمط Module - يوفر طريقة لتنظيم الكود وإخفاء التفاصيل الداخلية",
			regex: /export\s+(const|let|var|function|class|interface|type)/i,
			fileTypes: ["typescript", "javascript"],
		},
		{
			name: "promise_chain",
			description: "سلسلة الوعود - استخدام سلاسل الوعود للتعامل مع العمليات غير المتزامنة",
			regex: /\.then\s*\(\s*[^)]+\)\s*\.then/i,
			fileTypes: ["typescript", "javascript"],
		},
		{
			name: "async_await",
			description: "نمط Async/Await - استخدام async/await للتعامل مع العمليات غير المتزامنة",
			regex: /async\s+\w+\s*\([^)]*\)\s*{[\s\S]*?await\s+/i,
			fileTypes: ["typescript", "javascript", "csharp", "python"],
		},
		{
			name: "error_handling",
			description: "نمط معالجة الأخطاء - استخدام try/catch لمعالجة الأخطاء",
			regex: /try\s*{[\s\S]*?}\s*catch\s*\(\s*\w+\s*\)\s*{/i,
			fileTypes: ["typescript", "javascript", "java", "csharp", "python"],
		},
		{
			name: "mvc",
			description: "نمط MVC - فصل المنطق والعرض والتحكم",
			regex: /(Model|View|Controller|Component|Service|Repository)/i,
			fileTypes: ["typescript", "javascript", "java", "csharp"],
		},
		{
			name: "fluent_interface",
			description: "نمط Fluent Interface - سلسلة من الطرق التي تعيد this",
			regex: /return\s+this;/i,
			fileTypes: ["typescript", "javascript", "java", "csharp"],
		},
	]

	/**
	 * اكتشاف أنماط الكود في المشروع
	 * @param rootPath مسار المشروع
	 * @returns الأنماط المكتشفة
	 */
	async detectPatterns(rootPath: string): Promise<DetectedPattern[]> {
		try {
			// الحصول على قائمة الملفات في المشروع
			const files = await this.getProjectFiles(rootPath)
			const detectedPatterns: Map<string, DetectedPattern> = new Map()

			// فحص كل ملف
			for (const file of files) {
				const filePatterns = await this.detectPatternsInFile(file)

				// دمج النتائج
				for (const pattern of filePatterns) {
					if (detectedPatterns.has(pattern.name)) {
						const existingPattern = detectedPatterns.get(pattern.name)!
						existingPattern.locations.push(...pattern.locations)
						existingPattern.confidence = Math.max(existingPattern.confidence, pattern.confidence)
					} else {
						detectedPatterns.set(pattern.name, pattern)
					}
				}
			}

			// تحويل النتائج إلى مصفوفة
			return Array.from(detectedPatterns.values())
		} catch (error) {
			console.error("Error detecting patterns in project:", error)
			return []
		}
	}

	/**
	 * اكتشاف أنماط الكود في ملف
	 * @param filePath مسار الملف
	 * @returns الأنماط المكتشفة
	 */
	async detectPatternsInFile(filePath: string): Promise<DetectedPattern[]> {
		try {
			// قراءة محتوى الملف
			const content = await fs.readFile(filePath, "utf-8")
			const fileType = this.getFileType(filePath)
			const detectedPatterns: DetectedPattern[] = []

			// فحص كل نمط
			for (const pattern of this.patterns) {
				// تجاهل الأنماط غير المناسبة لنوع الملف
				if (!pattern.fileTypes.includes(fileType)) {
					continue
				}

				// البحث عن النمط في محتوى الملف
				const matches = content.match(new RegExp(pattern.regex, "g"))
				if (matches && matches.length > 0) {
					// حساب درجة الثقة بناءً على عدد التطابقات
					const confidence = Math.min(0.5 + matches.length * 0.1, 1.0)

					detectedPatterns.push({
						name: pattern.name,
						locations: [filePath],
						confidence,
					})
				}
			}

			// البحث عن أنماط خاصة بنوع الملف
			const fileSpecificPatterns = await this.detectFileSpecificPatterns(filePath, content, fileType)
			detectedPatterns.push(...fileSpecificPatterns)

			return detectedPatterns
		} catch (error) {
			console.error(`Error detecting patterns in file ${filePath}:`, error)
			return []
		}
	}

	/**
	 * اكتشاف أنماط خاصة بنوع الملف
	 * @param filePath مسار الملف
	 * @param content محتوى الملف
	 * @param fileType نوع الملف
	 * @returns الأنماط المكتشفة
	 */
	private async detectFileSpecificPatterns(
		filePath: string,
		content: string,
		fileType: string
	): Promise<DetectedPattern[]> {
		const patterns: DetectedPattern[] = []

		// أنماط خاصة بـ React
		if (fileType === "react" || fileType === "react-typescript") {
			// نمط React Hooks
			if (content.match(/use[A-Z]\w+\s*\(/)) {
				patterns.push({
					name: "react_hooks",
					locations: [filePath],
					confidence: 0.9,
				})
			}

			// نمط React Functional Component
			if (content.match(/function\s+\w+\s*\(\s*\{[^}]*\}\s*\)/)) {
				patterns.push({
					name: "react_functional_component",
					locations: [filePath],
					confidence: 0.8,
				})
			}

			// نمط React Class Component
			if (content.match(/class\s+\w+\s+extends\s+(React\.)?Component/)) {
				patterns.push({
					name: "react_class_component",
					locations: [filePath],
					confidence: 0.8,
				})
			}
		}

		// أنماط خاصة بـ TypeScript
		if (fileType === "typescript" || fileType === "react-typescript") {
			// نمط TypeScript Interface
			if (content.match(/interface\s+\w+/)) {
				patterns.push({
					name: "typescript_interface",
					locations: [filePath],
					confidence: 0.9,
				})
			}

			// نمط TypeScript Type
			if (content.match(/type\s+\w+\s*=/)) {
				patterns.push({
					name: "typescript_type",
					locations: [filePath],
					confidence: 0.9,
				})
			}

			// نمط TypeScript Generics
			if (content.match(/<[A-Z]\w*>/)) {
				patterns.push({
					name: "typescript_generics",
					locations: [filePath],
					confidence: 0.7,
				})
			}
		}

		// أنماط خاصة بـ Node.js
		if (fileType === "javascript" || fileType === "typescript") {
			// نمط Node.js Module Exports
			if (content.match(/module\.exports\s*=/)) {
				patterns.push({
					name: "nodejs_module_exports",
					locations: [filePath],
					confidence: 0.9,
				})
			}

			// نمط Node.js Require
			if (content.match(/require\s*\(\s*['"][^'"]+['"]\s*\)/)) {
				patterns.push({
					name: "nodejs_require",
					locations: [filePath],
					confidence: 0.9,
				})
			}
		}

		return patterns
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
}

/**
 * فئة للتحليل الدلالي
 */
export class SemanticAnalyzer {
	// تخزين الكيانات والعلاقات المكتشفة
	private entities: Map<string, Entity> = new Map()
	private relationships: Map<string, Relationship> = new Map()

	/**
	 * تحليل دلالي للمشروع
	 * @param rootPath مسار المشروع
	 * @returns نتائج التحليل
	 */
	async analyzeProject(rootPath: string): Promise<SemanticAnalysis> {
		try {
			// إعادة تعيين الكيانات والعلاقات
			this.entities.clear()
			this.relationships.clear()

			// الحصول على قائمة الملفات في المشروع
			const files = await this.getProjectFiles(rootPath)

			// تحليل كل ملف
			for (const file of files) {
				await this.analyzeFile(file)
			}

			// بناء العلاقات بين الكيانات
			await this.buildRelationships()

			// تحويل النتائج إلى مصفوفات
			return {
				entities: Array.from(this.entities.values()),
				relationships: Array.from(this.relationships.values()),
			}
		} catch (error) {
			console.error("Error analyzing project semantically:", error)
			return { entities: [], relationships: [] }
		}
	}

	/**
	 * تحليل دلالي لملف
	 * @param filePath مسار الملف
	 * @returns نتائج التحليل
	 */
	async analyzeFile(filePath: string): Promise<SemanticAnalysis> {
		try {
			// قراءة محتوى الملف
			const content = await fs.readFile(filePath, "utf-8")
			const fileType = this.getFileType(filePath)

			// تحليل الملف حسب نوعه
			if (fileType === "typescript" || fileType === "react-typescript") {
				await this.analyzeTypeScriptFile(filePath, content)
			} else if (fileType === "javascript" || fileType === "react") {
				await this.analyzeJavaScriptFile(filePath, content)
			}

			// إرجاع الكيانات والعلاقات المكتشفة في هذا الملف
			const fileEntities = Array.from(this.entities.values()).filter((entity) => entity.location === filePath)
			const fileRelationships = Array.from(this.relationships.values()).filter(
				(rel) =>
					this.entities.get(rel.source)?.location === filePath || this.entities.get(rel.target)?.location === filePath
			)

			return {
				entities: fileEntities,
				relationships: fileRelationships,
			}
		} catch (error) {
			console.error(`Error analyzing file semantically ${filePath}:`, error)
			return { entities: [], relationships: [] }
		}
	}

	/**
	 * تحليل ملف TypeScript
	 * @param filePath مسار الملف
	 * @param content محتوى الملف
	 */
	private async analyzeTypeScriptFile(filePath: string, content: string): Promise<void> {
		// البحث عن الفئات
		const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{([^}]*)}/g
		let match
		while ((match = classRegex.exec(content)) !== null) {
			const className = match[1]
			const parentClass = match[2]
			const interfaces = match[3] ? match[3].split(",").map((i) => i.trim()) : []
			const classBody = match[4]

			// استخراج الخصائص والطرق
			const properties = this.extractProperties(classBody)
			const methods = this.extractMethods(classBody)

			// إضافة الفئة ككيان
			const entity: Entity = {
				name: className,
				type: "class",
				location: filePath,
				properties,
				methods,
			}
			this.entities.set(className, entity)

			// إضافة علاقة الوراثة إذا وجدت
			if (parentClass) {
				const relationshipId = `${className}_extends_${parentClass}`
				this.relationships.set(relationshipId, {
					source: className,
					target: parentClass,
					type: "extends",
					description: `${className} extends ${parentClass}`,
				})
			}

			// إضافة علاقات التنفيذ إذا وجدت
			for (const interfaceName of interfaces) {
				const relationshipId = `${className}_implements_${interfaceName}`
				this.relationships.set(relationshipId, {
					source: className,
					target: interfaceName,
					type: "implements",
					description: `${className} implements ${interfaceName}`,
				})
			}
		}

		// البحث عن الواجهات
		const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*{([^}]*)}/g
		while ((match = interfaceRegex.exec(content)) !== null) {
			const interfaceName = match[1]
			const parentInterfaces = match[2] ? match[2].split(",").map((i) => i.trim()) : []
			const interfaceBody = match[3]

			// استخراج الخصائص والطرق
			const properties = this.extractProperties(interfaceBody)
			const methods = this.extractMethods(interfaceBody)

			// إضافة الواجهة كيان
			const entity: Entity = {
				name: interfaceName,
				type: "interface",
				location: filePath,
				properties,
				methods,
			}
			this.entities.set(interfaceName, entity)

			// إضافة علاقات الوراثة إذا وجدت
			for (const parentInterface of parentInterfaces) {
				const relationshipId = `${interfaceName}_extends_${parentInterface}`
				this.relationships.set(relationshipId, {
					source: interfaceName,
					target: parentInterface,
					type: "extends",
					description: `${interfaceName} extends ${parentInterface}`,
				})
			}
		}

		// البحث عن الأنواع
		const typeRegex = /type\s+(\w+)\s*=\s*([^;]+)/g
		while ((match = typeRegex.exec(content)) !== null) {
			const typeName = match[1]
			const typeDefinition = match[2]

			// إضافة النوع ككيان
			const entity: Entity = {
				name: typeName,
				type: "type",
				location: filePath,
			}
			this.entities.set(typeName, entity)
		}

		// البحث عن الدوال
		const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)/g
		while ((match = functionRegex.exec(content)) !== null) {
			const functionName = match[1]
			const parameters = match[2]

			// إضافة الدالة ككيان
			const entity: Entity = {
				name: functionName,
				type: "function",
				location: filePath,
			}
			this.entities.set(functionName, entity)
		}
	}

	/**
	 * تحليل ملف JavaScript
	 * @param filePath مسار الملف
	 * @param content محتوى الملف
	 */
	private async analyzeJavaScriptFile(filePath: string, content: string): Promise<void> {
		// البحث عن الفئات
		const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{([^}]*)}/g
		let match
		while ((match = classRegex.exec(content)) !== null) {
			const className = match[1]
			const parentClass = match[2]
			const classBody = match[3]

			// استخراج الطرق
			const methods = this.extractMethods(classBody)

			// إضافة الفئة ككيان
			const entity: Entity = {
				name: className,
				type: "class",
				location: filePath,
				methods,
			}
			this.entities.set(className, entity)

			// إضافة علاقة الوراثة إذا وجدت
			if (parentClass) {
				const relationshipId = `${className}_extends_${parentClass}`
				this.relationships.set(relationshipId, {
					source: className,
					target: parentClass,
					type: "extends",
					description: `${className} extends ${parentClass}`,
				})
			}
		}

		// البحث عن الدوال
		const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)/g
		while ((match = functionRegex.exec(content)) !== null) {
			const functionName = match[1]
			const parameters = match[2]

			// إضافة الدالة ككيان
			const entity: Entity = {
				name: functionName,
				type: "function",
				location: filePath,
			}
			this.entities.set(functionName, entity)
		}

		// البحث عن الكائنات
		const objectRegex = /const\s+(\w+)\s*=\s*{([^}]*)}/g
		while ((match = objectRegex.exec(content)) !== null) {
			const objectName = match[1]
			const objectBody = match[2]

			// إضافة الكائن ككيان
			const entity: Entity = {
				name: objectName,
				type: "object",
				location: filePath,
			}
			this.entities.set(objectName, entity)
		}
	}

	/**
	 * استخراج الخصائص من نص
	 * @param text النص
	 * @returns قائمة الخصائص
	 */
	private extractProperties(text: string): string[] {
		const properties: string[] = []
		const propertyRegex = /(private|public|protected)?\s*(\w+)\s*:\s*([^;]+);/g
		let match

		while ((match = propertyRegex.exec(text)) !== null) {
			const propertyName = match[2]
			properties.push(propertyName)
		}

		return properties
	}

	/**
	 * استخراج الطرق من نص
	 * @param text النص
	 * @returns قائمة الطرق
	 */
	private extractMethods(text: string): string[] {
		const methods: string[] = []
		const methodRegex = /(private|public|protected)?\s*(\w+)\s*\([^)]*\)/g
		let match

		while ((match = methodRegex.exec(text)) !== null) {
			const methodName = match[2]
			methods.push(methodName)
		}

		return methods
	}

	/**
	 * بناء العلاقات بين الكيانات
	 */
	private async buildRelationships(): Promise<void> {
		// البحث عن علاقات الاستخدام بين الكيانات
		for (const [sourceName, sourceEntity] of this.entities.entries()) {
			for (const [targetName, targetEntity] of this.entities.entries()) {
				// تجاهل العلاقة مع النفس
				if (sourceName === targetName) {
					continue
				}

				// التحقق من استخدام الكيان المصدر للكيان الهدف
				if (sourceEntity.type === "class" && targetEntity.type === "class") {
					// البحث عن استخدام الفئة الهدف في الفئة المصدر
					const sourceContent = await fs.readFile(sourceEntity.location, "utf-8")
					if (sourceContent.includes(targetName)) {
						const relationshipId = `${sourceName}_uses_${targetName}`
						this.relationships.set(relationshipId, {
							source: sourceName,
							target: targetName,
							type: "uses",
							description: `${sourceName} uses ${targetName}`,
						})
					}
				}
			}
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
			const uris = await vscode.workspace.findFiles("**/*.{ts,js,tsx,jsx}", `**/{${ignorePatterns.join(",")}}/**`)

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
		}

		return fileTypes[extension] || "unknown"
	}
}

// أنواع البيانات
export interface FileNode {
	path: string
	metadata: any
}

export interface CodePattern {
	name: string
	description: string
	regex: RegExp
	fileTypes: string[]
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
	error?: string
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

export interface Entity {
	name: string
	type: string
	location: string
	properties?: string[]
	methods?: string[]
}

export interface Relationship {
	source: string
	target: string
	type: string
	description: string
}
