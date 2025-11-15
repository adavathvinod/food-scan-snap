import { useState, useEffect } from 'react';
import { translateText, getUserLanguage } from '@/lib/translation';

interface TranslationCache {
  [key: string]: {
    [language: string]: string;
  };
}

const translationCache: TranslationCache = {};

export const useTranslation = () => {
  const [language, setLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      const userLang = await getUserLanguage();
      setLanguage(userLang);
      setIsLoading(false);
    };
    loadLanguage();
  }, []);

  const t = async (text: string): Promise<string> => {
    if (language === 'en' || !text) return text;

    // Check cache first
    if (translationCache[text]?.[language]) {
      return translationCache[text][language];
    }

    // Translate and cache
    const translated = await translateText(text, language);
    
    if (!translationCache[text]) {
      translationCache[text] = {};
    }
    translationCache[text][language] = translated;

    return translated;
  };

  const tSync = (text: string): string => {
    if (language === 'en' || !text) return text;
    return translationCache[text]?.[language] || text;
  };

  return { t, tSync, language, isLoading };
};

export const useTranslatedText = (text: string) => {
  const [translatedText, setTranslatedText] = useState(text);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (language === 'en') {
      setTranslatedText(text);
      return;
    }

    const translate = async () => {
      const result = await t(text);
      setTranslatedText(result);
    };
    translate();
  }, [text, language, t]);

  return translatedText;
};
