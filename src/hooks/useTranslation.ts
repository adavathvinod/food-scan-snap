import { useState, useEffect } from 'react';
import { translateText, getUserLanguage } from '@/lib/translation';

interface Translations {
  [key: string]: string;
}

export const useTranslation = (keys: string[]) => {
  const [translations, setTranslations] = useState<Translations>({});
  const [language, setLanguage] = useState<string>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const lang = await getUserLanguage();
        setLanguage(lang);

        if (lang === 'en') {
          // No translation needed
          const englishTranslations: Translations = {};
          keys.forEach(key => {
            englishTranslations[key] = key;
          });
          setTranslations(englishTranslations);
          setLoading(false);
          return;
        }

        // Translate all keys
        const translatedTexts = await Promise.all(
          keys.map(key => translateText(key, lang))
        );

        const newTranslations: Translations = {};
        keys.forEach((key, index) => {
          newTranslations[key] = translatedTexts[index];
        });

        setTranslations(newTranslations);
      } catch (error) {
        console.error('Translation error:', error);
        // Fallback to original text
        const fallback: Translations = {};
        keys.forEach(key => {
          fallback[key] = key;
        });
        setTranslations(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, []);

  const t = (key: string) => translations[key] || key;

  return { t, loading, language };
};
