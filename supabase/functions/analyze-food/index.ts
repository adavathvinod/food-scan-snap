import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image } = await req.json();
    
    // Input validation
    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid image data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Check image size (base64 string length, ~5MB limit)
    if (image.length > 7000000) {
      return new Response(JSON.stringify({ error: "Image too large. Maximum 5MB allowed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!image) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const CALORIENINJAS_API_KEY = Deno.env.get("CALORIENINJAS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY || !CALORIENINJAS_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Required environment variables not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    console.log("Step 2: Checking custom Indian food database, CalorieNinjas, then AI estimation...");

    // Helper function to search custom Indian food database
    const searchIndianFoodDatabase = async (foodName: string) => {
      const lowerName = foodName.toLowerCase();
      console.log(`Searching Indian food database for: ${foodName}`);
      
      // Try exact match first
      const { data: exactMatch, error: exactError } = await supabase
        .from('indian_food_nutrition')
        .select('*')
        .ilike('food_name', lowerName)
        .maybeSingle();
      
      if (!exactError && exactMatch) {
        console.log(`Found exact match in Indian food database: ${exactMatch.food_name}`);
        return {
          calories: exactMatch.calories,
          protein_g: exactMatch.protein_g,
          fat_total_g: exactMatch.fat_g,
          carbohydrates_total_g: exactMatch.carbs_g,
          fiber_g: exactMatch.fiber_g,
          source: 'indian_database',
          serving_size: exactMatch.serving_size
        };
      }
      
      // Try alternative names
      const { data: altMatches, error: altError } = await supabase
        .from('indian_food_nutrition')
        .select('*')
        .contains('alternative_names', [lowerName]);
      
      if (!altError && altMatches && altMatches.length > 0) {
        const match = altMatches[0];
        console.log(`Found alternative name match in Indian food database: ${match.food_name}`);
        return {
          calories: match.calories,
          protein_g: match.protein_g,
          fat_total_g: match.fat_g,
          carbohydrates_total_g: match.carbs_g,
          fiber_g: match.fiber_g,
          source: 'indian_database',
          serving_size: match.serving_size
        };
      }
      
      // Try partial match
      const { data: partialMatches, error: partialError } = await supabase
        .from('indian_food_nutrition')
        .select('*')
        .or(`food_name.ilike.%${lowerName}%,alternative_names.cs.{${lowerName}}`);
      
      if (!partialError && partialMatches && partialMatches.length > 0) {
        const match = partialMatches[0];
        console.log(`Found partial match in Indian food database: ${match.food_name}`);
        return {
          calories: match.calories,
          protein_g: match.protein_g,
          fat_total_g: match.fat_g,
          carbohydrates_total_g: match.carbs_g,
          fiber_g: match.fiber_g,
          source: 'indian_database',
          serving_size: match.serving_size
        };
      }
      
      return null;
    };

    // Helper function to estimate nutrition with AI when all else fails
    const estimateNutritionWithAI = async (foodName: string) => {
      console.log(`Using AI to estimate nutrition for: ${foodName}`);
      
      const estimateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Estimate the nutritional values for a typical serving of: ${foodName}

Be realistic and accurate. Consider:
- Indian food portions (if applicable)
- Common preparation methods
- Average serving size

Provide your response as JSON:
{
  "calories": number,
  "protein_g": number,
  "fat_g": number,
  "carbs_g": number,
  "fiber_g": number
}

Give realistic estimates for a single serving.`
            }
          ]
        })
      });

      if (!estimateResponse.ok) {
        throw new Error(`Failed to estimate nutrition for ${foodName}`);
      }

      const estimateData = await estimateResponse.json();
      let content = estimateData.choices[0]?.message?.content?.trim() || "{}";
      
      // Parse JSON
      if (content.includes("```json")) {
        content = content.split("```json")[1].split("```")[0].trim();
      } else if (content.includes("```")) {
        content = content.split("```")[1].split("```")[0].trim();
      }
      
      const estimated = JSON.parse(content);
      console.log(`AI estimated nutrition for ${foodName}:`, estimated);
      
      return {
        calories: estimated.calories || 0,
        protein_g: estimated.protein_g || 0,
        fat_total_g: estimated.fat_g || 0,
        carbohydrates_total_g: estimated.carbs_g || 0,
        fiber_g: estimated.fiber_g || 0,
        isEstimated: true
      };
    };

    // Step 2: Get nutrition data for each item: Custom DB → CalorieNinjas → AI
    const nutritionPromises = foodItems.map(async (item: any) => {
      try {
        let nutrition = null;
        let source = 'unknown';

        // Priority 1: Check custom Indian food database
        const indianFood = await searchIndianFoodDatabase(item.name);
        if (indianFood) {
          nutrition = indianFood;
          source = 'custom_database';
          console.log(`✓ Found ${item.name} in custom Indian food database`);
        }

        // Priority 2: Try CalorieNinjas API
        if (!nutrition) {
          const nutritionResponse = await fetch(
            `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(item.name)}`,
            {
              headers: {
                "X-Api-Key": CALORIENINJAS_API_KEY,
              },
            }
          );

          if (nutritionResponse.ok) {
            const nutritionData = await nutritionResponse.json();
            
            if (nutritionData.items && nutritionData.items.length > 0) {
              nutrition = nutritionData.items[0];
              source = 'calorieninjas';
              console.log(`✓ Got nutrition from CalorieNinjas for ${item.name}`);
            }
          }
        }

        // Priority 3: Try alternative spellings in CalorieNinjas
        if (!nutrition) {
          const alternatives: { [key: string]: string[] } = {
            'pakore': ['pakora', 'bhaji', 'vegetable fritter'],
            'pakora': ['bhaji', 'vegetable fritter'],
            'roti': ['chapati', 'indian bread'],
            'dosa': ['south indian crepe'],
            'idli': ['steamed rice cake'],
            'vada': ['lentil donut'],
            'samosa': ['fried pastry'],
            'biryani': ['rice pilaf', 'indian rice'],
          };

          const lowerName = item.name.toLowerCase();
          const alternativeNames = alternatives[lowerName] || [];

          for (const altName of alternativeNames) {
            console.log(`Trying alternative name: ${altName}`);
            const altResponse = await fetch(
              `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(altName)}`,
              {
                headers: {
                  "X-Api-Key": CALORIENINJAS_API_KEY,
                },
              }
            );

            if (altResponse.ok) {
              const altData = await altResponse.json();
              if (altData.items && altData.items.length > 0) {
                nutrition = altData.items[0];
                source = 'calorieninjas_alt';
                console.log(`✓ Found nutrition using alternative name: ${altName}`);
                break;
              }
            }
          }
        }

        // Priority 4: Use AI estimation as last resort
        if (!nutrition) {
          nutrition = await estimateNutritionWithAI(item.name);
          source = 'ai_estimated';
          console.log(`⚠ Using AI estimation for ${item.name}`);
        }

        const isFromDatabase = source === 'custom_database';
        const isEstimated = source === 'ai_estimated';

        return {
          name: item.name,
          icon: item.icon,
          description: item.description,
          calories: Math.round(nutrition.calories || 0),
          protein: Math.round((nutrition.protein_g || 0) * 10) / 10,
          fat: Math.round((nutrition.fat_total_g || 0) * 10) / 10,
          carbs: Math.round((nutrition.carbohydrates_total_g || 0) * 10) / 10,
          fiber: Math.round((nutrition.fiber_g || 0) * 10) / 10,
          isEstimated,
          isFromDatabase,
          source,
          servingSize: nutrition.serving_size || 'per serving'
        };
      } catch (error) {
        console.error(`Error getting nutrition for ${item.name}:`, error);
        // Return basic estimated values as last resort
        return {
          name: item.name,
          icon: item.icon,
          description: item.description,
          calories: 150,
          protein: 5,
          fat: 5,
          carbs: 20,
          fiber: 2,
          isEstimated: true,
          isFromDatabase: false,
          source: 'fallback',
          servingSize: 'per serving'
        };
      }
    });

    const itemsWithNutrition = await Promise.all(nutritionPromises);
    
    // All items should have nutrition now (from API or AI estimation)

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

    // Check nutrition data sources
    const hasEstimated = itemsWithNutrition.some(item => item.isEstimated);
    const hasDatabase = itemsWithNutrition.some(item => item.isFromDatabase);
    const databaseCount = itemsWithNutrition.filter(item => item.isFromDatabase).length;
    const estimatedCount = itemsWithNutrition.filter(item => item.isEstimated).length;

    // Build source note
    let sourceNote = '';
    if (hasDatabase && hasEstimated) {
      sourceNote = ` (${databaseCount} from database, ${estimatedCount} AI-estimated)`;
    } else if (hasEstimated) {
      sourceNote = ' (Some nutrition values are AI-estimated)';
    } else if (hasDatabase) {
      sourceNote = ' (Accurate Indian food nutrition data)';
    }

    // Return combined results
    const result = {
      foodName: itemsWithNutrition.length === 1 ? itemsWithNutrition[0].name : `${itemsWithNutrition.length} items`,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
      healthTip: hasEstimated || hasDatabase ? `${healthTip}${sourceNote}` : healthTip,
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
