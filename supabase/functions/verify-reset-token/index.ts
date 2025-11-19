import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyTokenRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("verify-reset-token: Request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: VerifyTokenRequest = await req.json();
    console.log("verify-reset-token: Verifying token");

    if (!token || !token.trim()) {
      console.error("verify-reset-token: Token is required");
      return new Response(
        JSON.stringify({ valid: false, error: "Token is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Look up token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("email, expires_at, used")
      .eq("token", token)
      .maybeSingle();

    if (tokenError) {
      console.error("verify-reset-token: Database error:", tokenError);
      return new Response(
        JSON.stringify({ valid: false, error: "Database error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token exists
    if (!resetToken) {
      console.log("verify-reset-token: Token not found");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Invalid or expired reset link. Please request a new one." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token has been used
    if (resetToken.used) {
      console.log("verify-reset-token: Token already used");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "This reset link has already been used. Please request a new one." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token has expired
    const expiresAt = new Date(resetToken.expires_at);
    const now = new Date();
    if (now > expiresAt) {
      console.log("verify-reset-token: Token expired");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "This reset link has expired. Please request a new one." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("verify-reset-token: Token is valid for email:", resetToken.email);

    return new Response(
      JSON.stringify({ 
        valid: true,
        email: resetToken.email
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("verify-reset-token: Unexpected error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
