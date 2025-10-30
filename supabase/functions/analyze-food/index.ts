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

    console.log("Step 1: Validating image and identifying food with Gemini AI...");

    // Step 1: Validate image and identify food items with Indian food support
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
                text: `First, check if this image contains food. If not food (e.g., shoes, random objects, blurry images), respond with: "NOT_FOOD"

If it is food, identify ALL items visible in the image. Be especially accurate with Indian foods like:
- Breads: roti, chapati, paratha, naan, puri (🫓)
- Rice dishes: plain rice, biryani, pulao, curd rice (🍚)
- Curries: dal, sambar, paneer curry, chicken curry, mutton curry, fish curry (🍛)
- Vegetables: aloo (potato), bhindi (okra), palak (spinach), etc. (🥬)
- Desserts: any sweet items (🍨)
- Drinks: beverages (🥤)

For each item detected, provide:
1. Item name (be specific, e.g., "chicken biryani" not just "biryani")
2. Category icon (one of: 🫓 🍚 🍛 🥬 🍨 🥤)
3. Brief description

Format your response as JSON:
{
  "valid": true/false,
  "items": [
    {"name": "item name", "icon": "🫓", "description": "brief description"}
  ]
}

If multiple items, list them all. If single item, still use array format.`
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
    let identifyContent = identifyData.choices[0]?.message?.content?.trim() || "";
    
    // Handle validation
    if (identifyContent === "NOT_FOOD" || identifyContent.includes("NOT_FOOD")) {
      throw new Error("⚠️ We couldn't detect food in this image. Please upload a clear photo of your meal.");
    }

    // Parse JSON response
    let foodItems;
    try {
      // Extract JSON if wrapped in markdown code blocks
      if (identifyContent.includes("```json")) {
        identifyContent = identifyContent.split("```json")[1].split("```")[0].trim();
      } else if (identifyContent.includes("```")) {
        identifyContent = identifyContent.split("```")[1].split("```")[0].trim();
      }
      
      const parsed = JSON.parse(identifyContent);
      if (!parsed.valid) {
        throw new Error("⚠️ We couldn't detect food in this image. Please upload a clear photo of your meal.");
      }
      foodItems = parsed.items || [];
    } catch (e) {
      console.error("Failed to parse food items:", e);
      // Fallback: treat as single item
      foodItems = [{ name: identifyContent, icon: "🍽️", description: "" }];
    }

    if (!foodItems || foodItems.length === 0) {
      throw new Error("Could not identify food in image");
    }

    console.log("Identified food items:", foodItems.length);
    console.log("Step 2: Fetching nutrition data from CalorieNinjas for all items...");

    // Step 2: Get nutrition data for each item from CalorieNinjas
    const nutritionPromises = foodItems.map(async (item: any) => {
      const nutritionResponse = await fetch(
        `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(item.name)}`,
        {
          headers: {
            "X-Api-Key": CALORIENINJAS_API_KEY,
          },
        }
      );

      if (!nutritionResponse.ok) {
        console.error(`Failed to fetch nutrition for ${item.name}`);
        return null;
      }

      const nutritionData = await nutritionResponse.json();
      
      if (!nutritionData.items || nutritionData.items.length === 0) {
        console.error(`No nutrition data found for ${item.name}`);
        return null;
      }

      const nutrition = nutritionData.items[0];
      return {
        name: item.name,
        icon: item.icon,
        description: item.description,
        calories: Math.round(nutrition.calories || 0),
        protein: Math.round(nutrition.protein_g * 10) / 10 || 0,
        fat: Math.round(nutrition.fat_total_g * 10) / 10 || 0,
        carbs: Math.round(nutrition.carbohydrates_total_g * 10) / 10 || 0,
        fiber: Math.round(nutrition.fiber_g * 10) / 10 || 0,
      };
    });

    const itemsWithNutrition = (await Promise.all(nutritionPromises)).filter(item => item !== null);
    
    if (itemsWithNutrition.length === 0) {
      throw new Error("Could not fetch nutrition data for any items");
    }

    // Calculate totals
    const totals = itemsWithNutrition.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
      fiber: acc.fiber + item.fiber,
    }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });
    
    console.log("Nutrition data received for all items");
    console.log("Step 3: Generating health tip with Gemini AI...");

    // Step 3: Generate health tip and advice using Gemini AI
    const itemsList = itemsWithNutrition.map(item => item.name).join(", ");
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
            content: `Generate a brief, friendly health tip about this meal: ${itemsList}. 

Total nutrition: ${totals.calories} cal, ${totals.protein}g protein, ${totals.fat}g fat, ${totals.carbs}g carbs, ${totals.fiber}g fiber.

Provide:
1. A health tip (under 50 words)
2. Quick advice like "High oil — reduce portion" or "Good protein source" (under 10 words)

Format as JSON: {"tip": "...", "advice": "..."}`
          }
        ]
      })
    });

    if (!tipResponse.ok) {
      throw new Error("Failed to generate health tip");
    }

    const tipData = await tipResponse.json();
    let tipContent = tipData.choices[0]?.message?.content?.trim() || "{}";
    
    // Parse tip response
    let healthTip = "Enjoy this food as part of a balanced diet!";
    let quickAdvice = "Balanced meal";
    
    try {
      if (tipContent.includes("```json")) {
        tipContent = tipContent.split("```json")[1].split("```")[0].trim();
      } else if (tipContent.includes("```")) {
        tipContent = tipContent.split("```")[1].split("```")[0].trim();
      }
      
      const tipParsed = JSON.parse(tipContent);
      healthTip = tipParsed.tip || healthTip;
      quickAdvice = tipParsed.advice || quickAdvice;
    } catch (e) {
      console.error("Failed to parse tip:", e);
      healthTip = tipContent || healthTip;
    }

    console.log("Health tip generated successfully");

    // Return combined results
    const result = {
      foodName: itemsWithNutrition.length === 1 ? itemsWithNutrition[0].name : `${itemsWithNutrition.length} items`,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
      healthTip: healthTip,
      quickAdvice: quickAdvice,
      items: itemsWithNutrition,
      isMultiItem: itemsWithNutrition.length > 1,
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
