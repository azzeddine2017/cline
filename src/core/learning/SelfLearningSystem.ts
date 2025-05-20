import { Task } from "../task";

/**
 * واجهة للمهام التي يمكن استخدامها في نظام التعلم
 * تعريف الحد الأدنى من الواجهة المطلوبة للتعامل مع المهام
 */
export interface TaskInterface {
    taskId?: string;
    getContext?(): string;
    setTaskContext?(context: string): void;
    applyLearning?(patterns: any[], preferences: Map<string, string>): void;
}

/**
 * نظام التعلم الذاتي - يتيح لـ Cline التعلم من تفاعلات المستخدم وتحسين أدائه مع مرور الوقت
 * يساعد على تكييف سلوك Cline ليناسب احتياجات المستخدم بشكل أفضل
 */
export class SelfLearningSystem {
    private feedbackMemory: FeedbackMemory = new FeedbackMemory();
    private patternLearner: PatternLearner = new PatternLearner();
    private preferenceLearner: PreferenceLearner = new PreferenceLearner();

    /**
     * التعلم من ردود فعل المستخدم
     * @param taskId معرف المهمة
     * @param feedback رد فعل المستخدم
     */
    async learnFromFeedback(taskId: string, feedback: UserFeedback): Promise<void> {
        // تخزين ردود فعل المستخدم
        await this.feedbackMemory.storeFeedback(taskId, feedback);

        // تحليل ردود الفعل لاكتشاف الأنماط
        if (feedback.type === 'positive') {
            await this.patternLearner.learnPositivePattern(feedback.context, feedback.action);
        } else if (feedback.type === 'negative') {
            await this.patternLearner.learnNegativePattern(feedback.context, feedback.action);
        }

        // تعلم تفضيلات المستخدم
        await this.preferenceLearner.learnPreference(feedback);
    }

    /**
     * تطبيق ما تم تعلمه على مهمة
     * @param task المهمة
     */
    async applyLearning(task: Task | TaskInterface): Promise<void> {
        try {
            // الحصول على الأنماط ذات الصلة
            // استخدام الوصف أو المعلومات المتاحة من المهمة
            let contextStr = "";

            // محاولة الحصول على سياق المهمة بطرق مختلفة
            if ('taskId' in task && task.taskId) {
                contextStr += `Task ID: ${task.taskId} `;
            }

            // استخدام أي معلومات أخرى متاحة
            // نحاول الوصول إلى الخصائص بشكل آمن
            try {
                // محاولة الحصول على سياق المهمة من خلال getContext إذا كانت متاحة
                if ('getContext' in task) {
                    // استخدام type assertion لإخبار TypeScript بأن task له خاصية getContext
                    const taskWithContext = task as { getContext(): string };
                    const context = taskWithContext.getContext();
                    if (context && typeof context === 'string') {
                        contextStr += context;
                    }
                }
            } catch (e) {
                // تجاهل الخطأ
            }

            const relevantPatterns = await this.patternLearner.getRelevantPatterns(contextStr);

            // الحصول على تفضيلات المستخدم
            const userPreferences = await this.preferenceLearner.getUserPreferences();

            // تعديل سلوك المهمة بناءً على ما تم تعلمه
            if ('applyLearning' in task) {
                // استخدام type assertion لإخبار TypeScript بأن task له خاصية applyLearning
                const taskWithApplyLearning = task as { applyLearning(patterns: any[], preferences: Map<string, string>): void };
                taskWithApplyLearning.applyLearning(relevantPatterns, userPreferences);
                console.log("Applied learning to task:", relevantPatterns.length, "patterns and", userPreferences.size, "preferences");
            } else {
                console.warn("Task does not support applyLearning method");
            }
        } catch (error) {
            console.error("Error applying learning to task:", error);
        }
    }

    /**
     * توليد رؤى من البيانات المتعلمة
     * @returns الرؤى المتولدة
     */
    async generateInsights(): Promise<LearningInsight[]> {
        // توليد رؤى من البيانات المتعلمة
        const patternInsights = await this.patternLearner.generateInsights();
        const preferenceInsights = await this.preferenceLearner.generateInsights();

        return [...patternInsights, ...preferenceInsights];
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
            feedback: await this.feedbackMemory.exportFeedback()
        };
    }

    /**
     * استيراد بيانات التعلم
     * @param learningData بيانات التعلم
     */
    async importLearning(learningData: LearningExport): Promise<void> {
        // استيراد بيانات التعلم من جلسات سابقة
        await this.patternLearner.importPatterns(learningData.patterns);
        await this.preferenceLearner.importPreferences(learningData.preferences);
        await this.feedbackMemory.importFeedback(learningData.feedback);
    }
}

/**
 * فئة لتخزين ردود فعل المستخدم
 */
export class FeedbackMemory {
    private feedback: Map<string, UserFeedback[]> = new Map();

    /**
     * تخزين رد فعل
     * @param taskId معرف المهمة
     * @param feedback رد الفعل
     */
    async storeFeedback(taskId: string, feedback: UserFeedback): Promise<void> {
        if (!this.feedback.has(taskId)) {
            this.feedback.set(taskId, [feedback]);
        } else {
            this.feedback.get(taskId)!.push(feedback);
        }
    }

    /**
     * تصدير ردود الفعل
     * @returns ردود الفعل
     */
    async exportFeedback(): Promise<Map<string, UserFeedback[]>> {
        return new Map(this.feedback);
    }

    /**
     * استيراد ردود الفعل
     * @param feedback ردود الفعل
     */
    async importFeedback(feedback: Map<string, UserFeedback[]>): Promise<void> {
        this.feedback = new Map(feedback);
    }
}

/**
 * فئة لتعلم أنماط الكود
 */
export class PatternLearner {
    private positivePatterns: Map<string, number> = new Map();
    private negativePatterns: Map<string, number> = new Map();

    /**
     * تعلم نمط إيجابي
     * @param context السياق
     * @param action الإجراء
     */
    async learnPositivePattern(context: string, action: string): Promise<void> {
        const pattern = this.extractPattern(context, action);
        const currentCount = this.positivePatterns.get(pattern) || 0;
        this.positivePatterns.set(pattern, currentCount + 1);
    }

    /**
     * تعلم نمط سلبي
     * @param context السياق
     * @param action الإجراء
     */
    async learnNegativePattern(context: string, action: string): Promise<void> {
        const pattern = this.extractPattern(context, action);
        const currentCount = this.negativePatterns.get(pattern) || 0;
        this.negativePatterns.set(pattern, currentCount + 1);
    }

    /**
     * الحصول على الأنماط ذات الصلة
     * @param context السياق
     * @returns الأنماط ذات الصلة
     */
    async getRelevantPatterns(context: string): Promise<RelevantPattern[]> {
        // إيجاد الأنماط ذات الصلة بالسياق الحالي
        const relevantPatterns: RelevantPattern[] = [];

        // البحث في الأنماط الإيجابية
        for (const [pattern, count] of this.positivePatterns.entries()) {
            if (this.isPatternRelevant(pattern, context)) {
                relevantPatterns.push({
                    pattern,
                    confidence: count / 10, // تبسيط: الثقة تزداد مع عدد المرات
                    isPositive: true
                });
            }
        }

        // البحث في الأنماط السلبية
        for (const [pattern, count] of this.negativePatterns.entries()) {
            if (this.isPatternRelevant(pattern, context)) {
                relevantPatterns.push({
                    pattern,
                    confidence: count / 10,
                    isPositive: false
                });
            }
        }

        // ترتيب الأنماط حسب الثقة
        return relevantPatterns.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * توليد رؤى من الأنماط المتعلمة
     * @returns الرؤى المتولدة
     */
    async generateInsights(): Promise<LearningInsight[]> {
        // توليد رؤى من الأنماط المتعلمة
        const insights: LearningInsight[] = [];

        // تحليل الأنماط الإيجابية الأكثر شيوعًا
        const topPositivePatterns = Array.from(this.positivePatterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (const [pattern, count] of topPositivePatterns) {
            insights.push({
                type: 'positive_pattern',
                description: `نمط مفضل: ${pattern}`,
                confidence: count / 10,
                source: 'pattern_learner'
            });
        }

        // تحليل الأنماط السلبية الأكثر شيوعًا
        const topNegativePatterns = Array.from(this.negativePatterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (const [pattern, count] of topNegativePatterns) {
            insights.push({
                type: 'negative_pattern',
                description: `نمط غير مفضل: ${pattern}`,
                confidence: count / 10,
                source: 'pattern_learner'
            });
        }

        return insights;
    }

    /**
     * تصدير الأنماط
     * @returns بيانات الأنماط
     */
    async exportPatterns(): Promise<PatternExport> {
        return {
            positive: new Map(this.positivePatterns),
            negative: new Map(this.negativePatterns)
        };
    }

    /**
     * استيراد الأنماط
     * @param patterns بيانات الأنماط
     */
    async importPatterns(patterns: PatternExport): Promise<void> {
        this.positivePatterns = new Map(patterns.positive);
        this.negativePatterns = new Map(patterns.negative);
    }

    /**
     * استخراج نمط من السياق والإجراء
     * @param context السياق
     * @param action الإجراء
     * @returns النمط
     */
    private extractPattern(context: string, action: string): string {
        // استخراج نمط من السياق والإجراء
        // تنفيذ بسيط: دمج السياق والإجراء
        return `${context}:${action}`;
    }

    /**
     * التحقق من صلة النمط بالسياق
     * @param pattern النمط
     * @param context السياق
     * @returns هل النمط ذو صلة
     */
    private isPatternRelevant(pattern: string, context: string): boolean {
        // التحقق من صلة النمط بالسياق
        // تنفيذ بسيط: التحقق من وجود جزء من النمط في السياق
        const patternParts = pattern.split(':');
        if (patternParts.length > 0) {
            return context.includes(patternParts[0]);
        }
        return false;
    }
}

/**
 * فئة لتعلم تفضيلات المستخدم
 */
export class PreferenceLearner {
    private preferences: Map<string, PreferenceData> = new Map();

    /**
     * تعلم تفضيل من رد فعل
     * @param feedback رد الفعل
     */
    async learnPreference(feedback: UserFeedback): Promise<void> {
        // تعلم تفضيلات المستخدم من ردود الفعل
        const category = this.categorizePreference(feedback);
        const value = this.extractPreferenceValue(feedback);

        if (!this.preferences.has(category)) {
            this.preferences.set(category, { value, confidence: 1, lastUpdated: Date.now() });
        } else {
            const current = this.preferences.get(category)!;
            if (current.value === value) {
                current.confidence += 1;
            } else {
                // إذا كانت القيمة مختلفة، قم بتحديث القيمة إذا كانت الثقة منخفضة
                if (current.confidence < 3) {
                    current.value = value;
                    current.confidence = 1;
                } else {
                    // إذا كانت الثقة عالية، قلل منها فقط
                    current.confidence -= 0.5;
                }
            }
            current.lastUpdated = Date.now();
        }
    }

    /**
     * الحصول على تفضيلات المستخدم
     * @returns تفضيلات المستخدم
     */
    async getUserPreferences(): Promise<Map<string, string>> {
        // إرجاع تفضيلات المستخدم الحالية
        const result = new Map<string, string>();
        for (const [category, data] of this.preferences.entries()) {
            if (data.confidence >= 2) {
                result.set(category, data.value);
            }
        }
        return result;
    }

    /**
     * توليد رؤى من تفضيلات المستخدم
     * @returns الرؤى المتولدة
     */
    async generateInsights(): Promise<LearningInsight[]> {
        // توليد رؤى من تفضيلات المستخدم
        const insights: LearningInsight[] = [];

        for (const [category, data] of this.preferences.entries()) {
            if (data.confidence >= 3) {
                insights.push({
                    type: 'user_preference',
                    description: `تفضيل المستخدم: ${category} = ${data.value}`,
                    confidence: data.confidence / 5, // تطبيع الثقة إلى نطاق 0-1
                    source: 'preference_learner'
                });
            }
        }

        return insights;
    }

    /**
     * تصدير التفضيلات
     * @returns بيانات التفضيلات
     */
    async exportPreferences(): Promise<Map<string, PreferenceData>> {
        return new Map(this.preferences);
    }

    /**
     * استيراد التفضيلات
     * @param preferences بيانات التفضيلات
     */
    async importPreferences(preferences: Map<string, PreferenceData>): Promise<void> {
        this.preferences = new Map(preferences);
    }

    /**
     * تصنيف نوع التفضيل
     * @param feedback رد الفعل
     * @returns فئة التفضيل
     */
    private categorizePreference(feedback: UserFeedback): string {
        // تصنيف نوع التفضيل بناءً على السياق والإجراء
        const context = feedback.context.toLowerCase();
        const action = feedback.action.toLowerCase();

        // تحديد الفئات المختلفة للتفضيلات
        const categories = {
            'code_style': ['format', 'style', 'indent', 'spacing', 'naming', 'convention'],
            'ui_preference': ['ui', 'interface', 'color', 'theme', 'layout', 'display'],
            'language_preference': ['language', 'typescript', 'javascript', 'python', 'java', 'c#', 'go'],
            'communication_style': ['verbose', 'concise', 'detailed', 'brief', 'explain', 'comment'],
            'workflow': ['workflow', 'process', 'steps', 'approach', 'method'],
            'tool_preference': ['tool', 'editor', 'ide', 'terminal', 'command', 'git']
        };

        // البحث عن الفئة المناسبة
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => context.includes(keyword) || action.includes(keyword))) {
                return category;
            }
        }

        // إذا لم يتم العثور على فئة محددة، استخدم الكلمة الأولى من السياق
        const firstWord = context.split(' ')[0];
        return firstWord.length > 3 ? firstWord : 'general';
    }

    /**
     * استخراج قيمة التفضيل
     * @param feedback رد الفعل
     * @returns قيمة التفضيل
     */
    private extractPreferenceValue(feedback: UserFeedback): string {
        // استخراج قيمة التفضيل بناءً على نوع التفضيل والإجراء
        const type = feedback.type;
        const action = feedback.action;

        // إذا كان رد الفعل إيجابيًا، استخدم الإجراء كقيمة
        if (type === 'positive') {
            return action;
        }

        // إذا كان رد الفعل سلبيًا، حاول استخراج البديل المفضل
        if (type === 'negative') {
            // البحث عن عبارات مثل "استخدم X بدلاً من ذلك" أو "أفضل Y"
            const preferInstead = /استخدم\s+([^\s]+)\s+بدلاً/i;
            const prefer = /أفضل\s+([^\s]+)/i;

            const preferInsteadMatch = action.match(preferInstead);
            if (preferInsteadMatch && preferInsteadMatch[1]) {
                return preferInsteadMatch[1];
            }

            const preferMatch = action.match(prefer);
            if (preferMatch && preferMatch[1]) {
                return preferMatch[1];
            }

            // إذا لم يتم العثور على بديل، استخدم علامة "not_" مع الإجراء
            return `not_${action.split(' ')[0]}`;
        }

        // للردود المحايدة، استخدم الإجراء كما هو
        return action;
    }
}

// أنواع البيانات
export interface UserFeedback {
    type: 'positive' | 'negative' | 'neutral';
    context: string;
    action: string;
    timestamp: number;
    details?: string;
}

export interface RelevantPattern {
    pattern: string;
    confidence: number;
    isPositive: boolean;
}

export interface LearningInsight {
    type: string;
    description: string;
    confidence: number;
    source: string;
}

export interface PatternExport {
    positive: Map<string, number>;
    negative: Map<string, number>;
}

export interface PreferenceData {
    value: string;
    confidence: number;
    lastUpdated: number;
}

export interface LearningExport {
    patterns: PatternExport;
    preferences: Map<string, PreferenceData>;
    feedback: Map<string, UserFeedback[]>;
}
