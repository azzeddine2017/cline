import { TaskManager } from "../task/TaskManager";
import * as vscode from "vscode";
import * as path from "path";

/**
 * نظام الذاكرة الذكي - يتيح لـ Cline تعلم وتذكر المفاهيم والأنماط وتفضيلات المستخدم
 * يحسن من قدرة Cline على التعامل مع المهام المتكررة والمعقدة
 */
export class SmartMemorySystem {
    private taskManager: TaskManager;
    private conceptsMemory: Map<string, ConceptMemory> = new Map();
    private patternMemory: Map<string, PatternMemory> = new Map();
    private userPreferencesMemory: UserPreferencesMemory;

    constructor(taskManager: TaskManager) {
        this.taskManager = taskManager;
        this.userPreferencesMemory = new UserPreferencesMemory();
    }

    /**
     * تعلم مفهوم جديد وتخزينه في الذاكرة
     * @param concept اسم المفهوم
     * @param context سياق المفهوم
     * @param relevance درجة أهمية المفهوم (0-1)
     */
    async learnConcept(concept: string, context: string, relevance: number): Promise<void> {
        if (!this.conceptsMemory.has(concept)) {
            this.conceptsMemory.set(concept, {
                name: concept,
                contexts: [context],
                relevanceScore: relevance,
                firstSeen: Date.now(),
                lastUsed: Date.now(),
                usageCount: 1
            });
        } else {
            const existingConcept = this.conceptsMemory.get(concept)!;
            existingConcept.contexts.push(context);
            existingConcept.relevanceScore = Math.max(existingConcept.relevanceScore, relevance);
            existingConcept.lastUsed = Date.now();
            existingConcept.usageCount++;
        }
    }

    /**
     * تعلم نمط كود جديد وتخزينه في الذاكرة
     * @param pattern اسم النمط
     * @param examples أمثلة على النمط
     * @param effectiveness درجة فعالية النمط (0-1)
     */
    async learnPattern(pattern: string, examples: string[], effectiveness: number): Promise<void> {
        if (!this.patternMemory.has(pattern)) {
            this.patternMemory.set(pattern, {
                name: pattern,
                examples: examples,
                effectivenessScore: effectiveness,
                firstSeen: Date.now(),
                lastUsed: Date.now(),
                usageCount: 1
            });
        } else {
            const existingPattern = this.patternMemory.get(pattern)!;
            existingPattern.examples = [...existingPattern.examples, ...examples];
            existingPattern.effectivenessScore = Math.max(existingPattern.effectivenessScore, effectiveness);
            existingPattern.lastUsed = Date.now();
            existingPattern.usageCount++;
        }
    }

    /**
     * تعلم تفضيل جديد للمستخدم
     * @param category فئة التفضيل
     * @param preference التفضيل نفسه
     */
    async learnUserPreference(category: string, preference: string): Promise<void> {
        this.userPreferencesMemory.addPreference(category, preference);
    }

    /**
     * استرجاع المعلومات ذات الصلة بالمهمة الحالية
     * @param taskContext سياق المهمة
     * @returns المعلومات ذات الصلة
     */
    async retrieveRelevantMemory(taskContext: string): Promise<RelevantMemory> {
        const relevantConcepts = this.findRelevantConcepts(taskContext);
        const relevantPatterns = this.findRelevantPatterns(taskContext);
        const relevantPreferences = this.userPreferencesMemory.getRelevantPreferences(taskContext);

        return {
            concepts: relevantConcepts,
            patterns: relevantPatterns,
            preferences: relevantPreferences
        };
    }

    /**
     * تحديث الذاكرة بناءً على نتائج المهمة
     * @param taskId معرف المهمة
     * @param success هل نجحت المهمة
     */
    async updateMemoryFromTaskResult(taskId: string, success: boolean): Promise<void> {
        try {
            // الحصول على المهمة من TaskManager
            const task = this.taskManager.getTask?.(taskId);
            if (!task) {
                console.warn(`Task with ID ${taskId} not found`);
                return;
            }

            // الحصول على سياق المهمة
            let taskContext = "";

            // نحاول استخدام طريقة getTaskContext إذا كانت متاحة
            try {
                // @ts-ignore - نتجاهل خطأ TypeScript لأننا نعلم أن هذه الطريقة موجودة
                if (typeof task.getTaskContext === 'function') {
                    // @ts-ignore
                    taskContext = task.getTaskContext();
                }
            } catch (e) {
                console.warn(`Could not get context for task ${taskId}`, e);
            }
            // تحديث فعالية الأنماط المستخدمة في المهمة
            const usedPatterns = Array.from(this.patternMemory.keys()).filter(pattern =>
                taskContext.includes(pattern)
            );

            for (const pattern of usedPatterns) {
                const patternData = this.patternMemory.get(pattern);
                if (patternData) {
                    // زيادة أو تقليل فعالية النمط بناءً على نجاح المهمة
                    if (success) {
                        patternData.effectivenessScore = Math.min(1, patternData.effectivenessScore + 0.1);
                    } else {
                        patternData.effectivenessScore = Math.max(0, patternData.effectivenessScore - 0.1);
                    }
                    patternData.lastUsed = Date.now();
                    patternData.usageCount++;
                }
            }

            // تحديث أهمية المفاهيم المستخدمة في المهمة
            const usedConcepts = Array.from(this.conceptsMemory.keys()).filter(concept =>
                taskContext.includes(concept)
            );

            for (const concept of usedConcepts) {
                const conceptData = this.conceptsMemory.get(concept);
                if (conceptData) {
                    // زيادة أو تقليل أهمية المفهوم بناءً على نجاح المهمة
                    if (success) {
                        conceptData.relevanceScore = Math.min(1, conceptData.relevanceScore + 0.1);
                    } else {
                        conceptData.relevanceScore = Math.max(0, conceptData.relevanceScore - 0.05);
                    }
                    conceptData.lastUsed = Date.now();
                    conceptData.usageCount++;
                }
            }

            // حفظ التغييرات
            await this.persistMemory();
        } catch (error) {
            console.error("Error updating memory from task result:", error);
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
                preferences: Array.from(this.userPreferencesMemory.exportPreferences().entries())
            };

            // التأكد من وجود مجلد الذاكرة
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                console.error("No workspace folder open");
                return;
            }

            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const memoryDir = path.join(workspaceRoot, '.cline', 'memory');

            // إنشاء مجلد الذاكرة إذا لم يكن موجودًا
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(memoryDir));

            // حفظ بيانات الذاكرة
            const memoryFilePath = path.join(memoryDir, 'memory.json');
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(memoryFilePath),
                new Uint8Array(Buffer.from(JSON.stringify(memoryData, null, 2), 'utf-8'))
            );

            console.log("Memory persisted successfully");
        } catch (error) {
            console.error("Error persisting memory:", error);
        }
    }

    /**
     * تحميل الذاكرة من ملفات
     */
    async loadMemory(): Promise<void> {
        try {
            // التأكد من وجود مجلد الذاكرة
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                console.error("No workspace folder open");
                return;
            }

            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const memoryFilePath = path.join(workspaceRoot, '.cline', 'memory', 'memory.json');

            // التحقق من وجود ملف الذاكرة
            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(memoryFilePath));
            } catch (error) {
                console.log("No memory file found, starting with empty memory");
                return;
            }

            // قراءة ملف الذاكرة
            const memoryFileData = await vscode.workspace.fs.readFile(vscode.Uri.file(memoryFilePath));
            const memoryData = JSON.parse(Buffer.from(memoryFileData).toString('utf-8'));

            // تحميل المفاهيم
            if (memoryData.concepts) {
                this.conceptsMemory = new Map(memoryData.concepts);
            }

            // تحميل الأنماط
            if (memoryData.patterns) {
                this.patternMemory = new Map(memoryData.patterns);
            }

            // تحميل التفضيلات
            if (memoryData.preferences) {
                this.userPreferencesMemory.importPreferences(new Map(memoryData.preferences));
            }

            console.log("Memory loaded successfully");
        } catch (error) {
            console.error("Error loading memory:", error);
        }
    }

    /**
     * إيجاد المفاهيم ذات الصلة بسياق معين
     * @param context السياق
     * @returns المفاهيم ذات الصلة
     */
    private findRelevantConcepts(context: string): ConceptMemory[] {
        const relevantConcepts: ConceptMemory[] = [];

        // خوارزمية بسيطة للبحث عن المفاهيم ذات الصلة
        for (const concept of this.conceptsMemory.values()) {
            if (concept.contexts.some(c => context.includes(c)) || context.includes(concept.name)) {
                relevantConcepts.push(concept);
            }
        }

        // ترتيب المفاهيم حسب الأهمية
        return relevantConcepts.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * إيجاد الأنماط ذات الصلة بسياق معين
     * @param context السياق
     * @returns الأنماط ذات الصلة
     */
    private findRelevantPatterns(context: string): PatternMemory[] {
        const relevantPatterns: PatternMemory[] = [];

        // خوارزمية بسيطة للبحث عن الأنماط ذات الصلة
        for (const pattern of this.patternMemory.values()) {
            if (context.includes(pattern.name)) {
                relevantPatterns.push(pattern);
            }
        }

        // ترتيب الأنماط حسب الفعالية
        return relevantPatterns.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
    }
}

/**
 * فئة لإدارة تفضيلات المستخدم
 */
export class UserPreferencesMemory {
    private preferences: Map<string, string[]> = new Map();

    /**
     * إضافة تفضيل جديد
     * @param category فئة التفضيل
     * @param preference التفضيل نفسه
     */
    addPreference(category: string, preference: string): void {
        if (!this.preferences.has(category)) {
            this.preferences.set(category, [preference]);
        } else {
            const existingPreferences = this.preferences.get(category)!;
            if (!existingPreferences.includes(preference)) {
                existingPreferences.push(preference);
            }
        }
    }

    /**
     * الحصول على التفضيلات ذات الصلة بسياق معين
     * @param context السياق
     * @returns التفضيلات ذات الصلة
     */
    getRelevantPreferences(_context: string): Map<string, string[]> {
        // في المستقبل، يمكن تحسين هذا لإرجاع التفضيلات ذات الصلة فقط
        return this.preferences;
    }

    /**
     * تصدير التفضيلات
     */
    exportPreferences(): Map<string, string[]> {
        return this.preferences;
    }

    /**
     * استيراد التفضيلات
     * @param preferences التفضيلات
     */
    importPreferences(preferences: Map<string, string[]>): void {
        this.preferences = preferences;
    }
}

// أنواع البيانات
export interface ConceptMemory {
    name: string;
    contexts: string[];
    relevanceScore: number;
    firstSeen: number;
    lastUsed: number;
    usageCount: number;
}

export interface PatternMemory {
    name: string;
    examples: string[];
    effectivenessScore: number;
    firstSeen: number;
    lastUsed: number;
    usageCount: number;
}

export interface RelevantMemory {
    concepts: ConceptMemory[];
    patterns: PatternMemory[];
    preferences: Map<string, string[]>;
}
