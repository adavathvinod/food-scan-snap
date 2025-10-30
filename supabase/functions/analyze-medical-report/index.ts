const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, reportType = "general" } = await req.json();

    if (!image) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("API key not configured");
    }

    console.log("Analyzing medical report with Gemini AI...");

    // Use Gemini AI to extract medical data from report
    const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                text: `Analyze this medical report. Extract key lab values and health indicators.

Look for: blood sugar (fasting/PP), cholesterol (total, LDL, HDL, triglycerides), hemoglobin, thyroid (TSH, T3, T4), blood pressure, kidney function (creatinine, urea), liver function (SGPT, SGOT), vitamin levels (D, B12), etc.

Check if this is actually a medical report. If not (e.g., random document, unclear image), respond with: "NOT_MEDICAL_REPORT"

If valid, provide:
1. Extracted values as key-value pairs
2. Which values are out of normal range (if any)
3. Indian diet-specific food recommendations (veg & non-veg options) - foods to eat and avoid
4. A 30-day improvement plan with simple lifestyle changes
5. List any critical values that need immediate doctor consultation

Format as JSON:
{
  "valid": true/false,
  "extracted": {"parameter": "value with unit"},
  "abnormal": ["list of parameters outside normal range"],
  "recommendations": {
    "foodsToEat": ["food1", "food2"],
    "foodsToAvoid": ["food1", "food2"],
    "plan30Days": "detailed 30-day plan"
  }
}`
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

    if (!extractResponse.ok) {
      if (extractResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (extractResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error("Failed to analyze medical report");
    }

    const extractData = await extractResponse.json();
    let content = extractData.choices[0]?.message?.content?.trim() || "";

    if (content === "NOT_MEDICAL_REPORT" || content.includes("NOT_MEDICAL_REPORT")) {
      throw new Error("⚠️ We couldn't detect a valid medical report. Please upload a clear photo of your lab report.");
    }

    // Parse JSON response
    let analysis;
    try {
      if (content.includes("```json")) {
        content = content.split("```json")[1].split("```")[0].trim();
      } else if (content.includes("```")) {
        content = content.split("```")[1].split("```")[0].trim();
      }
      
      analysis = JSON.parse(content);
      
      if (!analysis.valid) {
        throw new Error("⚠️ We couldn't detect a valid medical report. Please upload a clear photo of your lab report.");
      }
    } catch (e) {
      console.error("Failed to parse analysis:", e);
      throw new Error("Failed to analyze medical report");
    }

    console.log("Medical report analyzed successfully");

    const result = {
      reportType,
      extracted: analysis.extracted || {},
      abnormal: analysis.abnormal || [],
      recommendations: analysis.recommendations || {
        foodsToEat: [],
        foodsToAvoid: [],
        plan30Days: ""
      },
      disclaimer: "⚠️ For information only — consult a doctor for medical advice."
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-medical-report function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to analyze medical report" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
