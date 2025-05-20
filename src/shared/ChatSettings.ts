export type OpenAIReasoningEffort = "low" | "medium" | "high"

export interface ChatSettings {
	mode: "plan" | "act"
	preferredLanguage?: string
	openAIReasoningEffort?: OpenAIReasoningEffort
}

export type PartialChatSettings = Partial<ChatSettings>

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
	mode: "act",
	preferredLanguage: "English", // Default language is English, can be changed to "Arabic - العربية" for Arabic
	openAIReasoningEffort: "medium",
}
