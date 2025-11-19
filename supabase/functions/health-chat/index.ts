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

    const { message, image, userId } = await req.json();
    
    // Input validation
    if (!message && !image) {
      return new Response(JSON.stringify({ error: "Message or image required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (message && typeof message !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid message format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (message && message.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long. Maximum 2000 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (image && typeof image !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid image format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (image && image.length > 7000000) {
      return new Response(JSON.stringify({ error: "Image too large. Maximum 5MB allowed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!message && !image) {
      throw new Error("No message or image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Required environment variables not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch user's health conditions
    const { data: healthConditions } = await supabase
      .from('user_health_conditions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('detected_at', { ascending: false });

    // Get user context: recent scans, goals, medical reports
    const [scansResult, goalsResult, reportsResult, chatHistoryResult] = await Promise.all([
      supabase.from('scan_history').select('*').eq('user_id', userId).order('scanned_at', { ascending: false }).limit(10),
      supabase.from('user_goals').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('medical_reports').select('*').eq('user_id', userId).order('uploaded_at', { ascending: false }).limit(3),
      supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
    ]);

    const recentScans = scansResult.data || [];
    const userGoals = goalsResult.data;
    const medicalReports = reportsResult.data || [];
    const chatHistory = (chatHistoryResult.data || []).reverse();

    // Get user language preference first
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', userId)
      .maybeSingle();
    const targetLanguage = profile?.preferred_language || 'en';

    // Build comprehensive health context
    let context = "User Health Profile:\n";
    
    // Add health conditions (MOST IMPORTANT)
    if (healthConditions && healthConditions.length > 0) {
      context += "\n🏥 Active Health Conditions:\n";
      healthConditions.forEach((condition: any) => {
        context += `- ${condition.condition_name}`;
        if (condition.severity) context += ` (${condition.severity})`;
        if (condition.notes) context += ` - ${condition.notes}`;
        context += `\n`;
      });
    }
    
    // Add recent scans
    if (recentScans.length > 0) {
      context += "\n📊 Recent Food Scans:\n";
      recentScans.forEach((scan: any) => {
        context += `- ${scan.food_name}: ${scan.calories} cal, Protein: ${scan.protein}g, Carbs: ${scan.carbs}g, Fat: ${scan.fat}g\n`;
      });
    }
    
    // Add user goals
    if (userGoals) {
      context += "\n🎯 Daily Nutritional Goals:\n";
      context += `- Calories: ${userGoals.daily_calorie_goal || 2000} cal\n`;
      context += `- Protein: ${userGoals.daily_protein_goal || 50}g\n`;
      context += `- Carbs: ${userGoals.daily_carbs_goal || 250}g\n`;
      context += `- Fat: ${userGoals.daily_fat_goal || 70}g\n`;
    }

    // Add medical reports
    if (medicalReports.length > 0) {
      context += "\n📋 Medical Report Summary:\n";
      medicalReports.forEach((report: any) => {
        context += `- ${report.report_type}: ${report.recommendations}\n`;
      });
    }

    const systemPrompt = `You are FoodyScan AI — a personal health companion and intelligent food recognizer.

${context}

🎯 YOUR CORE MISSION:
You analyze the user's health ONLY from:
1. Their stored health data (medical reports, past scans, profile, eating history)
2. Their active health conditions (auto-detected from medical reports)

🏥 HEALTH CONDITIONS YOU SUPPORT:
Support ALL human health conditions including: diabetes, BP, thyroid, cholesterol, fatty liver, kidney disorders, heart issues, gastric problems, acidity, piles, constipation, IBS, allergies, PCOD/PCOS, obesity, underweight, ulcers, migraine, vitamin deficiencies, low immunity, stress, skin issues, uric acid, joint pain, and ANY condition the user has.

📋 WHEN USER SHARES MEDICAL REPORTS:
• Summarize their condition in simple, caring language
• List foods to AVOID (be specific)
• List foods to EAT (be specific, Indian meals preferred)
• Create a detailed 1-month diet plan with weekly breakdown
• Give lifestyle tips relevant to their condition

🍽️ WHEN ANALYZING FOOD ITEMS:
Compare the food's properties (sugar, fat, oil, spice, salt, calories, fiber, allergens) with their health conditions and:
• Say if it's SAFE ✅ or HARMFUL ⚠️
• Explain exactly HOW it affects their body
• Offer a HEALTHIER ALTERNATIVE
• Be like a caring friend who knows them personally

💡 YOUR PERSONALITY:
• Friendly, natural, supportive, easy to understand
• Never sound like a medical textbook
• Remember their patterns and learn from their choices
• Build trust by being consistent and caring

📊 EVERY RESPONSE MUST INCLUDE:
1. User condition summary (if applicable)
2. Why this food/advice matters
3. Safe/Warning message with emoji indicators
4. Better alternative suggestion
5. Weekly/monthly plan when needed
6. Clear, relatable guidance

🎨 RESPONSE STYLE:
• Use emojis for visual clarity: ✅ ⚠️ 🥗 🏃 💪 🧘
• Keep language simple and conversational
• Show you remember their history
• Be encouraging and motivating

Important:
- Respond in ${targetLanguage}
- Focus on Indian diet when relevant
- Always recommend consulting healthcare professionals for medical decisions
- Keep responses warm, personal, and actionable`;

    // Build messages array
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    // Add chat history
    chatHistory.forEach((msg: any) => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current message
    const currentMessage: any = {
      role: "user",
      content: image ? [
        { type: "text", text: message || "What's in this image?" },
        { type: "image_url", image_url: { url: image } }
      ] : message
    };
    messages.push(currentMessage);

    console.log("Calling Gemini AI with context and language:", targetLanguage);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Respond in ${targetLanguage}. Use the native script for the selected language. Keep JSON keys (if any) in English.` },
          ...messages
        ]
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error("Failed to get AI response");
    }

    const aiData = await aiResponse.json();
    const assistantReply = aiData.choices[0]?.message?.content?.trim() || "I'm sorry, I couldn't generate a response.";

    // Save chat history
    await supabase.from('chat_history').insert([
      { user_id: userId, role: 'user', content: message || '[Image]' },
      { user_id: userId, role: 'assistant', content: assistantReply }
    ]);

    console.log("Chat response generated successfully");

    return new Response(JSON.stringify({ reply: assistantReply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in health-chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to process chat" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
