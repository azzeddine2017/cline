import { en } from './en';
import { ar } from './ar';
import { LanguageKey } from '@shared/Languages';

// Define the translations object with all supported languages
export const translations = {
  en,
  ar,
};

// Define the type for translation keys based on the English translations
export type TranslationKey = keyof typeof en;

// Get a translation for a specific key and language
export function getTranslation(key: TranslationKey, language: LanguageKey = 'en'): string {
  // If the language is not supported, fall back to English
  if (!translations[language]) {
    return translations.en[key] || key;
  }
  
  // If the key doesn't exist in the specified language, fall back to English
  return translations[language][key] || translations.en[key] || key;
}
