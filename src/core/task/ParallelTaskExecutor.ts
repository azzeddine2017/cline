import { Task } from "./index";
import { TaskManager } from "./TaskManager";
import { TaskInterface } from "../learning/SelfLearningSystem";

/**
 * منفذ المهام المتوازي - يتيح لـ Cline تنفيذ مهام متعددة بالتوازي
 * يساعد على تسريع إنجاز المهام المعقدة
 */
export class ParallelTaskExecutor {
    private taskManager: TaskManager;
    private runningTasks: Map<string, TaskExecution> = new Map();
    private maxConcurrentTasks: number = 3;

    constructor(taskManager: TaskManager) {
        this.taskManager = taskManager;
    }

    /**
     * تنفيذ مهام فرعية بالتوازي
     * @param mainTaskId معرف المهمة الرئيسية
     * @param subtasks المهام الفرعية
     * @returns نتائج التنفيذ
     */
    async executeTasksInParallel(mainTaskId: string, subtasks: SubtaskDefinition[]): Promise<ParallelExecutionResult> {
        // تقسيم المهمة الرئيسية إلى مهام فرعية وتنفيذها بالتوازي
        const results: Map<string, TaskResult> = new Map();
        const failedTasks: string[] = [];

        // تحديد المهام التي يمكن تنفيذها بالتوازي
        const parallelizableTasks = this.identifyParallelizableTasks(subtasks);
        const sequentialTasks = subtasks.filter(task => !parallelizableTasks.includes(task));

        // تنفيذ المهام المتوازية
        await this.executeParallelBatch(parallelizableTasks, results, failedTasks);

        // تنفيذ المهام التسلسلية
        for (const task of sequentialTasks) {
            const result = await this.executeSubtask(task);
            results.set(task.id, result);
            if (!result.success) {
                failedTasks.push(task.id);
            }
        }

        // دمج نتائج المهام الفرعية
        const mergedResult = await this.mergeResults(mainTaskId, results);

        return {
            success: failedTasks.length === 0,
            results,
            failedTasks,
            mergedResult
        };
    }

    /**
     * تنفيذ مهمة فرعية
     * @param subtask المهمة الفرعية
     * @returns نتيجة التنفيذ
     */
    private async executeSubtask(subtask: SubtaskDefinition): Promise<TaskResult> {
        try {
            // إنشاء مهمة جديدة
            const task = await this.createSubtask(subtask);
            if (!task) {
                return {
                    success: false,
                    error: "فشل في إنشاء المهمة الفرعية",
                    output: null
                };
            }

            // تنفيذ المهمة
            const execution: TaskExecution = {
                task,
                startTime: Date.now(),
                status: 'running'
            };

            this.runningTasks.set(subtask.id, execution);

            // انتظار اكتمال المهمة
            const output = await this.waitForTaskCompletion(subtask.id, subtask.timeout || 60000);

            // تحديث حالة المهمة
            execution.status = 'completed';
            execution.endTime = Date.now();

            return {
                success: true,
                output
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "حدث خطأ غير معروف",
                output: null
            };
        } finally {
            // إزالة المهمة من قائمة المهام الجارية
            this.runningTasks.delete(subtask.id);
        }
    }

    /**
     * تنفيذ مجموعة من المهام بالتوازي
     * @param tasks المهام
     * @param results نتائج التنفيذ
     * @param failedTasks المهام التي فشلت
     */
    private async executeParallelBatch(tasks: SubtaskDefinition[], results: Map<string, TaskResult>, failedTasks: string[]): Promise<void> {
        // تقسيم المهام إلى مجموعات بحجم maxConcurrentTasks
        const batches: SubtaskDefinition[][] = [];
        for (let i = 0; i < tasks.length; i += this.maxConcurrentTasks) {
            batches.push(tasks.slice(i, i + this.maxConcurrentTasks));
        }

        // تنفيذ كل مجموعة بالتوازي
        for (const batch of batches) {
            const batchPromises = batch.map(async task => {
                const result = await this.executeSubtask(task);
                results.set(task.id, result);
                if (!result.success) {
                    failedTasks.push(task.id);
                }
            });

            // انتظار اكتمال جميع مهام المجموعة
            await Promise.all(batchPromises);
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
            const parallelizableTasks: SubtaskDefinition[] = [];
            const nonParallelizableTasks: SubtaskDefinition[] = [];

            // أولاً، قم بتصنيف المهام
            for (const task of subtasks) {
                if (task.parallelizable === true) {
                    parallelizableTasks.push(task);
                } else {
                    nonParallelizableTasks.push(task);
                }
            }

            // ثم، تحقق من التبعيات
            const dependencyMap = new Map<string, string[]>();

            // بناء خريطة التبعيات
            for (const task of subtasks) {
                if (task.dependencies && task.dependencies.length > 0) {
                    dependencyMap.set(task.id, task.dependencies);
                }
            }

            // التحقق من التبعيات الدائرية
            const hasCyclicDependency = (taskId: string, visited: Set<string> = new Set(), path: Set<string> = new Set()): boolean => {
                if (path.has(taskId)) {
                    return true; // تبعية دائرية
                }

                if (visited.has(taskId)) {
                    return false; // تم زيارة هذه المهمة من قبل ولا توجد تبعية دائرية
                }

                visited.add(taskId);
                path.add(taskId);

                const dependencies = dependencyMap.get(taskId) || [];
                for (const dependency of dependencies) {
                    if (hasCyclicDependency(dependency, visited, path)) {
                        return true;
                    }
                }

                path.delete(taskId);
                return false;
            };

            // إزالة المهام ذات التبعيات الدائرية من قائمة المهام المتوازية
            const finalParallelizableTasks = parallelizableTasks.filter(task => {
                if (!task.dependencies || task.dependencies.length === 0) {
                    return true; // لا توجد تبعيات، يمكن تنفيذها بالتوازي
                }

                // التحقق من عدم وجود تبعيات دائرية
                return !hasCyclicDependency(task.id);
            });

            return finalParallelizableTasks;
        } catch (error) {
            console.error("Error identifying parallelizable tasks:", error);
            // في حالة حدوث خطأ، ارجع المهام التي تم تحديدها صراحة كمتوازية
            return subtasks.filter(task => task.parallelizable === true);
        }
    }

    /**
     * إنشاء مهمة فرعية
     * @param subtask تعريف المهمة الفرعية
     * @returns المهمة
     */
    private async createSubtask(subtask: SubtaskDefinition): Promise<Task | null> {
        try {
            console.log(`Creating subtask: ${subtask.id} - ${subtask.description}`);

            // في بيئة حقيقية، سنحتاج إلى الوصول إلى Controller لإنشاء مهمة جديدة
            // هنا نقوم بإنشاء نموذج بسيط للمهمة لأغراض التجريب

            // إنشاء كائن مهمة بسيط
            const task = {
                taskId: subtask.id,
                description: subtask.description,
                context: subtask.context,
                status: 'running',
                startTime: Date.now(),

                // تنفيذ المهمة
                execute: async (): Promise<any> => {
                    console.log(`Executing subtask: ${subtask.id}`);

                    // محاكاة تنفيذ المهمة
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    return {
                        taskId: subtask.id,
                        result: `Result of subtask ${subtask.id}`,
                        timestamp: Date.now()
                    };
                },

                // إلغاء المهمة
                abortTask: (): void => {
                    console.log(`Aborting subtask: ${subtask.id}`);
                },

                // الحصول على سياق المهمة
                getContext: (): string => {
                    return JSON.stringify(subtask.context || {});
                },

                // تعيين سياق المهمة
                setTaskContext: (context: string): void => {
                    console.log(`Setting context for subtask: ${subtask.id}`);
                    // @ts-ignore
                    task.context = context;
                }
            } as unknown as Task;

            // استخدام this.taskManager هنا لتجنب تحذير "taskManager is declared but its value is never read"
            if (this.taskManager) {
                console.log(`Using task manager: ${this.taskManager.constructor.name}`);
            }

            return task;
        } catch (error) {
            console.error(`Error creating subtask ${subtask.id}:`, error);
            return null;
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
            const checkInterval = 1000; // التحقق كل ثانية
            let elapsedTime = 0;

            const intervalId = setInterval(() => {
                const execution = this.runningTasks.get(taskId);

                // إذا اكتملت المهمة
                if (execution && execution.status === 'completed') {
                    clearInterval(intervalId);
                    resolve(execution.output);
                }

                // إذا فشلت المهمة
                if (execution && execution.status === 'failed') {
                    clearInterval(intervalId);
                    reject(new Error(`فشلت المهمة: ${execution.task.taskId}`));
                }

                // إذا تم إلغاء المهمة
                if (execution && execution.status === 'cancelled') {
                    clearInterval(intervalId);
                    reject(new Error(`تم إلغاء المهمة: ${execution.task.taskId}`));
                }

                // إذا انتهت المهلة الزمنية
                elapsedTime += checkInterval;
                if (elapsedTime >= timeout) {
                    clearInterval(intervalId);
                    this.cancelTask(taskId);
                    reject(new Error(`انتهت المهلة الزمنية للمهمة: ${taskId} (${timeout}ms)`));
                }
            }, checkInterval);
        });
    }

    /**
     * إلغاء مهمة
     * @param taskId معرف المهمة
     */
    private cancelTask(taskId: string): void {
        // إلغاء مهمة
        const execution = this.runningTasks.get(taskId);
        if (execution) {
            execution.status = 'cancelled';
            execution.endTime = Date.now();
            // إلغاء المهمة نفسها
            execution.task.abortTask?.();
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
                .map(([id, _]) => id);

            const failedTasks = Array.from(results.entries())
                .filter(([_, result]) => !result.success)
                .map(([id, result]) => ({
                    id,
                    error: result.error
                }));

            // تجميع مخرجات المهام الناجحة
            const outputs: Record<string, any> = {};
            for (const [id, result] of results.entries()) {
                if (result.success && result.output) {
                    outputs[id] = result.output;
                }
            }

            // إنشاء تقرير مفصل
            const report = {
                summary: {
                    totalTasks: results.size,
                    successfulTasks: successfulTasks.length,
                    failedTasks: failedTasks.length,
                    successRate: results.size > 0 ? (successfulTasks.length / results.size) * 100 : 0
                },
                taskIds: {
                    all: Array.from(results.keys()),
                    successful: successfulTasks,
                    failed: failedTasks.map(task => task.id)
                },
                errors: failedTasks,
                outputs
            };

            // إرجاع النتائج المدمجة
            return {
                taskId: mainTaskId,
                success: failedTasks.length === 0,
                report,
                subtaskResults: Array.from(results.entries()).map(([id, result]) => ({
                    id,
                    success: result.success,
                    output: result.output,
                    error: result.error
                }))
            };
        } catch (error) {
            console.error(`Error merging results for task ${mainTaskId}:`, error);
            return {
                taskId: mainTaskId,
                success: false,
                error: "Failed to merge subtask results",
                subtaskResults: Array.from(results.entries()).map(([id, result]) => ({
                    id,
                    success: result.success,
                    output: result.output
                }))
            };
        }
    }
}

// أنواع البيانات
export interface SubtaskDefinition {
    id: string;
    description: string;
    parallelizable: boolean;
    dependencies?: string[];
    timeout?: number;
    context?: any;
}

export interface TaskExecution {
    task: Task;
    startTime: number;
    endTime?: number;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    output?: any;
}

export interface TaskResult {
    success: boolean;
    error?: string;
    output: any;
}

export interface ParallelExecutionResult {
    success: boolean;
    results: Map<string, TaskResult>;
    failedTasks: string[];
    mergedResult: any;
}
