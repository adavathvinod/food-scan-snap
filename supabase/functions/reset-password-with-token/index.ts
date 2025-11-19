import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("reset-password-with-token: Request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password }: ResetPasswordRequest = await req.json();
    console.log("reset-password-with-token: Processing password reset");

    if (!token || !token.trim()) {
      console.error("reset-password-with-token: Token is required");
      return new Response(
        JSON.stringify({ success: false, error: "Token is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!password || password.length < 6) {
      console.error("reset-password-with-token: Invalid password");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Password must be at least 6 characters" 
        }),
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

    // Look up and validate token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("email, expires_at, used")
      .eq("token", token)
      .maybeSingle();

    if (tokenError) {
      console.error("reset-password-with-token: Database error:", tokenError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!resetToken) {
      console.log("reset-password-with-token: Token not found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid or expired reset link" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (resetToken.used) {
      console.log("reset-password-with-token: Token already used");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "This reset link has already been used" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const expiresAt = new Date(resetToken.expires_at);
    const now = new Date();
    if (now > expiresAt) {
      console.log("reset-password-with-token: Token expired");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "This reset link has expired" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user by email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      console.error("reset-password-with-token: Error fetching users:", getUserError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to find user" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const user = users.find(u => u.email?.toLowerCase() === resetToken.email.toLowerCase());

    if (!user) {
      console.error("reset-password-with-token: User not found for email:", resetToken.email);
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("reset-password-with-token: Updating password for user:", user.id);

    // Update user password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: password }
    );

    if (updateError) {
      console.error("reset-password-with-token: Error updating password:", updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to update password" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark token as used
    const { error: markUsedError } = await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("token", token);

    if (markUsedError) {
      console.error("reset-password-with-token: Error marking token as used:", markUsedError);
      // Don't fail the request if marking as used fails
    }

    console.log("reset-password-with-token: Password reset successful");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Password updated successfully! You can now log in."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("reset-password-with-token: Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
