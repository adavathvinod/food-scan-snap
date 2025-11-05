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

    const { condition } = await req.json();

    // Input validation
    if (!condition || typeof condition !== 'string') {
      return new Response(JSON.stringify({ error: "Valid condition text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (condition.length > 500) {
      return new Response(JSON.stringify({ error: "Condition description too long. Maximum 500 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("API key not configured");
    }

    console.log(`Getting advice for condition: ${condition}`);

    const adviceResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Provide dietary and lifestyle advice for someone experiencing: ${condition}

Focus on Indian diet recommendations (both veg and non-veg options).

Format as JSON:
{
  "foodSuggestions": ["food1", "food2", ...],
  "habits": ["habit1", "habit2", ...],
  "rationale": "Brief explanation why these help",
  "disclaimer": "Medical disclaimer text"
}

Keep it concise and practical. Include disclaimer: "⚠️ For information only — consult a doctor for proper diagnosis and treatment."`
          }
        ]
      })
    });

    if (!adviceResponse.ok) {
      if (adviceResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (adviceResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error("Failed to get condition advice");
    }

    const adviceData = await adviceResponse.json();
    let content = adviceData.choices[0]?.message?.content?.trim() || "{}";

    // Parse JSON response
    let advice;
    try {
      if (content.includes("```json")) {
        content = content.split("```json")[1].split("```")[0].trim();
      } else if (content.includes("```")) {
        content = content.split("```")[1].split("```")[0].trim();
      }
      
      advice = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse advice:", e);
      advice = {
        foodSuggestions: [],
        habits: [],
        rationale: content,
        disclaimer: "⚠️ For information only — consult a doctor for proper diagnosis and treatment."
      };
    }

    console.log("Condition advice generated");

    return new Response(JSON.stringify(advice), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in condition-advice function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to get condition advice" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
