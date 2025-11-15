const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, texts, targetLanguage, batch } = await req.json();

    if ((!text && !texts) || !targetLanguage) {
      throw new Error("Text/texts and target language are required");
    }

    // Handle batch translation
    if (batch && texts && Array.isArray(texts)) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("API key not configured");
      }

      const languageNames: Record<string, string> = {
        'en': 'English',
        'te': 'Telugu',
        'hi': 'Hindi',
        'ta': 'Tamil',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'bn': 'Bengali',
        'mr': 'Marathi',
        'gu': 'Gujarati',
        'pa': 'Punjabi'
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;
      
      // Join all texts with a separator and translate at once
      const combinedText = texts.join('\n---SEPARATOR---\n');

      const translateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `Translate the following texts to ${targetLangName}. Maintain the tone and meaning. Keep the separator '---SEPARATOR---' as is. Only return the translated texts separated by ---SEPARATOR---, nothing else.

Texts: ${combinedText}`
            }
          ]
        })
      });

      if (!translateResponse.ok) {
        throw new Error("Failed to translate texts");
      }

      const translateData = await translateResponse.json();
      const translatedCombined = translateData.choices[0]?.message?.content?.trim() || combinedText;
      const translatedTexts = translatedCombined.split('---SEPARATOR---').map((t: string) => t.trim());

      return new Response(JSON.stringify({ translatedTexts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("API key not configured");
    }

    const languageNames: Record<string, string> = {
      'en': 'English',
      'te': 'Telugu',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'pa': 'Punjabi'
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    console.log(`Translating to ${targetLangName}...`);

    const translateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `Translate the following text to ${targetLangName}. Maintain the tone and meaning. Only return the translated text, nothing else.

Text: ${text}`
          }
        ]
      })
    });

    if (!translateResponse.ok) {
      if (translateResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (translateResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error("Failed to translate text");
    }

    const translateData = await translateResponse.json();
    const translatedText = translateData.choices[0]?.message?.content?.trim() || text;

    console.log("Translation completed");

    return new Response(JSON.stringify({ translatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in translate-text function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to translate text" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
