import { Anthropic } from "@anthropic-ai/sdk"
import * as diff from "diff"
import * as path from "path"
import { ClineIgnoreController, LOCK_TEXT_SYMBOL } from "../ignore/ClineIgnoreController"

export const formatResponseAR = {
	duplicateFileReadNotice: () =>
		`[[ملاحظة] تمت إزالة قراءة هذا الملف لتوفير مساحة في نافذة السياق. راجع آخر قراءة للملف للحصول على أحدث إصدار من هذا الملف.]`,

	contextTruncationNotice: () =>
		`[ملاحظة] تمت إزالة بعض سجل المحادثة السابقة مع المستخدم للحفاظ على الطول الأمثل لنافذة السياق. تم الاحتفاظ بمهمة المستخدم الأولية وأحدث التبادلات للاستمرارية، بينما تمت إزالة سجل المحادثة الوسيط. يرجى أخذ ذلك في الاعتبار أثناء استمرارك في مساعدة المستخدم.`,

	condense: () =>
		`لقد قبل المستخدم ملخص المحادثة المكثف الذي أنشأته. يغطي هذا الملخص تفاصيل مهمة من المحادثة التاريخية مع المستخدم التي تم اختصارها.\n<explicit_instructions type="condense_response">من الضروري أن ترد فقط بسؤال المستخدم عما يجب أن تعمل عليه بعد ذلك. يجب ألا تأخذ أي مبادرة أو تضع أي افتراضات حول مواصلة العمل. على سبيل المثال، يجب ألا تقترح تغييرات في الملفات أو تحاول قراءة أي ملفات.\nعند سؤال المستخدم عما يجب أن تعمل عليه بعد ذلك، يمكنك الإشارة إلى المعلومات الموجودة في الملخص الذي تم إنشاؤه للتو. ومع ذلك، يجب ألا تشير إلى معلومات خارج ما هو موجود في الملخص لهذه الاستجابة. اجعل هذه الاستجابة موجزة.</explicit_instructions>`,

	toolDenied: () => `رفض المستخدم هذه العملية.`,

	toolError: (error?: string) => `فشل تنفيذ الأداة مع الخطأ التالي:\n<e>\n${error}\n</e>`,

	clineIgnoreError: (path: string) =>
		`تم حظر الوصول إلى ${path} بواسطة إعدادات ملف .clineignore. يجب أن تحاول الاستمرار في المهمة دون استخدام هذا الملف، أو اطلب من المستخدم تحديث ملف .clineignore.`,

	noToolsUsed: () =>
		`[خطأ] لم تستخدم أداة في ردك السابق! يرجى إعادة المحاولة باستخدام أداة.
		
${toolUseInstructionsReminder}

# الخطوات التالية

إذا أكملت مهمة المستخدم، استخدم أداة attempt_completion.
إذا كنت بحاجة إلى معلومات إضافية من المستخدم، استخدم أداة ask_followup_question.
وإلا، إذا لم تكمل المهمة ولا تحتاج إلى معلومات إضافية، فتابع الخطوة التالية من المهمة.
(هذه رسالة آلية، لذا لا ترد عليها بشكل محادثة.)`,

	tooManyMistakes: (feedback?: string) =>
		`يبدو أنك تواجه صعوبة في المتابعة. قدم المستخدم الملاحظات التالية لمساعدتك:\n<feedback>\n${feedback}\n</feedback>`,

	missingToolParameterError: (paramName: string) =>
		`قيمة مفقودة للمعلمة المطلوبة '${paramName}'. يرجى إعادة المحاولة مع استجابة كاملة.\n\n${toolUseInstructionsReminder}`,

	invalidMcpToolArgumentError: (serverName: string, toolName: string) =>
		`تم استخدام وسيطة JSON غير صالحة مع ${serverName} لـ ${toolName}. يرجى إعادة المحاولة بوسيطة JSON منسقة بشكل صحيح.`,

	toolResult: (text: string, images?: string[]): string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> => {
		if (images && images.length > 0) {
			const textBlock: Anthropic.TextBlockParam = { type: "text", text }
			const imageBlocks: Anthropic.ImageBlockParam[] = formatImagesIntoBlocks(images)
			// وضع الصور بعد النص يؤدي إلى نتائج أفضل
			return [textBlock, ...imageBlocks]
		} else {
			return text
		}
	},

	imageBlocks: (images?: string[]): Anthropic.ImageBlockParam[] => {
		return formatImagesIntoBlocks(images)
	},

	formatFilesList: (
		absolutePath: string,
		files: string[],
		didHitLimit: boolean,
		clineIgnoreController?: ClineIgnoreController,
	): string => {
		const sorted = files
			.map((file) => {
				// تحويل المسار المطلق إلى مسار نسبي
				const relativePath = path.relative(absolutePath, file).toPosix()
				return file.endsWith("/") ? relativePath + "/" : relativePath
			})
			// ترتيب الملفات بحيث يتم سرد الملفات تحت الدلائل الخاصة بها لتوضيح أي الملفات هي أبناء أي الدلائل
			.sort((a, b) => {
				const aParts = a.split("/") // يعمل فقط إذا استخدمنا toPosix أولاً
				const bParts = b.split("/")
				for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
					if (aParts[i] !== bParts[i]) {
						// إذا كان أحدهما دليلاً والآخر ليس كذلك في هذا المستوى، فقم بترتيب الدليل أولاً
						if (i + 1 === aParts.length && i + 1 < bParts.length) {
							return -1
						}
						if (i + 1 === bParts.length && i + 1 < aParts.length) {
							return 1
						}
						// وإلا، قم بالترتيب أبجدياً
						return aParts[i].localeCompare(bParts[i], undefined, {
							numeric: true,
							sensitivity: "base",
						})
					}
				}
				// إذا كانت جميع الأجزاء متطابقة حتى طول المسار الأقصر،
				// فإن الأقصر يأتي أولاً
				return aParts.length - bParts.length
			})

		const clineIgnoreParsed = clineIgnoreController
			? sorted.map((filePath) => {
					// المسار نسبي إلى المسار المطلق، وليس cwd
					// validateAccess يتوقع إما مسارًا نسبيًا إلى cwd أو مسارًا مطلقًا
					const absoluteFilePath = path.resolve(absolutePath, filePath)
					const isIgnored = !clineIgnoreController.validateAccess(absoluteFilePath)
					if (isIgnored) {
						return LOCK_TEXT_SYMBOL + " " + filePath
					}

					return filePath
				})
			: sorted

		if (didHitLimit) {
			return `${clineIgnoreParsed.join(
				"\n",
			)}\n\n(تم اقتطاع قائمة الملفات. استخدم list_files على الدلائل الفرعية المحددة إذا كنت بحاجة إلى استكشاف المزيد.)`
		} else if (clineIgnoreParsed.length === 0 || (clineIgnoreParsed.length === 1 && clineIgnoreParsed[0] === "")) {
			return "لم يتم العثور على ملفات."
		} else {
			return clineIgnoreParsed.join("\n")
		}
	},

	createPrettyPatch: (filename = "file", oldStr?: string, newStr?: string) => {
		// لا يمكن أن تكون السلاسل غير محددة أو يلقي diff استثناءً
		const patch = diff.createPatch(filename.toPosix(), oldStr || "", newStr || "")
		const lines = patch.split("\n")
		const prettyPatchLines = lines.slice(4)
		return prettyPatchLines.join("\n")
	},

	taskResumption: (
		mode: "plan" | "act",
		agoText: string,
		cwd: string,
		wasRecent: boolean | 0 | undefined,
		responseText?: string,
	): [string, string] => {
		const taskResumptionMessage = `[استئناف المهمة] ${
			mode === "plan"
				? `تم مقاطعة هذه المهمة ${agoText}. قد تكون المحادثة غير مكتملة. كن على علم بأن حالة المشروع قد تكون تغيرت منذ ذلك الحين. دليل العمل الحالي هو '${cwd.toPosix()}'.\n\nملاحظة: إذا حاولت سابقًا استخدام أداة لم يقدم المستخدم نتيجة لها، فيجب أن تفترض أن استخدام الأداة لم ينجح. ومع ذلك، أنت في وضع التخطيط، لذا بدلاً من مواصلة المهمة، يجب عليك الرد على رسالة المستخدم.`
				: `تم مقاطعة هذه المهمة ${agoText}. قد تكون مكتملة أو غير مكتملة، لذا يرجى إعادة تقييم سياق المهمة. كن على علم بأن حالة المشروع قد تكون تغيرت منذ ذلك الحين. دليل العمل الحالي هو '${cwd.toPosix()}'. إذا لم تكتمل المهمة، أعد محاولة الخطوة الأخيرة قبل المقاطعة وتابع إكمال المهمة.\n\nملاحظة: إذا حاولت سابقًا استخدام أداة لم يقدم المستخدم نتيجة لها، فيجب أن تفترض أن استخدام الأداة لم ينجح وتقييم ما إذا كان يجب عليك إعادة المحاولة. إذا كانت الأداة الأخيرة هي browser_action، فقد تم إغلاق المتصفح ويجب عليك تشغيل متصفح جديد إذا لزم الأمر.`
		}${
			wasRecent
				? "\n\nهام: إذا كان آخر استخدام للأداة هو replace_in_file أو write_to_file تمت مقاطعته، فقد تمت إعادة الملف إلى حالته الأصلية قبل التعديل المقاطع، ولا تحتاج إلى إعادة قراءة الملف لأنك تمتلك بالفعل محتوياته المحدثة."
				: ""
		}`

		const userResponseMessage = `${
			responseText
				? `${mode === "plan" ? "رسالة جديدة للرد عليها باستخدام أداة plan_mode_respond (تأكد من تقديم ردك في معلمة <response>)" : "تعليمات جديدة لمواصلة المهمة"}:\n<user_message>\n${responseText}\n</user_message>`
				: mode === "plan"
					? "(لم يقدم المستخدم رسالة جديدة. فكر في سؤالهم عن كيفية رغبتهم في المتابعة، أو اقترح عليهم التبديل إلى وضع التنفيذ لمواصلة المهمة.)"
					: ""
		}`

		return [taskResumptionMessage, userResponseMessage]
	},

	planModeInstructions: () => {
		return `في هذا الوضع يجب أن تركز على جمع المعلومات وطرح الأسئلة وتصميم حل. بمجرد أن يكون لديك خطة، استخدم أداة plan_mode_respond للمشاركة في تبادل محادثة مع المستخدم. لا تستخدم أداة plan_mode_respond حتى تجمع كل المعلومات التي تحتاجها، على سبيل المثال باستخدام read_file أو ask_followup_question.
(تذكر: إذا بدا أن المستخدم يريد منك استخدام أدوات متاحة فقط في وضع التنفيذ، فيجب أن تطلب من المستخدم "التبديل إلى وضع التنفيذ" (استخدم هذه الكلمات) - سيتعين عليهم القيام بذلك يدويًا باستخدام زر التبديل بين التخطيط/التنفيذ أدناه. ليس لديك القدرة على التبديل إلى وضع التنفيذ بنفسك، ويجب أن تنتظر حتى يقوم المستخدم بذلك بنفسه بمجرد أن يكون راضيًا عن الخطة. كما لا يمكنك تقديم خيار للتبديل إلى وضع التنفيذ، حيث سيكون هذا شيئًا تحتاج إلى توجيه المستخدم للقيام به يدويًا بنفسه.)`
	},

	fileEditWithUserChanges: (
		relPath: string,
		userEdits: string,
		autoFormattingEdits: string | undefined,
		finalContent: string | undefined,
		newProblemsMessage: string | undefined,
	) =>
		`قام المستخدم بإجراء التحديثات التالية على المحتوى الخاص بك:\n\n${userEdits}\n\n` +
		(autoFormattingEdits
			? `كما طبق محرر المستخدم التنسيق التلقائي التالي على المحتوى الخاص بك:\n\n${autoFormattingEdits}\n\n(ملاحظة: انتبه جيدًا للتغييرات مثل تحويل علامات الاقتباس الفردية إلى علامات اقتباس مزدوجة، وإزالة أو إضافة الفواصل المنقوطة، وتقسيم الأسطر الطويلة إلى أسطر متعددة، وتعديل نمط المسافات البادئة، وإضافة/إزالة الفواصل النهائية، إلخ. سيساعدك هذا على ضمان دقة عمليات البحث/الاستبدال المستقبلية لهذا الملف.)\n\n`
			: "") +
		`تم حفظ المحتوى المحدث، الذي يتضمن كلاً من تعديلاتك الأصلية والتعديلات الإضافية، بنجاح في ${relPath.toPosix()}. إليك المحتوى الكامل والمحدث للملف الذي تم حفظه:\n\n` +
		`<final_file_content path="${relPath.toPosix()}">\n${finalContent}\n</final_file_content>\n\n` +
		`يرجى ملاحظة:\n` +
		`1. لا تحتاج إلى إعادة كتابة الملف بهذه التغييرات، حيث تم تطبيقها بالفعل.\n` +
		`2. تابع المهمة باستخدام محتوى الملف المحدث هذا كخط أساس جديد.\n` +
		`3. إذا كانت تعديلات المستخدم قد عالجت جزءًا من المهمة أو غيرت المتطلبات، فقم بتعديل نهجك وفقًا لذلك.` +
		`4. هام: لأي تغييرات مستقبلية على هذا الملف، استخدم محتوى final_file_content الموضح أعلاه كمرجع لك. يعكس هذا المحتوى الحالة الحالية للملف، بما في ذلك كل من تعديلات المستخدم وأي تنسيق تلقائي (على سبيل المثال، إذا كنت تستخدم علامات اقتباس فردية ولكن المنسق حولها إلى علامات اقتباس مزدوجة). قم دائمًا بإسناد عمليات البحث/الاستبدال على هذا الإصدار النهائي لضمان الدقة.\n` +
		`${newProblemsMessage}`,

	fileEditWithoutUserChanges: (
		relPath: string,
		autoFormattingEdits: string | undefined,
		finalContent: string | undefined,
		newProblemsMessage: string | undefined,
	) =>
		`تم حفظ المحتوى بنجاح في ${relPath.toPosix()}.\n\n` +
		(autoFormattingEdits
			? `إلى جانب تعديلاتك، طبق محرر المستخدم التنسيق التلقائي التالي على المحتوى الخاص بك:\n\n${autoFormattingEdits}\n\n(ملاحظة: انتبه جيدًا للتغييرات مثل تحويل علامات الاقتباس الفردية إلى علامات اقتباس مزدوجة، وإزالة أو إضافة الفواصل المنقوطة، وتقسيم الأسطر الطويلة إلى أسطر متعددة، وتعديل نمط المسافات البادئة، وإضافة/إزالة الفواصل النهائية، إلخ. سيساعدك هذا على ضمان دقة عمليات البحث/الاستبدال المستقبلية لهذا الملف.)\n\n`
			: "") +
		`إليك المحتوى الكامل والمحدث للملف الذي تم حفظه:\n\n` +
		`<final_file_content path="${relPath.toPosix()}">\n${finalContent}\n</final_file_content>\n\n` +
		`هام: لأي تغييرات مستقبلية على هذا الملف، استخدم محتوى final_file_content الموضح أعلاه كمرجع لك. يعكس هذا المحتوى الحالة الحالية للملف، بما في ذلك أي تنسيق تلقائي (على سبيل المثال، إذا كنت تستخدم علامات اقتباس فردية ولكن المنسق حولها إلى علامات اقتباس مزدوجة). قم دائمًا بإسناد عمليات البحث/الاستبدال على هذا الإصدار النهائي لضمان الدقة.\n\n` +
		`${newProblemsMessage}`,

	diffError: (relPath: string, originalContent: string | undefined) =>
		`من المحتمل أن يكون هذا لأن محتوى كتلة البحث لا يتطابق تمامًا مع ما هو موجود في الملف، أو إذا كنت تستخدم كتل بحث/استبدال متعددة، فقد لا تكون بالترتيب الذي تظهر به في الملف.\n\n` +
		`تمت إعادة الملف إلى حالته الأصلية:\n\n` +
		`<file_content path="${relPath.toPosix()}">\n${originalContent}\n</file_content>\n\n` +
		`الآن بعد أن لديك أحدث حالة للملف، حاول العملية مرة أخرى بكتل بحث أقل وأكثر دقة. بالنسبة للملفات الكبيرة بشكل خاص، قد يكون من الحكمة محاولة تقييد نفسك إلى <5 كتل بحث/استبدال في المرة الواحدة، ثم انتظر حتى يرد المستخدم بنتيجة العملية قبل المتابعة باستدعاء replace_in_file آخر لإجراء تعديلات إضافية.\n(إذا واجهت هذا الخطأ 3 مرات متتالية، يمكنك استخدام أداة write_to_file كحل بديل.)`,

	toolAlreadyUsed: (toolName: string) =>
		`لم يتم تنفيذ الأداة [${toolName}] لأنه تم استخدام أداة بالفعل في هذه الرسالة. يمكن استخدام أداة واحدة فقط لكل رسالة. يجب عليك تقييم نتيجة الأداة الأولى قبل المتابعة لاستخدام الأداة التالية.`,

	clineIgnoreInstructions: (content: string) =>
		`# .clineignore\n\n(يتم توفير ما يلي بواسطة ملف .clineignore على مستوى الجذر حيث حدد المستخدم الملفات والدلائل التي لا ينبغي الوصول إليها. عند استخدام list_files، ستلاحظ ${LOCK_TEXT_SYMBOL} بجانب الملفات المحظورة. ستؤدي محاولة الوصول إلى محتويات الملف، على سبيل المثال من خلال read_file، إلى حدوث خطأ.)\n\n${content}\n.clineignore`,

	clineRulesGlobalDirectoryInstructions: (globalClineRulesFilePath: string, content: string) =>
		`# .clinerules/\n\nيتم توفير ما يلي بواسطة دليل .clinerules/ عالمي، يقع في ${globalClineRulesFilePath.toPosix()}، حيث حدد المستخدم تعليمات لجميع دلائل العمل:\n\n${content}`,

	clineRulesLocalDirectoryInstructions: (cwd: string, content: string) =>
		`# .clinerules/\n\nيتم توفير ما يلي بواسطة دليل .clinerules/ على مستوى الجذر حيث حدد المستخدم تعليمات لدليل العمل هذا (${cwd.toPosix()})\n\n${content}`,

	clineRulesLocalFileInstructions: (cwd: string, content: string) =>
		`# .clinerules\n\nيتم توفير ما يلي بواسطة ملف .clinerules على مستوى الجذر حيث حدد المستخدم تعليمات لدليل العمل هذا (${cwd.toPosix()})\n\n${content}`,

	windsurfRulesLocalFileInstructions: (cwd: string, content: string) =>
		`# .windsurfrules\n\nيتم توفير ما يلي بواسطة ملف .windsurfrules على مستوى الجذر حيث حدد المستخدم تعليمات لدليل العمل هذا (${cwd.toPosix()})\n\n${content}`,

	cursorRulesLocalFileInstructions: (cwd: string, content: string) =>
		`# .cursorrules\n\nيتم توفير ما يلي بواسطة ملف .cursorrules على مستوى الجذر حيث حدد المستخدم تعليمات لدليل العمل هذا (${cwd.toPosix()})\n\n${content}`,

	cursorRulesLocalDirectoryInstructions: (cwd: string, content: string) =>
		`# .cursor/rules\n\nيتم توفير ما يلي بواسطة دليل .cursor/rules على مستوى الجذر حيث حدد المستخدم تعليمات لدليل العمل هذا (${cwd.toPosix()})\n\n${content}`,
}

// لتجنب التبعية الدائرية
const formatImagesIntoBlocks = (images?: string[]): Anthropic.ImageBlockParam[] => {
	return images
		? images.map((dataUrl) => {
				// data:image/png;base64,base64string
				const [rest, base64] = dataUrl.split(",")
				const mimeType = rest.split(":")[1].split(";")[0]
				return {
					type: "image",
					source: {
						type: "base64",
						media_type: mimeType,
						data: base64,
					},
				} as Anthropic.ImageBlockParam
			})
		: []
}

const toolUseInstructionsReminder = `# تذكير: تعليمات استخدام الأداة

يتم تنسيق استخدامات الأداة باستخدام علامات بنمط XML. يتم تضمين اسم الأداة في علامات الفتح والإغلاق، وكل معلمة مضمنة بالمثل داخل مجموعتها الخاصة من العلامات. إليك الهيكل:

<tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</tool_name>

على سبيل المثال:

<attempt_completion>
<r>
لقد أكملت المهمة...
</r>
</attempt_completion>

التزم دائمًا بهذا التنسيق لجميع استخدامات الأداة لضمان التحليل والتنفيذ المناسبين.`
