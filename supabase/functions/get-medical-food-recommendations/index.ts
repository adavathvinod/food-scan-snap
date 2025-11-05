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

    const { foodsToEat = [], foodsToAvoid = [], language = "en" } = await req.json();

    // Input validation
    if (!Array.isArray(foodsToEat) || !Array.isArray(foodsToAvoid)) {
      return new Response(JSON.stringify({ error: "Invalid input format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (foodsToEat.length === 0) {
      return new Response(JSON.stringify({ error: "At least one food recommendation required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Getting medical food recommendations for:", foodsToEat);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("API key not configured");
    }

    // Create a prompt based on recommended foods
    const foodList = foodsToEat.join(", ");
    const avoidList = foodsToAvoid.length > 0 ? foodsToAvoid.join(", ") : "none";

    const prompt = `Based on these medical dietary recommendations:
Foods to eat: ${foodList}
Foods to avoid: ${avoidList}

Suggest 4 specific, orderable food items that align with these recommendations. Focus on:
- Items available on Indian food delivery platforms (Zomato, Swiggy, Blinkit, Amazon)
- Healthy, fresh foods that match the "foods to eat" list
- Include a good mix of prepared meals, fresh produce, and pantry staples

For each item provide:
1. name: The exact food item name (e.g., "Grilled Chicken Salad", "Fresh Spinach Pack")
2. description: Brief health benefit (e.g., "High protein, low fat chicken salad")
3. tag: One-word health tag (e.g., "Protein Rich", "Iron Rich", "Heart Healthy")
4. searchTerm: Best search term for ordering (e.g., "grilled chicken salad", "fresh spinach")
5. platform: Where to order from (Zomato, Swiggy, Blinkit, Amazon, Flipkart, Zepto)

Return ONLY valid JSON array with 4 items. No markdown, no explanation.
Example format:
[
  {
    "name": "Grilled Chicken Breast",
    "description": "High protein, low fat chicken",
    "tag": "Protein Rich",
    "searchTerm": "grilled chicken breast",
    "platform": "Swiggy"
  }
]`;

    let aiItems: any[] = [];
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are a health food expert. Return ONLY valid JSON arrays with no markdown formatting."
            },
            {
              role: "user",
              content: prompt
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI API error (${response.status}):`, errorText);
        
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("AI credits exhausted. Please add credits to continue.");
        }
        throw new Error(`Failed to get food recommendations: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content?.trim() || "";

      console.log("Raw AI response:", content);

      // Clean up markdown formatting
      if (content.includes("```json")) {
        content = content.split("```json")[1].split("```")[0].trim();
      } else if (content.includes("```")) {
        content = content.split("```")[1].split("```")[0].trim();
      }

      try {
        aiItems = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        aiItems = [];
      }
    } catch (e) {
      console.error("AI gateway unavailable, using fallback:", e);
      aiItems = [];
    }

    console.log("Parsed items:", aiItems);

    // Image mapping for common Indian healthy foods
    const imageMap: { [key: string]: string } = {
      "chicken": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300",
      "salad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
      "fruit": "https://images.unsplash.com/photo-1504711331083-98345f3f44d1?w=300",
      "fish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300",
      "oats": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=300",
      "yogurt": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300",
      "spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300",
      "juice": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=300",
      "nuts": "https://images.unsplash.com/photo-1508747703725-719777637510?w=300",
      "soup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300",
      "dal": "https://images.unsplash.com/photo-1626019183442-e48e8b8a4e0b?w=300",
      "paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300",
    };

    const getImageUrl = (name: string, description: string): string => {
      const searchText = (name + " " + description).toLowerCase();
      for (const [key, url] of Object.entries(imageMap)) {
        if (searchText.includes(key)) return url;
      }
      return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300";
    };

    const getOrderLink = (platform: string, searchTerm: string): string => {
      const q = encodeURIComponent(searchTerm);
      const platformMap: { [key: string]: string } = {
        "Zomato": `https://www.zomato.com/search?q=${q}`,
        "Swiggy": `https://www.swiggy.com/search?q=${q}`,
        "Blinkit": `https://blinkit.com/s/?q=${q}`,
        "Amazon": `https://www.amazon.in/s?k=${q}`,
        "Flipkart": `https://www.flipkart.com/search?q=${q}`,
        "Zepto": `https://www.zeptonow.com/search?query=${q}`,
      };
      return platformMap[platform] || `https://www.google.com/search?q=${q}`;
    };

    // Process items or use fallback
    const recommendations = (aiItems && aiItems.length > 0 ? aiItems : getFallbackItems(foodsToEat)).map((item: any) => ({
      name: item.name,
      description: item.description,
      tag: item.tag,
      imageUrl: getImageUrl(item.name, item.description),
      orderLink: getOrderLink(item.platform, item.searchTerm || item.name),
      platform: item.platform,
    }));

    console.log("Final recommendations:", recommendations);

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in get-medical-food-recommendations:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to get recommendations",
        recommendations: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getFallbackItems(foodsToEat: string[]): any[] {
  const items = [];
  
  if (foodsToEat.some(f => f.toLowerCase().includes("protein"))) {
    items.push({
      name: "Grilled Chicken Breast",
      description: "High protein, low fat chicken",
      tag: "Protein Rich",
      searchTerm: "grilled chicken breast",
      platform: "Swiggy"
    });
  }
  
  if (foodsToEat.some(f => f.toLowerCase().includes("fiber") || f.toLowerCase().includes("vegetable"))) {
    items.push({
      name: "Fresh Salad Bowl",
      description: "Mixed greens with fiber",
      tag: "Fiber Rich",
      searchTerm: "fresh salad bowl",
      platform: "Zomato"
    });
  }
  
  items.push(
    {
      name: "Mixed Fruit Bowl",
      description: "Seasonal fresh fruits",
      tag: "Vitamin Rich",
      searchTerm: "mixed fruit bowl",
      platform: "Blinkit"
    },
    {
      name: "Greek Yogurt",
      description: "Probiotic-rich yogurt",
      tag: "Healthy",
      searchTerm: "greek yogurt",
      platform: "Blinkit"
    }
  );
  
  return items.slice(0, 4);
}
