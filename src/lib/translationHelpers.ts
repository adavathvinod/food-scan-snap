import { translateText } from './translation';
import { toast } from 'sonner';

/**
 * Show a translated toast message
 */
export const showTranslatedToast = async (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const translated = await translateText(message);
  
  switch (type) {
    case 'success':
      toast.success(translated);
      break;
    case 'error':
      toast.error(translated);
      break;
    default:
      toast(translated);
  }
};

/**
 * Get translated text synchronously from cache or return original
 */
export const getTranslatedOrOriginal = (text: string, cache: Map<string, string>): string => {
  return cache.get(text) || text;
};

/**
 * Batch translate multiple strings and return a map
 */
export const batchTranslate = async (texts: string[]): Promise<Map<string, string>> => {
  const cache = new Map<string, string>();
  
  try {
    const translations = await Promise.all(
      texts.map(async (text) => {
        const translated = await translateText(text);
        return { original: text, translated };
      })
    );

    translations.forEach(({ original, translated }) => {
      cache.set(original, translated);
    });
  } catch (error) {
    console.error('Batch translation failed:', error);
  }

  return cache;
};
