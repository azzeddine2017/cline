import { en } from "./en"
import { ar } from "./ar"
import { LanguageKey } from "@shared/Languages"

// Define the translations object with all supported languages
export const translations = {
	en,
	ar,
}

// Define the type for translation keys based on the English translations
export type TranslationKey = keyof typeof en

// Define the supported languages
export type SupportedLanguageKey = "en" | "ar"

// Get a translation for a specific key and language
export function getTranslation(key: TranslationKey, language: LanguageKey = "en"): string {
	// Convert language to supported language or fall back to English
	const supportedLang = language in translations ? (language as SupportedLanguageKey) : "en"

	// If the key doesn't exist in the specified language, fall back to English
	return translations[supportedLang][key] || translations.en[key] || key
}
