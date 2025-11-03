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
    const { foodName, language = "en" } = await req.json();

    if (!foodName) {
      return new Response(
        JSON.stringify({ error: "Food name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a food recommendation expert specializing in Indian and international cuisine. 
Given a food item, suggest 3-5 related dishes or products that complement it.

For each recommendation provide:
1. name - the dish/product name
2. description - 1-2 line description
3. tag - one word tag like "Protein Rich", "Low Calorie", "Healthy", "Popular"
4. platform - suggest one of: Zomato, Swiggy, Amazon, Flipkart

Consider:
- Indian dishes: rotis, biryani, curries, dal, sambar, dosas, idli, vada, paneer dishes
- Healthy alternatives when the scanned food is unhealthy
- Complementary items (e.g., if biryani, suggest raita, curry)
- Regional variations

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Dish name",
    "description": "Short description",
    "tag": "Tag",
    "platform": "Zomato"
  }
]`;

    const userPrompt = `Suggest 3-5 food items similar to or complementing: "${foodName}". 
Language for names and descriptions: ${language === "hi" ? "Hindi" : language === "te" ? "Telugu" : "English"}`;

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
    const content = aiData.choices[0]?.message?.content || "[]";
    
    let recommendations = [];
    try {
      recommendations = JSON.parse(content);
    } catch {
      // Fallback if parsing fails
      recommendations = [];
    }

    // Add image URLs based on food type
    const imageMap: any = {
      "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300",
      "roti": "https://images.unsplash.com/photo-1619542558208-f490a2900e70?w=300",
      "curry": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300",
      "salad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
      "juice": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=300",
      "chicken": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300",
      "paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300",
      "dal": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300",
      "rice": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=300",
      "default": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300"
    };

    recommendations = recommendations.map((rec: any) => {
      const lowerName = rec.name?.toLowerCase() || "";
      let imageUrl = imageMap.default;
      
      for (const [key, url] of Object.entries(imageMap)) {
        if (lowerName.includes(key)) {
          imageUrl = url;
          break;
        }
      }

      return {
        ...rec,
        imageUrl,
        orderLink: rec.platform === "Amazon" || rec.platform === "Flipkart" 
          ? `https://www.${rec.platform.toLowerCase()}.${rec.platform === "Flipkart" ? "com" : "in"}`
          : `https://www.${rec.platform.toLowerCase()}.com`
      };
    });

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
