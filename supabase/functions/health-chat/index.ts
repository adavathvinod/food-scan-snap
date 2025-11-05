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

    // Build context
    let context = "You are a friendly AI health assistant specializing in Indian diet and nutrition. Provide personalized advice based on the user's context.\n\n";
    
    if (recentScans.length > 0) {
      context += `Recent food scans (last 10):\n`;
      recentScans.forEach(scan => {
        context += `- ${scan.food_name}: ${scan.calories} cal, ${scan.protein}g protein\n`;
      });
    }

    if (userGoals) {
      context += `\nDaily goals: ${userGoals.daily_calorie_goal} cal, ${userGoals.daily_protein_goal}g protein\n`;
    }

    if (medicalReports.length > 0) {
      context += `\nRecent medical reports analyzed: ${medicalReports.length}\n`;
    }

    context += `\nAlways provide Indian diet-specific recommendations (both veg and non-veg options when relevant).
Include a medical disclaimer when providing health advice: "⚠️ For information only — consult a doctor."
Be friendly, concise, and encouraging.\n\n`;

    // Build messages array
    const messages: any[] = [
      { role: "system", content: context }
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

    console.log("Calling Gemini AI with context...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages
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
