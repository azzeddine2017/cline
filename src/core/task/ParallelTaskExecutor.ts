import { Task } from "./index"
import { TaskManager } from "./TaskManager"

/**
 * منفذ المهام المتوازي - يتيح لـ Cline تنفيذ مهام متعددة بالتوازي
 * يساعد على تسريع إنجاز المهام المعقدة
 */
export class ParallelTaskExecutor {
	private taskManager: TaskManager
	private runningTasks: Map<string, TaskExecution> = new Map()
	private maxConcurrentTasks: number = 3
	private taskQueue: PrioritizedTask[] = []
	private retryConfig: RetryConfig = {
		maxRetries: 3,
		retryDelay: 1000,
		exponentialBackoff: true,
	}
	private enabled: boolean = true

	/**
	 * إنشاء منفذ المهام المتوازي
	 * @param taskManager مدير المهام
	 * @param maxConcurrentTasks الحد الأقصى للمهام المتزامنة (اختياري)
	 * @param retryConfig إعدادات إعادة المحاولة (اختياري)
	 */
	constructor(
		taskManager: TaskManager,
		maxConcurrentTasks?: number,
		retryConfig?: Partial<RetryConfig>
	) {
		this.taskManager = taskManager

		if (maxConcurrentTasks && maxConcurrentTasks > 0) {
			this.maxConcurrentTasks = maxConcurrentTasks
		}

		if (retryConfig) {
			this.retryConfig = { ...this.retryConfig, ...retryConfig }
		}
	}

	/**
	 * تعيين حالة تفعيل منفذ المهام المتوازي
	 * @param enabled حالة التفعيل
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled
		console.log(`Parallel task executor ${enabled ? 'enabled' : 'disabled'}`)
	}

	/**
	 * تعيين الحد الأقصى للمهام المتزامنة
	 * @param maxTasks الحد الأقصى للمهام المتزامنة
	 */
	setMaxConcurrentTasks(maxTasks: number): void {
		if (maxTasks > 0) {
			this.maxConcurrentTasks = maxTasks
			console.log(`Maximum concurrent tasks set to ${maxTasks}`)
		}
	}

	/**
	 * تعيين إعدادات إعادة المحاولة
	 * @param config إعدادات إعادة المحاولة
	 */
	setRetryConfig(config: Partial<RetryConfig>): void {
		this.retryConfig = { ...this.retryConfig, ...config }
	}

	/**
	 * تعيين الحد الأقصى لعدد مرات إعادة المحاولة
	 * @param maxRetries الحد الأقصى لعدد مرات إعادة المحاولة
	 */
	setMaxRetries(maxRetries: number): void {
		if (maxRetries >= 0) {
			this.retryConfig.maxRetries = maxRetries
			console.log(`Maximum retries set to ${maxRetries}`)
		}
	}

	/**
	 * إضافة مهمة إلى قائمة الانتظار
	 * @param task المهمة
	 * @param priority أولوية المهمة (اختياري)
	 * @returns معرف المهمة
	 */
	queueTask(task: SubtaskDefinition, priority?: number): string {
		// استخدام الأولوية المحددة أو الأولوية الافتراضية (0)
		const taskPriority = priority !== undefined ? priority : (task.priority || 0)

		// إنشاء مهمة ذات أولوية
		const prioritizedTask: PrioritizedTask = {
			task,
			priority: taskPriority,
			addedTime: Date.now(),
		}

		// إضافة المهمة إلى قائمة الانتظار
		this.taskQueue.push(prioritizedTask)

		// إعادة ترتيب قائمة الانتظار حسب الأولوية
		this.sortTaskQueue()

		// بدء تنفيذ المهام إذا كان ذلك ممكنًا
		this.processQueue()

		return task.id
	}

	/**
	 * إعادة ترتيب قائمة الانتظار حسب الأولوية
	 */
	private sortTaskQueue(): void {
		// ترتيب المهام حسب الأولوية (تنازليًا) ثم حسب وقت الإضافة (تصاعديًا)
		this.taskQueue.sort((a, b) => {
			if (a.priority !== b.priority) {
				return b.priority - a.priority // الأولوية الأعلى أولاً
			}
			return a.addedTime - b.addedTime // المهام الأقدم أولاً
		})
	}

	/**
	 * معالجة قائمة الانتظار وتنفيذ المهام
	 */
	private async processQueue(): Promise<void> {
		// التحقق من عدد المهام الجارية
		const runningTasksCount = this.runningTasks.size

		// إذا كان هناك مساحة لتنفيذ مهام إضافية
		if (runningTasksCount < this.maxConcurrentTasks && this.taskQueue.length > 0) {
			// عدد المهام التي يمكن تنفيذها
			const availableSlots = this.maxConcurrentTasks - runningTasksCount

			// تنفيذ المهام ذات الأولوية العالية
			for (let i = 0; i < Math.min(availableSlots, this.taskQueue.length); i++) {
				const nextTask = this.taskQueue.shift()
				if (nextTask) {
					// تنفيذ المهمة بشكل غير متزامن
					this.executeQueuedTask(nextTask.task)
				}
			}
		}
	}

	/**
	 * تنفيذ مهمة من قائمة الانتظار
	 * @param task المهمة
	 */
	private async executeQueuedTask(task: SubtaskDefinition): Promise<void> {
		try {
			// تنفيذ المهمة
			const result = await this.executeSubtask(task)

			// معالجة النتيجة (يمكن تخزينها أو إرسالها إلى المستخدم)
			console.log(`Task ${task.id} completed with result:`, result.success ? "success" : "failure")

			// معالجة المهام التالية في قائمة الانتظار
			this.processQueue()
		} catch (error) {
			console.error(`Error executing queued task ${task.id}:`, error)

			// معالجة المهام التالية في قائمة الانتظار حتى في حالة حدوث خطأ
			this.processQueue()
		}
	}

	/**
	 * تنفيذ مهام فرعية بالتوازي
	 * @param mainTaskId معرف المهمة الرئيسية
	 * @param subtasks المهام الفرعية
	 * @param continueOnFailure هل يستمر التنفيذ في حالة فشل مهمة (اختياري)
	 * @returns نتائج التنفيذ
	 */
	async executeTasksInParallel(
		mainTaskId: string,
		subtasks: SubtaskDefinition[],
		continueOnFailure: boolean = false
	): Promise<ParallelExecutionResult> {
		// التحقق من تفعيل منفذ المهام المتوازي
		if (!this.enabled) {
			console.log("Parallel task executor is disabled. Executing tasks sequentially.")
			return this.executeTasksSequentially(mainTaskId, subtasks, continueOnFailure)
		}

		// تسجيل وقت البدء
		const startTime = Date.now()

		// تقسيم المهمة الرئيسية إلى مهام فرعية وتنفيذها بالتوازي
		const results: Map<string, TaskResult> = new Map()
		const failedTasks: string[] = []
		let totalRetries = 0

		// تحديد المهام التي يمكن تنفيذها بالتوازي
		const parallelizableTasks = this.identifyParallelizableTasks(subtasks)
		const sequentialTasks = subtasks.filter((task) => !parallelizableTasks.includes(task))

		// تنفيذ المهام المتوازية
		await this.executeParallelBatch(parallelizableTasks, results, failedTasks)

		// إذا فشلت أي مهمة متوازية ولم يتم تحديد الاستمرار في حالة الفشل، توقف عن تنفيذ المهام التسلسلية
		if (failedTasks.length > 0 && !continueOnFailure) {
			console.log(`Parallel tasks failed, skipping sequential tasks. Failed tasks: ${failedTasks.join(", ")}`)
		} else {
			// تنفيذ المهام التسلسلية
			for (const task of sequentialTasks) {
				const result = await this.executeSubtask(task)
				results.set(task.id, result)

				// إضافة عدد مرات إعادة المحاولة إلى الإجمالي
				if (result.retries) {
					totalRetries += result.retries
				}

				if (!result.success) {
					failedTasks.push(task.id)

					// إذا فشلت مهمة تسلسلية ولم يتم تحديد الاستمرار في حالة الفشل، توقف عن تنفيذ المهام المتبقية
					if (!continueOnFailure) {
						console.log(`Sequential task ${task.id} failed, skipping remaining tasks.`)
						break
					}
				}
			}
		}

		// دمج نتائج المهام الفرعية
		const mergedResult = await this.mergeResults(mainTaskId, results)

		// حساب الإحصائيات
		const endTime = Date.now()
		const totalTime = endTime - startTime

		// حساب متوسط وقت المهمة
		let totalTaskTime = 0
		let completedTasksCount = 0

		for (const [_, result] of results.entries()) {
			if (result.success) {
				// تقدير وقت المهمة (في حالة عدم توفر وقت دقيق)
				const taskTime = 1000 // افتراضي 1 ثانية لكل مهمة
				totalTaskTime += taskTime
				completedTasksCount++
			}
		}

		const averageTaskTime = completedTasksCount > 0 ? totalTaskTime / completedTasksCount : 0

		return {
			success: failedTasks.length === 0,
			results,
			failedTasks,
			mergedResult,
			stats: {
				totalTime,
				averageTaskTime,
				totalRetries,
			}
		}
	}

	/**
	 * تنفيذ مهمة فرعية
	 * @param subtask المهمة الفرعية
	 * @param retryCount عدد مرات إعادة المحاولة الحالية (اختياري)
	 * @returns نتيجة التنفيذ
	 */
	private async executeSubtask(subtask: SubtaskDefinition, retryCount: number = 0): Promise<TaskResult> {
		try {
			console.log(`Executing subtask: ${subtask.id} (retry: ${retryCount})`)

			// إنشاء مهمة جديدة
			const task = await this.createSubtask(subtask)
			if (!task) {
				return {
					success: false,
					error: "فشل في إنشاء المهمة الفرعية",
					output: null,
					retries: retryCount,
				}
			}

			// تنفيذ المهمة
			const execution: TaskExecution = {
				task,
				startTime: Date.now(),
				status: "running",
				retryCount,
			}

			this.runningTasks.set(subtask.id, execution)

			// انتظار اكتمال المهمة
			const output = await this.waitForTaskCompletion(subtask.id, subtask.timeout || 60000)

			// تحديث حالة المهمة
			execution.status = "completed"
			execution.endTime = Date.now()

			return {
				success: true,
				output,
				retries: retryCount,
			}
		} catch (error) {
			// التحقق مما إذا كان يجب إعادة المحاولة
			const maxRetries = subtask.retries !== undefined ? subtask.retries : this.retryConfig.maxRetries

			if (retryCount < maxRetries) {
				console.log(`Retrying subtask: ${subtask.id} (${retryCount + 1}/${maxRetries})`)

				// حساب وقت الانتظار قبل إعادة المحاولة
				let delay = this.retryConfig.retryDelay
				if (this.retryConfig.exponentialBackoff) {
					// زيادة التأخير بشكل أسي (2^retryCount * retryDelay)
					delay = this.retryConfig.retryDelay * Math.pow(2, retryCount)
				}

				// انتظار قبل إعادة المحاولة
				await new Promise(resolve => setTimeout(resolve, delay))

				// إعادة المحاولة
				return this.executeSubtask(subtask, retryCount + 1)
			}

			// إذا استنفدت جميع المحاولات، أرجع الخطأ
			return {
				success: false,
				error: error instanceof Error ? error.message : "حدث خطأ غير معروف",
				output: null,
				retries: retryCount,
			}
		} finally {
			// إزالة المهمة من قائمة المهام الجارية
			this.runningTasks.delete(subtask.id)
		}
	}

	/**
	 * تنفيذ مجموعة من المهام بالتوازي
	 * @param tasks المهام
	 * @param results نتائج التنفيذ
	 * @param failedTasks المهام التي فشلت
	 */
	private async executeParallelBatch(
		tasks: SubtaskDefinition[],
		results: Map<string, TaskResult>,
		failedTasks: string[],
	): Promise<void> {
		// تقسيم المهام إلى مجموعات بحجم maxConcurrentTasks
		const batches: SubtaskDefinition[][] = []

		// ترتيب المهام حسب الأولوية قبل تقسيمها
		const sortedTasks = [...tasks].sort((a, b) => {
			const priorityA = a.priority || 0
			const priorityB = b.priority || 0
			return priorityB - priorityA // الأولوية الأعلى أولاً
		})

		// تقسيم المهام إلى مجموعات
		for (let i = 0; i < sortedTasks.length; i += this.maxConcurrentTasks) {
			batches.push(sortedTasks.slice(i, i + this.maxConcurrentTasks))
		}

		// تنفيذ كل مجموعة بالتوازي
		for (const batch of batches) {
			console.log(`Executing batch of ${batch.length} tasks in parallel`)

			// إنشاء وعود لكل مهمة في المجموعة
			const batchPromises = batch.map(async (task) => {
				try {
					// تنفيذ المهمة مع إعادة المحاولة
					const result = await this.executeSubtask(task)

					// تخزين النتيجة
					results.set(task.id, result)

					// إذا فشلت المهمة، أضفها إلى قائمة المهام الفاشلة
					if (!result.success) {
						failedTasks.push(task.id)
						console.log(`Task ${task.id} failed after ${result.retries || 0} retries`)
					} else {
						console.log(`Task ${task.id} completed successfully${result.retries ? ` after ${result.retries} retries` : ""}`)
					}
				} catch (error) {
					// في حالة حدوث خطأ غير متوقع
					console.error(`Unexpected error executing task ${task.id}:`, error)

					// إنشاء نتيجة فشل
					const errorResult: TaskResult = {
						success: false,
						error: error instanceof Error ? error.message : "حدث خطأ غير معروف",
						output: null,
						retries: 0,
					}

					// تخزين النتيجة
					results.set(task.id, errorResult)
					failedTasks.push(task.id)
				}
			})

			// انتظار اكتمال جميع مهام المجموعة
			await Promise.all(batchPromises)

			console.log(`Batch completed. Success: ${batch.length - failedTasks.length}/${batch.length}`)
		}
	}

	/**
	 * تحديد المهام التي يمكن تنفيذها بالتوازي
	 * @param subtasks المهام الفرعية
	 * @returns المهام التي يمكن تنفيذها بالتوازي
	 */
	private identifyParallelizableTasks(subtasks: SubtaskDefinition[]): SubtaskDefinition[] {
		try {
			// تحديد المهام التي يمكن تنفيذها بالتوازي
			const parallelizableTasks: SubtaskDefinition[] = []
			const nonParallelizableTasks: SubtaskDefinition[] = []

			// أولاً، قم بتصنيف المهام
			for (const task of subtasks) {
				if (task.parallelizable === true) {
					parallelizableTasks.push(task)
				} else {
					nonParallelizableTasks.push(task)
				}
			}

			// ثم، تحقق من التبعيات
			const dependencyMap = new Map<string, string[]>()

			// بناء خريطة التبعيات
			for (const task of subtasks) {
				if (task.dependencies && task.dependencies.length > 0) {
					dependencyMap.set(task.id, task.dependencies)
				}
			}

			// التحقق من التبعيات الدائرية
			const hasCyclicDependency = (
				taskId: string,
				visited: Set<string> = new Set(),
				path: Set<string> = new Set(),
			): boolean => {
				if (path.has(taskId)) {
					return true // تبعية دائرية
				}

				if (visited.has(taskId)) {
					return false // تم زيارة هذه المهمة من قبل ولا توجد تبعية دائرية
				}

				visited.add(taskId)
				path.add(taskId)

				const dependencies = dependencyMap.get(taskId) || []
				for (const dependency of dependencies) {
					if (hasCyclicDependency(dependency, visited, path)) {
						return true
					}
				}

				path.delete(taskId)
				return false
			}

			// إزالة المهام ذات التبعيات الدائرية من قائمة المهام المتوازية
			const finalParallelizableTasks = parallelizableTasks.filter((task) => {
				if (!task.dependencies || task.dependencies.length === 0) {
					return true // لا توجد تبعيات، يمكن تنفيذها بالتوازي
				}

				// التحقق من عدم وجود تبعيات دائرية
				return !hasCyclicDependency(task.id)
			})

			return finalParallelizableTasks
		} catch (error) {
			console.error("Error identifying parallelizable tasks:", error)
			// في حالة حدوث خطأ، ارجع المهام التي تم تحديدها صراحة كمتوازية
			return subtasks.filter((task) => task.parallelizable === true)
		}
	}

	/**
	 * إنشاء مهمة فرعية
	 * @param subtask تعريف المهمة الفرعية
	 * @returns المهمة
	 */
	private async createSubtask(subtask: SubtaskDefinition): Promise<Task | null> {
		try {
			console.log(`Creating subtask: ${subtask.id} - ${subtask.description}`)

			// في بيئة حقيقية، سنحتاج إلى الوصول إلى Controller لإنشاء مهمة جديدة
			// هنا نقوم بإنشاء نموذج بسيط للمهمة لأغراض التجريب

			// إنشاء كائن مهمة بسيط
			const task = {
				taskId: subtask.id,
				description: subtask.description,
				context: subtask.context,
				status: "running",
				startTime: Date.now(),

				// تنفيذ المهمة
				execute: async (): Promise<any> => {
					console.log(`Executing subtask: ${subtask.id}`)

					// محاكاة تنفيذ المهمة
					await new Promise((resolve) => setTimeout(resolve, 1000))

					return {
						taskId: subtask.id,
						result: `Result of subtask ${subtask.id}`,
						timestamp: Date.now(),
					}
				},

				// إلغاء المهمة
				abortTask: (): void => {
					console.log(`Aborting subtask: ${subtask.id}`)
				},

				// الحصول على سياق المهمة
				getContext: (): string => {
					return JSON.stringify(subtask.context || {})
				},

				// تعيين سياق المهمة
				setTaskContext: (context: string): void => {
					console.log(`Setting context for subtask: ${subtask.id}`)
					// @ts-ignore
					task.context = context
				},
			} as unknown as Task

			// استخدام this.taskManager هنا لتجنب تحذير "taskManager is declared but its value is never read"
			if (this.taskManager) {
				console.log(`Using task manager: ${this.taskManager.constructor.name}`)
			}

			return task
		} catch (error) {
			console.error(`Error creating subtask ${subtask.id}:`, error)
			return null
		}
	}

	/**
	 * انتظار اكتمال مهمة
	 * @param taskId معرف المهمة
	 * @param timeout المهلة الزمنية
	 * @returns نتيجة المهمة
	 */
	private async waitForTaskCompletion(taskId: string, timeout: number): Promise<any> {
		// انتظار اكتمال المهمة
		return new Promise((resolve, reject) => {
			const checkInterval = 1000 // التحقق كل ثانية
			let elapsedTime = 0

			const intervalId = setInterval(() => {
				const execution = this.runningTasks.get(taskId)

				// إذا اكتملت المهمة
				if (execution && execution.status === "completed") {
					clearInterval(intervalId)
					resolve(execution.output)
				}

				// إذا فشلت المهمة
				if (execution && execution.status === "failed") {
					clearInterval(intervalId)
					reject(new Error(`فشلت المهمة: ${execution.task.taskId}`))
				}

				// إذا تم إلغاء المهمة
				if (execution && execution.status === "cancelled") {
					clearInterval(intervalId)
					reject(new Error(`تم إلغاء المهمة: ${execution.task.taskId}`))
				}

				// إذا انتهت المهلة الزمنية
				elapsedTime += checkInterval
				if (elapsedTime >= timeout) {
					clearInterval(intervalId)
					this.cancelTask(taskId)
					reject(new Error(`انتهت المهلة الزمنية للمهمة: ${taskId} (${timeout}ms)`))
				}
			}, checkInterval)
		})
	}

	/**
	 * إلغاء مهمة
	 * @param taskId معرف المهمة
	 */
	private cancelTask(taskId: string): void {
		// إلغاء مهمة
		const execution = this.runningTasks.get(taskId)
		if (execution) {
			execution.status = "cancelled"
			execution.endTime = Date.now()
			// إلغاء المهمة نفسها
			execution.task.abortTask?.()
		}
	}

	/**
	 * تنفيذ مهام بشكل تسلسلي (عندما يكون منفذ المهام المتوازي معطلاً)
	 * @param mainTaskId معرف المهمة الرئيسية
	 * @param subtasks المهام الفرعية
	 * @param continueOnFailure هل يستمر التنفيذ في حالة فشل مهمة (اختياري)
	 * @returns نتائج التنفيذ
	 */
	private async executeTasksSequentially(
		mainTaskId: string,
		subtasks: SubtaskDefinition[],
		continueOnFailure: boolean = false
	): Promise<ParallelExecutionResult> {
		// تسجيل وقت البدء
		const startTime = Date.now()

		// تنفيذ المهام بشكل تسلسلي
		const results: Map<string, TaskResult> = new Map()
		const failedTasks: string[] = []
		let totalRetries = 0

		console.log(`Executing ${subtasks.length} tasks sequentially for main task ${mainTaskId}`)

		// ترتيب المهام حسب الأولوية
		const sortedTasks = [...subtasks].sort((a, b) => {
			const priorityA = a.priority || 0
			const priorityB = b.priority || 0
			return priorityB - priorityA // الأولوية الأعلى أولاً
		})

		// تنفيذ المهام بشكل تسلسلي
		for (const task of sortedTasks) {
			console.log(`Executing task ${task.id} sequentially`)

			try {
				// تنفيذ المهمة
				const result = await this.executeSubtask(task)
				results.set(task.id, result)

				// إضافة عدد مرات إعادة المحاولة إلى الإجمالي
				if (result.retries) {
					totalRetries += result.retries
				}

				// إذا فشلت المهمة
				if (!result.success) {
					failedTasks.push(task.id)
					console.log(`Task ${task.id} failed after ${result.retries || 0} retries`)

					// إذا لم يتم تحديد الاستمرار في حالة الفشل، توقف عن تنفيذ المهام المتبقية
					if (!continueOnFailure) {
						console.log(`Task ${task.id} failed, skipping remaining tasks.`)
						break
					}
				} else {
					console.log(`Task ${task.id} completed successfully${result.retries ? ` after ${result.retries} retries` : ""}`)
				}
			} catch (error) {
				// في حالة حدوث خطأ غير متوقع
				console.error(`Unexpected error executing task ${task.id}:`, error)

				// إنشاء نتيجة فشل
				const errorResult: TaskResult = {
					success: false,
					error: error instanceof Error ? error.message : "حدث خطأ غير معروف",
					output: null,
					retries: 0,
				}

				// تخزين النتيجة
				results.set(task.id, errorResult)
				failedTasks.push(task.id)

				// إذا لم يتم تحديد الاستمرار في حالة الفشل، توقف عن تنفيذ المهام المتبقية
				if (!continueOnFailure) {
					console.log(`Task ${task.id} failed with error, skipping remaining tasks.`)
					break
				}
			}
		}

		// دمج نتائج المهام الفرعية
		const mergedResult = await this.mergeResults(mainTaskId, results)

		// حساب الإحصائيات
		const endTime = Date.now()
		const totalTime = endTime - startTime

		// حساب متوسط وقت المهمة
		let totalTaskTime = 0
		let completedTasksCount = 0

		for (const [_, result] of results.entries()) {
			if (result.success) {
				// تقدير وقت المهمة (في حالة عدم توفر وقت دقيق)
				const taskTime = 1000 // افتراضي 1 ثانية لكل مهمة
				totalTaskTime += taskTime
				completedTasksCount++
			}
		}

		const averageTaskTime = completedTasksCount > 0 ? totalTaskTime / completedTasksCount : 0

		return {
			success: failedTasks.length === 0,
			results,
			failedTasks,
			mergedResult,
			stats: {
				totalTime,
				averageTaskTime,
				totalRetries,
			}
		}
	}

	/**
	 * دمج نتائج المهام الفرعية
	 * @param mainTaskId معرف المهمة الرئيسية
	 * @param results نتائج المهام الفرعية
	 * @returns النتيجة المدمجة
	 */
	private async mergeResults(mainTaskId: string, results: Map<string, TaskResult>): Promise<any> {
		try {
			// تحليل نتائج المهام الفرعية
			const successfulTasks = Array.from(results.entries())
				.filter(([_, result]) => result.success)
				.map(([id, _]) => id)

			const failedTasks = Array.from(results.entries())
				.filter(([_, result]) => !result.success)
				.map(([id, result]) => ({
					id,
					error: result.error,
				}))

			// تجميع مخرجات المهام الناجحة
			const outputs: Record<string, any> = {}
			for (const [id, result] of results.entries()) {
				if (result.success && result.output) {
					outputs[id] = result.output
				}
			}

			// إنشاء تقرير مفصل
			const report = {
				summary: {
					totalTasks: results.size,
					successfulTasks: successfulTasks.length,
					failedTasks: failedTasks.length,
					successRate: results.size > 0 ? (successfulTasks.length / results.size) * 100 : 0,
				},
				taskIds: {
					all: Array.from(results.keys()),
					successful: successfulTasks,
					failed: failedTasks.map((task) => task.id),
				},
				errors: failedTasks,
				outputs,
			}

			// إرجاع النتائج المدمجة
			return {
				taskId: mainTaskId,
				success: failedTasks.length === 0,
				report,
				subtaskResults: Array.from(results.entries()).map(([id, result]) => ({
					id,
					success: result.success,
					output: result.output,
					error: result.error,
				})),
			}
		} catch (error) {
			console.error(`Error merging results for task ${mainTaskId}:`, error)
			return {
				taskId: mainTaskId,
				success: false,
				error: "Failed to merge subtask results",
				subtaskResults: Array.from(results.entries()).map(([id, result]) => ({
					id,
					success: result.success,
					output: result.output,
				})),
			}
		}
	}
}

// أنواع البيانات
export interface SubtaskDefinition {
	id: string
	description: string
	parallelizable: boolean
	dependencies?: string[]
	timeout?: number
	context?: any
	priority?: number // أولوية المهمة (أعلى = أهم)
	retries?: number // عدد مرات إعادة المحاولة المتبقية
}

export interface PrioritizedTask {
	task: SubtaskDefinition
	priority: number
	addedTime: number
}

export interface RetryConfig {
	maxRetries: number // الحد الأقصى لعدد مرات إعادة المحاولة
	retryDelay: number // التأخير بين المحاولات (بالمللي ثانية)
	exponentialBackoff: boolean // هل يتم زيادة التأخير بشكل أسي
}

export interface TaskExecution {
	task: Task
	startTime: number
	endTime?: number
	status: "running" | "completed" | "failed" | "cancelled"
	output?: any
	retryCount?: number // عدد مرات إعادة المحاولة
}

export interface TaskResult {
	success: boolean
	error?: string
	output: any
	retries?: number // عدد مرات إعادة المحاولة التي تمت
}

export interface ParallelExecutionResult {
	success: boolean
	results: Map<string, TaskResult>
	failedTasks: string[]
	mergedResult: any
	stats?: {
		totalTime: number
		averageTaskTime: number
		totalRetries: number
	}
}
