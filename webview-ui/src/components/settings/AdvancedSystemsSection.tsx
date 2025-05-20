import { VSCodeCheckbox, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
// import { useExtensionState } from "@/context/ExtensionStateContext"
import { memo, useState } from "react"
import { useTranslation } from "@/context/TranslationContext"
import { vscode } from "@/utils/vscode"

/**
 * قسم إعدادات الأنظمة المتقدمة
 */
const AdvancedSystemsSection = () => {
	const { t, isRtl } = useTranslation()
	// في المستقبل، يمكننا استخدام ExtensionStateContext للحصول على حالة الإعدادات المتقدمة

	// إعدادات الأنظمة المتقدمة
	const [enableAdvancedSystems, setEnableAdvancedSystems] = useState(true)
	const [enableCodeAnalyzer, setEnableCodeAnalyzer] = useState(true)
	const [enableLearningSystem, setEnableLearningSystem] = useState(true)
	const [enableMemorySystem, setEnableMemorySystem] = useState(true)
	const [enableParallelTaskExecutor, setEnableParallelTaskExecutor] = useState(true)
	const [maxConcurrentTasks, setMaxConcurrentTasks] = useState("3")
	const [maxRetries, setMaxRetries] = useState("3")

	/**
	 * معالجة تغيير تفعيل الأنظمة المتقدمة
	 * @param checked حالة التفعيل
	 */
	const handleEnableAdvancedSystemsChange = (checked: boolean) => {
		setEnableAdvancedSystems(checked)

		// إرسال رسالة إلى الامتداد لتحديث الإعدادات
		vscode.postMessage({
			type: "updateAdvancedSystemsSettings",
			settings: {
				enabled: checked,
				codeAnalyzer: enableCodeAnalyzer,
				learningSystem: enableLearningSystem,
				memorySystem: enableMemorySystem,
				parallelTaskExecutor: enableParallelTaskExecutor,
				maxConcurrentTasks: parseInt(maxConcurrentTasks),
				maxRetries: parseInt(maxRetries),
			},
		})
	}

	/**
	 * معالجة تغيير تفعيل محلل الكود
	 * @param checked حالة التفعيل
	 */
	const handleEnableCodeAnalyzerChange = (checked: boolean) => {
		setEnableCodeAnalyzer(checked)

		// إرسال رسالة إلى الامتداد لتحديث الإعدادات
		vscode.postMessage({
			type: "updateAdvancedSystemsSettings",
			settings: {
				enabled: enableAdvancedSystems,
				codeAnalyzer: checked,
				learningSystem: enableLearningSystem,
				memorySystem: enableMemorySystem,
				parallelTaskExecutor: enableParallelTaskExecutor,
				maxConcurrentTasks: parseInt(maxConcurrentTasks),
				maxRetries: parseInt(maxRetries),
			},
		})
	}

	/**
	 * معالجة تغيير تفعيل نظام التعلم
	 * @param checked حالة التفعيل
	 */
	const handleEnableLearningSystemChange = (checked: boolean) => {
		setEnableLearningSystem(checked)

		// إرسال رسالة إلى الامتداد لتحديث الإعدادات
		vscode.postMessage({
			type: "updateAdvancedSystemsSettings",
			settings: {
				enabled: enableAdvancedSystems,
				codeAnalyzer: enableCodeAnalyzer,
				learningSystem: checked,
				memorySystem: enableMemorySystem,
				parallelTaskExecutor: enableParallelTaskExecutor,
				maxConcurrentTasks: parseInt(maxConcurrentTasks),
				maxRetries: parseInt(maxRetries),
			},
		})
	}

	/**
	 * معالجة تغيير تفعيل نظام الذاكرة
	 * @param checked حالة التفعيل
	 */
	const handleEnableMemorySystemChange = (checked: boolean) => {
		setEnableMemorySystem(checked)

		// إرسال رسالة إلى الامتداد لتحديث الإعدادات
		vscode.postMessage({
			type: "updateAdvancedSystemsSettings",
			settings: {
				enabled: enableAdvancedSystems,
				codeAnalyzer: enableCodeAnalyzer,
				learningSystem: enableLearningSystem,
				memorySystem: checked,
				parallelTaskExecutor: enableParallelTaskExecutor,
				maxConcurrentTasks: parseInt(maxConcurrentTasks),
				maxRetries: parseInt(maxRetries),
			},
		})
	}

	/**
	 * معالجة تغيير تفعيل منفذ المهام المتوازي
	 * @param checked حالة التفعيل
	 */
	const handleEnableParallelTaskExecutorChange = (checked: boolean) => {
		setEnableParallelTaskExecutor(checked)

		// إرسال رسالة إلى الامتداد لتحديث الإعدادات
		vscode.postMessage({
			type: "updateAdvancedSystemsSettings",
			settings: {
				enabled: enableAdvancedSystems,
				codeAnalyzer: enableCodeAnalyzer,
				learningSystem: enableLearningSystem,
				memorySystem: enableMemorySystem,
				parallelTaskExecutor: checked,
				maxConcurrentTasks: parseInt(maxConcurrentTasks),
				maxRetries: parseInt(maxRetries),
			},
		})
	}

	/**
	 * معالجة تغيير الحد الأقصى للمهام المتزامنة
	 * @param value القيمة الجديدة
	 */
	const handleMaxConcurrentTasksChange = (value: string) => {
		// التحقق من صحة القيمة
		const numValue = parseInt(value)
		if (isNaN(numValue) || numValue < 1) {
			return
		}

		setMaxConcurrentTasks(value)

		// إرسال رسالة إلى الامتداد لتحديث الإعدادات
		vscode.postMessage({
			type: "updateAdvancedSystemsSettings",
			settings: {
				enabled: enableAdvancedSystems,
				codeAnalyzer: enableCodeAnalyzer,
				learningSystem: enableLearningSystem,
				memorySystem: enableMemorySystem,
				parallelTaskExecutor: enableParallelTaskExecutor,
				maxConcurrentTasks: numValue,
				maxRetries: parseInt(maxRetries),
			},
		})
	}

	/**
	 * معالجة تغيير الحد الأقصى لعدد مرات إعادة المحاولة
	 * @param value القيمة الجديدة
	 */
	const handleMaxRetriesChange = (value: string) => {
		// التحقق من صحة القيمة
		const numValue = parseInt(value)
		if (isNaN(numValue) || numValue < 0) {
			return
		}

		setMaxRetries(value)

		// إرسال رسالة إلى الامتداد لتحديث الإعدادات
		vscode.postMessage({
			type: "updateAdvancedSystemsSettings",
			settings: {
				enabled: enableAdvancedSystems,
				codeAnalyzer: enableCodeAnalyzer,
				learningSystem: enableLearningSystem,
				memorySystem: enableMemorySystem,
				parallelTaskExecutor: enableParallelTaskExecutor,
				maxConcurrentTasks: parseInt(maxConcurrentTasks),
				maxRetries: numValue,
			},
		})
	}

	return (
		<div
			id="advanced-systems-section"
			style={{ marginBottom: 20, borderTop: "1px solid var(--vscode-panel-border)", paddingTop: 15 }}
			className={isRtl ? "rtl" : ""}>
			<h3 style={{ color: "var(--vscode-foreground)", margin: "0 0 10px 0", fontSize: "14px" }}>
				{t("settings.advancedSystems.title")}
			</h3>

			{/* تفعيل الأنظمة المتقدمة */}
			<div style={{ marginBottom: 10 }}>
				<VSCodeCheckbox
					checked={enableAdvancedSystems}
					onChange={(e: any) => {
						const checked = e.target.checked === true
						handleEnableAdvancedSystemsChange(checked)
					}}>
					{t("settings.advancedSystems.enable")}
				</VSCodeCheckbox>
				<p className="text-xs text-[var(--vscode-descriptionForeground)]">
					{t("settings.advancedSystems.enableDescription")}
				</p>
			</div>

			{/* إعدادات الأنظمة المتقدمة */}
			{enableAdvancedSystems && (
				<div style={{ marginLeft: 20 }}>
					{/* تفعيل محلل الكود */}
					<div style={{ marginBottom: 10 }}>
						<VSCodeCheckbox
							checked={enableCodeAnalyzer}
							onChange={(e: any) => {
								const checked = e.target.checked === true
								handleEnableCodeAnalyzerChange(checked)
							}}>
							{t("settings.advancedSystems.enableCodeAnalyzer")}
						</VSCodeCheckbox>
						<p className="text-xs text-[var(--vscode-descriptionForeground)]">
							{t("settings.advancedSystems.enableCodeAnalyzerDescription")}
						</p>
					</div>

					{/* تفعيل نظام التعلم */}
					<div style={{ marginBottom: 10 }}>
						<VSCodeCheckbox
							checked={enableLearningSystem}
							onChange={(e: any) => {
								const checked = e.target.checked === true
								handleEnableLearningSystemChange(checked)
							}}>
							{t("settings.advancedSystems.enableLearningSystem")}
						</VSCodeCheckbox>
						<p className="text-xs text-[var(--vscode-descriptionForeground)]">
							{t("settings.advancedSystems.enableLearningSystemDescription")}
						</p>
					</div>

					{/* تفعيل نظام الذاكرة */}
					<div style={{ marginBottom: 10 }}>
						<VSCodeCheckbox
							checked={enableMemorySystem}
							onChange={(e: any) => {
								const checked = e.target.checked === true
								handleEnableMemorySystemChange(checked)
							}}>
							{t("settings.advancedSystems.enableMemorySystem")}
						</VSCodeCheckbox>
						<p className="text-xs text-[var(--vscode-descriptionForeground)]">
							{t("settings.advancedSystems.enableMemorySystemDescription")}
						</p>
					</div>

					{/* تفعيل منفذ المهام المتوازي */}
					<div style={{ marginBottom: 10 }}>
						<VSCodeCheckbox
							checked={enableParallelTaskExecutor}
							onChange={(e: any) => {
								const checked = e.target.checked === true
								handleEnableParallelTaskExecutorChange(checked)
							}}>
							{t("settings.advancedSystems.enableParallelTaskExecutor")}
						</VSCodeCheckbox>
						<p className="text-xs text-[var(--vscode-descriptionForeground)]">
							{t("settings.advancedSystems.enableParallelTaskExecutorDescription")}
						</p>
					</div>

					{/* إعدادات منفذ المهام المتوازي */}
					{enableParallelTaskExecutor && (
						<div style={{ marginLeft: 20 }}>
							{/* الحد الأقصى للمهام المتزامنة */}
							<div style={{ marginBottom: 10 }}>
								<label style={{ fontWeight: "500", display: "block", marginBottom: 5 }}>
									{t("settings.advancedSystems.maxConcurrentTasks")}
								</label>
								<VSCodeTextField
									style={{ width: "100%" }}
									value={maxConcurrentTasks}
									placeholder="3"
									onInput={(e: any) => handleMaxConcurrentTasksChange(e.target.value)}
								/>
								<p className="text-xs text-[var(--vscode-descriptionForeground)]">
									{t("settings.advancedSystems.maxConcurrentTasksDescription")}
								</p>
							</div>

							{/* الحد الأقصى لعدد مرات إعادة المحاولة */}
							<div style={{ marginBottom: 10 }}>
								<label style={{ fontWeight: "500", display: "block", marginBottom: 5 }}>
									{t("settings.advancedSystems.maxRetries")}
								</label>
								<VSCodeTextField
									style={{ width: "100%" }}
									value={maxRetries}
									placeholder="3"
									onInput={(e: any) => handleMaxRetriesChange(e.target.value)}
								/>
								<p className="text-xs text-[var(--vscode-descriptionForeground)]">
									{t("settings.advancedSystems.maxRetriesDescription")}
								</p>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default memo(AdvancedSystemsSection)
