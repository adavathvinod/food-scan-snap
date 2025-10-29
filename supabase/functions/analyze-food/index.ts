const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const CALORIENINJAS_API_KEY = Deno.env.get("CALORIENINJAS_API_KEY");

    if (!LOVABLE_API_KEY || !CALORIENINJAS_API_KEY) {
      throw new Error("API keys not configured");
    }

    console.log("Step 1: Identifying food with Gemini AI...");

    // Step 1: Use Gemini AI to identify the food
    const identifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: [
              {
                type: "text",
                text: "Identify this food item. Return ONLY the food name, nothing else. Be specific but concise (e.g., 'apple', 'grilled chicken breast', 'chocolate chip cookie')."
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      })
    });

    if (!identifyResponse.ok) {
      if (identifyResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (identifyResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error("Failed to identify food");
    }

    const identifyData = await identifyResponse.json();
    const foodName = identifyData.choices[0]?.message?.content?.trim() || "";
    
    if (!foodName) {
      throw new Error("Could not identify food in image");
    }

    console.log("Identified food:", foodName);
    console.log("Step 2: Fetching nutrition data from CalorieNinjas...");

    // Step 2: Get nutrition data from CalorieNinjas
    const nutritionResponse = await fetch(
      `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(foodName)}`,
      {
        headers: {
          "X-Api-Key": CALORIENINJAS_API_KEY,
        },
      }
    );

    if (!nutritionResponse.ok) {
      throw new Error("Failed to fetch nutrition data");
    }

    const nutritionData = await nutritionResponse.json();
    
    if (!nutritionData.items || nutritionData.items.length === 0) {
      throw new Error("No nutrition data found for this food");
    }

    const nutrition = nutritionData.items[0];
    
    console.log("Nutrition data received");
    console.log("Step 3: Generating health tip with Gemini AI...");

    // Step 3: Generate health tip using Gemini AI
    const tipResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Generate a brief, friendly health tip about ${foodName}. Focus on nutritional benefits, portion control, or healthy preparation methods. Keep it under 50 words and make it encouraging and practical.`
          }
        ]
      })
    });

    if (!tipResponse.ok) {
      throw new Error("Failed to generate health tip");
    }

    const tipData = await tipResponse.json();
    const healthTip = tipData.choices[0]?.message?.content?.trim() || "Enjoy this food as part of a balanced diet!";

    console.log("Health tip generated successfully");

    // Return combined results
    const result = {
      foodName: foodName,
      calories: Math.round(nutrition.calories || 0),
      protein: Math.round(nutrition.protein_g * 10) / 10 || 0,
      fat: Math.round(nutrition.fat_total_g * 10) / 10 || 0,
      carbs: Math.round(nutrition.carbohydrates_total_g * 10) / 10 || 0,
      healthTip: healthTip,
    };

    console.log("Analysis complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-food function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to analyze food" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
