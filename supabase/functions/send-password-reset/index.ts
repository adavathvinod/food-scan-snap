import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-password-reset: Request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();
    console.log("send-password-reset: Processing reset for email:", email);

    if (!email || !email.trim()) {
      console.error("send-password-reset: Email is required");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("send-password-reset: Invalid email format");
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
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

    // Check if email exists in profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (profileError) {
      console.error("send-password-reset: Database error:", profileError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Always return success even if email doesn't exist (security best practice)
    if (!profile) {
      console.log("send-password-reset: Email not found, but returning success for security");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If the email exists, a reset link has been sent" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate secure random token (32 bytes = 64 hex characters)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log("send-password-reset: Generated token for:", email);

    // Calculate expiry time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({
        email: email.toLowerCase().trim(),
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error("send-password-reset: Error storing token:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset token" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get the app URL from environment or construct it
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovableproject.com") || 
                   "https://8638b865-74d1-462d-a130-b794bea74571.lovableproject.com";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    console.log("send-password-reset: Sending email to:", email);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "FoodyScan <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                You requested to reset your password for your FoodyScan account. Click the button below to set a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${resetUrl}
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 14px; color: #999; margin: 5px 0;">
                  ⏰ This link will expire in 1 hour.
                </p>
                <p style="font-size: 14px; color: #999; margin: 5px 0;">
                  🔒 If you didn't request this, please ignore this email.
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} FoodyScan. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("send-password-reset: Email response:", emailResponse);

    // Check if email send failed
    if (emailResponse.error) {
      console.error("send-password-reset: Email send failed:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send reset email. Please contact support or try again later.",
          details: emailResponse.error.message
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("send-password-reset: Email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Password reset link has been sent to your email"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("send-password-reset: Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
