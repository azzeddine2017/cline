import { SmartMemorySystem } from "../memory/SmartMemorySystem"
import { AdvancedCodeAnalyzer } from "../analysis/CodeAnalyzer"
import { SelfLearningSystem } from "../learning/SelfLearningSystem"
import { ParallelTaskExecutor } from "../task/ParallelTaskExecutor"
import { taskManager } from "../task/index.exports"

/**
 * نظام Cline المتقدم - يجمع بين جميع الأنظمة المتقدمة لتحسين أداء Cline
 */
export class AdvancedSystem {
	private memorySystem: SmartMemorySystem
	private codeAnalyzer: AdvancedCodeAnalyzer
	private learningSystem: SelfLearningSystem
	private parallelExecutor: ParallelTaskExecutor

	constructor() {
		this.memorySystem = new SmartMemorySystem(taskManager)
		this.codeAnalyzer = new AdvancedCodeAnalyzer()
		this.learningSystem = new SelfLearningSystem()
		this.parallelExecutor = new ParallelTaskExecutor(taskManager)
	}

	/**
	 * الحصول على نظام الذاكرة الذكي
	 */
	getMemorySystem(): SmartMemorySystem {
		return this.memorySystem
	}

	/**
	 * الحصول على محلل الكود المتقدم
	 */
	getCodeAnalyzer(): AdvancedCodeAnalyzer {
		return this.codeAnalyzer
	}

	/**
	 * الحصول على نظام التعلم الذاتي
	 */
	getLearningSystem(): SelfLearningSystem {
		return this.learningSystem
	}

	/**
	 * الحصول على منفذ المهام المتوازي
	 */
	getParallelExecutor(): ParallelTaskExecutor {
		return this.parallelExecutor
	}

	/**
	 * تهيئة جميع الأنظمة المتقدمة
	 */
	async initialize(): Promise<void> {
		try {
			console.log("Initializing advanced systems...")

			// تحميل الذاكرة من الملفات
			await this.memorySystem.loadMemory()
			console.log("Memory system initialized")

			// تهيئة محلل الكود
			// تحليل المشروع الحالي إذا كان متاحًا
			try {
				const vscode = require("vscode")
				if (vscode.workspace.rootPath) {
					console.log("Analyzing current project...")
					await this.codeAnalyzer.analyzeProject(vscode.workspace.rootPath)
					console.log("Project analysis completed")
				}
			} catch (error) {
				console.warn("Could not analyze project:", error)
			}

			console.log("Advanced systems initialized successfully")
		} catch (error) {
			console.error("Error initializing advanced systems:", error)
		}
	}

	/**
	 * حفظ حالة جميع الأنظمة المتقدمة
	 */
	async saveState(): Promise<void> {
		try {
			console.log("Saving advanced systems state...")

			// حفظ الذاكرة إلى ملفات
			await this.memorySystem.persistMemory()
			console.log("Memory system state saved")

			// استخراج وحفظ التعلم
			try {
				const learningData = await this.learningSystem.exportLearning()
				console.log(`Exported learning data: ${Object.keys(learningData).length} categories`)

				// يمكن حفظ بيانات التعلم هنا إذا لزم الأمر
			} catch (error) {
				console.warn("Could not export learning data:", error)
			}

			console.log("Advanced systems state saved successfully")
		} catch (error) {
			console.error("Error saving advanced systems state:", error)
		}
	}

	/**
	 * تحليل مشروع
	 * @param projectPath مسار المشروع
	 * @returns نتائج التحليل
	 */
	async analyzeProject(projectPath: string): Promise<any> {
		try {
			console.log(`Analyzing project at ${projectPath}...`)
			const analysis = await this.codeAnalyzer.analyzeProject(projectPath)
			console.log("Project analysis completed")
			return analysis
		} catch (error) {
			console.error("Error analyzing project:", error)
			throw error
		}
	}

	/**
	 * تطبيق التعلم على مهمة
	 * @param task المهمة
	 * @param context سياق المهمة (اختياري)
	 */
	async applyLearningToTask(task: any, context?: string): Promise<void> {
		try {
			await this.learningSystem.applyLearning(task, context)
		} catch (error) {
			console.error("Error applying learning to task:", error)
		}
	}

	/**
	 * تنفيذ مهام بالتوازي
	 * @param mainTaskId معرف المهمة الرئيسية
	 * @param subtasks المهام الفرعية
	 * @param continueOnFailure هل يستمر التنفيذ في حالة فشل مهمة (اختياري)
	 * @returns نتائج التنفيذ
	 */
	async executeTasksInParallel(mainTaskId: string, subtasks: any[], continueOnFailure: boolean = false): Promise<any> {
		try {
			return await this.parallelExecutor.executeTasksInParallel(mainTaskId, subtasks, continueOnFailure)
		} catch (error) {
			console.error("Error executing tasks in parallel:", error)
			throw error
		}
	}

	/**
	 * إضافة مهمة إلى قائمة الانتظار
	 * @param task المهمة
	 * @param priority أولوية المهمة (اختياري)
	 * @returns معرف المهمة
	 */
	queueTask(task: any, priority?: number): string {
		try {
			return this.parallelExecutor.queueTask(task, priority)
		} catch (error) {
			console.error("Error queuing task:", error)
			throw error
		}
	}

	/**
	 * تعلم من رد فعل المستخدم
	 * @param taskId معرف المهمة
	 * @param feedback رد فعل المستخدم
	 */
	async learnFromFeedback(taskId: string, feedback: any): Promise<void> {
		try {
			await this.learningSystem.learnFromFeedback(taskId, feedback)
		} catch (error) {
			console.error("Error learning from feedback:", error)
		}
	}

	/**
	 * تعلم مفهوم جديد
	 * @param concept المفهوم
	 * @param context السياق
	 * @param relevance درجة الأهمية (اختياري)
	 */
	async learnConcept(concept: string, context: string, relevance: number = 0.7): Promise<void> {
		try {
			await this.memorySystem.learnConcept(concept, context, relevance)
		} catch (error) {
			console.error("Error learning concept:", error)
		}
	}

	/**
	 * تعلم تفضيل جديد للمستخدم
	 * @param category فئة التفضيل
	 * @param preference التفضيل نفسه
	 * @param context سياق التفضيل (اختياري)
	 */
	async learnUserPreference(category: string, preference: string, context?: string): Promise<void> {
		try {
			await this.memorySystem.learnUserPreference(category, preference, context)
		} catch (error) {
			console.error("Error learning user preference:", error)
		}
	}

	/**
	 * توليد رؤى من البيانات المتعلمة
	 * @returns الرؤى المتولدة
	 */
	async generateInsights(): Promise<any[]> {
		try {
			return await this.learningSystem.generateInsights()
		} catch (error) {
			console.error("Error generating insights:", error)
			return []
		}
	}
}

// إنشاء نسخة عالمية من النظام المتقدم
export const advancedSystem = new AdvancedSystem()
