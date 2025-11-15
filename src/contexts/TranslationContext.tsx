import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserLanguage, translateText } from '@/lib/translation';

interface TranslationContextType {
  language: string;
  t: (text: string) => Promise<string>;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      const userLang = await getUserLanguage();
      setLanguage(userLang);
      setIsLoading(false);
    };
    loadLanguage();
    
    // Listen for language changes
    const interval = setInterval(async () => {
      const userLang = await getUserLanguage();
      if (userLang !== language) {
        setLanguage(userLang);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [language]);

  const t = async (text: string): Promise<string> => {
    if (language === 'en' || !text) return text;
    return await translateText(text, language);
  };

  return (
    <TranslationContext.Provider value={{ language, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};
