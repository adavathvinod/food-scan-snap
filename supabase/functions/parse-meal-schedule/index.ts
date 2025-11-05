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
    
    if (image.length > 7000000) {
      return new Response(JSON.stringify({ error: "Image too large. Maximum 5MB allowed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("API key not configured");
    }

    console.log("Parsing meal schedule from image...");

    const parseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                text: `Extract meal schedule information from this image (could be a doctor's prescription, diet chart, or meal plan table).

Look for:
- Meal times (Morning, Breakfast, Lunch, Evening, Dinner, etc.)
- What to eat at each time
- Any special instructions

If this doesn't look like a meal schedule or diet plan, respond with: "NOT_MEAL_SCHEDULE"

If valid, format as JSON:
{
  "valid": true/false,
  "meals": [
    {
      "name": "Breakfast",
      "time": "08:00",
      "instructions": "What to eat"
    }
  ]
}

Use 24-hour format for times (e.g., "08:00", "13:00", "19:00").
If exact time not specified, use typical meal times:
- Morning: 07:00
- Breakfast: 08:00
- Mid-morning: 10:30
- Lunch: 13:00
- Evening: 16:00
- Dinner: 19:30`
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

    if (!parseResponse.ok) {
      if (parseResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (parseResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error("Failed to parse meal schedule");
    }

    const parseData = await parseResponse.json();
    let content = parseData.choices[0]?.message?.content?.trim() || "";

    if (content === "NOT_MEAL_SCHEDULE" || content.includes("NOT_MEAL_SCHEDULE")) {
      throw new Error("⚠️ We couldn't detect a meal schedule. Please upload a clear photo of your diet plan or meal schedule.");
    }

    // Parse JSON response
    let schedule;
    try {
      if (content.includes("```json")) {
        content = content.split("```json")[1].split("```")[0].trim();
      } else if (content.includes("```")) {
        content = content.split("```")[1].split("```")[0].trim();
      }
      
      schedule = JSON.parse(content);
      
      if (!schedule.valid || !schedule.meals || schedule.meals.length === 0) {
        throw new Error("⚠️ We couldn't detect a meal schedule. Please upload a clear photo of your diet plan or meal schedule.");
      }
    } catch (e) {
      console.error("Failed to parse schedule:", e);
      throw new Error("Failed to parse meal schedule");
    }

    console.log("Meal schedule parsed successfully");

    return new Response(JSON.stringify({ meals: schedule.meals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in parse-meal-schedule function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to parse meal schedule" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
