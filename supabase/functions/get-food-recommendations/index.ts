import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const { foodName, language = "en" } = await req.json();

    // Input validation
    if (!foodName || typeof foodName !== 'string') {
      return new Response(
        JSON.stringify({ error: "Valid food name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (foodName.length > 200) {
      return new Response(
        JSON.stringify({ error: "Food name too long. Maximum 200 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a food recommendation expert specializing in Indian and international cuisine. 
Given a food item, suggest 4-5 related dishes or products that complement it.

For each recommendation provide:
1. name - the dish/product name (keep it simple and searchable)
2. description - 1-2 line appealing description
3. tag - one word tag like "Protein Rich", "Low Calorie", "Healthy", "Popular", "Trending"
4. platform - suggest one of: Zomato, Swiggy, Amazon, Flipkart
5. searchTerm - a simple search term for the platform (e.g., "biryani", "raita", "protein powder")

Consider:
- For Indian meals: suggest complementary items (raita with biryani, papad with dal, pickle with rice)
- Healthy alternatives when the scanned food is unhealthy
- Popular combos from food delivery apps
- Regional specialties
- Packaged products for Amazon/Flipkart

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations):
[
  {
    "name": "Boondi Raita",
    "description": "Cool and creamy yogurt with crispy boondi pearls",
    "tag": "Popular",
    "platform": "Zomato",
    "searchTerm": "raita"
  }
]`;

    const userPrompt = `Suggest 4-5 food items that complement or pair well with: "${foodName}". 
Think about what people typically order together on food delivery apps.
Language for names and descriptions: ${language === "hi" ? "Hindi" : language === "te" ? "Telugu" : "English"}
Return ONLY the JSON array, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    let content = aiData.choices[0]?.message?.content || "[]";
    
    console.log("Raw AI response:", content);
    
    // Clean up the content - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let recommendations = [];
    try {
      recommendations = JSON.parse(content);
      console.log("Parsed recommendations:", recommendations);
    } catch (error) {
      console.error("JSON parsing failed:", error);
      console.error("Content was:", content);
      recommendations = [];
    }

    // Enhanced image URLs based on food type
    const imageMap: any = {
      "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
      "roti": "https://images.unsplash.com/photo-1619542558208-f490a2900e70?w=400&q=80",
      "naan": "https://images.unsplash.com/photo-1619542558208-f490a2900e70?w=400&q=80",
      "curry": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
      "chicken": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
      "paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80",
      "dal": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80",
      "rice": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400&q=80",
      "raita": "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400&q=80",
      "papad": "https://images.unsplash.com/photo-1626019183442-e48e8b8a4e0b?w=400&q=80",
      "dosa": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80",
      "idli": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
      "sambar": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80",
      "salad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
      "juice": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&q=80",
      "lassi": "https://images.unsplash.com/photo-1561043433-aaf687c4cf04?w=400&q=80",
      "pickle": "https://images.unsplash.com/photo-1628777361361-0f7adc061a0c?w=400&q=80",
      "chutney": "https://images.unsplash.com/photo-1626019183442-e48e8b8a4e0b?w=400&q=80",
      "dessert": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80",
      "sweet": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80",
      "default": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"
    };

    recommendations = recommendations.map((rec: any) => {
      const lowerName = rec.name?.toLowerCase() || "";
      let imageUrl = imageMap.default;
      
      // Find matching image
      for (const [key, url] of Object.entries(imageMap)) {
        if (lowerName.includes(key)) {
          imageUrl = url;
          break;
        }
      }

      // Build proper search URLs
      const searchTerm = rec.searchTerm || rec.name;
      const encodedSearch = encodeURIComponent(searchTerm);
      
      let orderLink = "";
      if (rec.platform === "Zomato") {
        orderLink = `https://www.zomato.com/search?q=${encodedSearch}`;
      } else if (rec.platform === "Swiggy") {
        orderLink = `https://www.swiggy.com/search?q=${encodedSearch}`;
      } else if (rec.platform === "Amazon") {
        orderLink = `https://www.amazon.in/s?k=${encodedSearch}`;
      } else if (rec.platform === "Flipkart") {
        orderLink = `https://www.flipkart.com/search?q=${encodedSearch}`;
      } else if (rec.platform === "Blinkit") {
        orderLink = `https://blinkit.com/s/?q=${encodedSearch}`;
      } else if (rec.platform === "Zepto") {
        orderLink = `https://www.zeptonow.com/search?q=${encodedSearch}`;
      }

      return {
        ...rec,
        imageUrl,
        orderLink
      };
    });

    // Final fallback if AI returns nothing
    if (!recommendations.length) {
      const lower = (foodName || "").toLowerCase();
      const fallback: any[] = lower.includes("biryani") ? [
        { name: "Boondi Raita", description: "Cool yogurt with boondi", tag: "Popular", platform: "Zomato", searchTerm: "raita" },
        { name: "Mirchi Salan", description: "Hyderabadi side for biryani", tag: "Classic", platform: "Zomato", searchTerm: "mirchi salan" },
        { name: "Gulab Jamun", description: "Warm Indian dessert", tag: "Sweet", platform: "Swiggy", searchTerm: "gulab jamun" },
        { name: "Soft Drink Can", description: "Cola / soda can", tag: "Trending", platform: "Blinkit", searchTerm: "coke can" },
      ] : [
        { name: "Masala Papad", description: "Crispy papad with toppings", tag: "Snack", platform: "Zomato", searchTerm: "masala papad" },
        { name: "Curd (Dahi)", description: "Fresh curd", tag: "Cooling", platform: "Blinkit", searchTerm: "dahi curd" },
        { name: "Protein Shake", description: "Whey protein pack", tag: "Protein Rich", platform: "Amazon", searchTerm: "whey protein" },
      ];

      const imageMap: any = {
        "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
        "raita": "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400&q=80",
        "salan": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
        "papad": "https://images.unsplash.com/photo-1626019183442-e48e8b8a4e0b?w=400&q=80",
        "curd": "https://images.unsplash.com/photo-1604908553488-c6e6e8dc1bd8?w=400&q=80",
        "protein": "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&q=80",
        "default": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80"
      };

      const mapLink = (platform: string, term: string) => {
        const q = encodeURIComponent(term);
        if (platform === "Zomato") return `https://www.zomato.com/search?q=${q}`;
        if (platform === "Swiggy") return `https://www.swiggy.com/search?q=${q}`;
        if (platform === "Amazon") return `https://www.amazon.in/s?k=${q}`;
        if (platform === "Flipkart") return `https://www.flipkart.com/search?q=${q}`;
        if (platform === "Blinkit") return `https://blinkit.com/s/?q=${q}`;
        if (platform === "Zepto") return `https://www.zeptonow.com/search?q=${q}`;
        return `https://www.google.com/search?q=${q}`;
      };

      recommendations = fallback.map((rec: any) => {
        const lowerName = rec.name.toLowerCase();
        let imageUrl = imageMap.default;
        for (const [key, url] of Object.entries(imageMap)) {
          if (lowerName.includes(key)) { imageUrl = url as string; break; }
        }
        return {
          ...rec,
          imageUrl,
          orderLink: mapLink(rec.platform, rec.searchTerm || rec.name)
        };
      });
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in get-food-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
