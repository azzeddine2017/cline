import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageKey, DEFAULT_LANGUAGE_SETTINGS } from '@shared/Languages';
import { getTranslation, TranslationKey } from '../locales';
import { useExtensionState } from './ExtensionStateContext';

// Define the context type
interface TranslationContextType {
  language: LanguageKey;
  setLanguage: (language: LanguageKey) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

// Create the context with default values
const TranslationContext = createContext<TranslationContextType>({
  language: DEFAULT_LANGUAGE_SETTINGS,
  setLanguage: () => {},
  t: (key) => key,
  isRtl: false,
});

// Create a provider component
interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { chatSettings } = useExtensionState();
  const [language, setLanguageState] = useState<LanguageKey>(DEFAULT_LANGUAGE_SETTINGS);
  
  // RTL languages
  const rtlLanguages: LanguageKey[] = ['ar'];
  const isRtl = rtlLanguages.includes(language);
  
  // Update language when chatSettings change
  useEffect(() => {
    if (chatSettings?.preferredLanguage) {
      // Convert from display name to language key if needed
      // This is simplified - you might need more logic based on how your app stores language preferences
      const languageKey = chatSettings.preferredLanguage.startsWith('Arabic') 
        ? 'ar' 
        : 'en';
      
      setLanguageState(languageKey);
      
      // Set document direction for RTL support
      document.documentElement.dir = rtlLanguages.includes(languageKey) ? 'rtl' : 'ltr';
    }
  }, [chatSettings?.preferredLanguage]);
  
  // Translation function
  const t = (key: TranslationKey): string => {
    return getTranslation(key, language);
  };
  
  // Set language function
  const setLanguage = (newLanguage: LanguageKey) => {
    setLanguageState(newLanguage);
    document.documentElement.dir = rtlLanguages.includes(newLanguage) ? 'rtl' : 'ltr';
  };
  
  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use the translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
