import { supabase } from "@/integrations/supabase/client";

export const translateText = async (text: string, targetLanguage?: string): Promise<string> => {
  try {
    // Get user's preferred language if not specified
    let language = targetLanguage;
    
    if (!language) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", user.id)
          .single();
        
        language = profile?.preferred_language || 'en';
      } else {
        language = 'en';
      }
    }

    // If already in English or no translation needed
    if (language === 'en' || !text) {
      return text;
    }

    // Call translation edge function
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text, targetLanguage: language }
    });

    if (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }

    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
};

export const translateMultipleTexts = async (
  texts: string[], 
  targetLanguage?: string
): Promise<string[]> => {
  try {
    const translations = await Promise.all(
      texts.map(text => translateText(text, targetLanguage))
    );
    return translations;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts;
  }
};

export const getUserLanguage = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'en';

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .single();

    return profile?.preferred_language || 'en';
  } catch (error) {
    console.error('Failed to get user language:', error);
    return 'en';
  }
};
