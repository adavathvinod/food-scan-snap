import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac } from "https://deno.land/std@0.160.0/node/crypto.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planType 
    } = await req.json();
    
    console.log('Verifying payment for order:', razorpay_order_id);
    
    // Verify signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const generatedSignature = createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    if (generatedSignature !== razorpay_signature) {
      console.error('Invalid payment signature');
      throw new Error('Invalid payment signature');
    }
    
    console.log('Payment signature verified successfully');
    
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    
    // Fetch plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', planType)
      .single();
    
    if (planError || !plan) {
      throw new Error('Plan not found');
    }
    
    // Calculate expiry date
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days);
    
    // Update or insert user subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: planType,
          status: 'active',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount: plan.price,
          start_date: startDate.toISOString(),
          expiry_date: expiryDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        throw updateError;
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: planType,
          status: 'active',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount: plan.price,
          start_date: startDate.toISOString(),
          expiry_date: expiryDate.toISOString(),
        });
      
      if (insertError) {
        console.error('Error creating subscription:', insertError);
        throw insertError;
      }
    }
    
    console.log('Subscription updated successfully for user:', user.id);
    
    // Send confirmation email
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      const userName = profile?.full_name || profile?.email || 'User';
      const userEmail = profile?.email || user.email;
      
      await resend.emails.send({
        from: 'FoodyScan <onboarding@resend.dev>',
        to: [userEmail],
        subject: 'Payment Successful - FoodyScan',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #22c55e;">Payment Successful!</h1>
            <p>Dear ${userName},</p>
            <p>Thank you for your payment. Your subscription has been successfully activated.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #374151;">Payment Details</h2>
              <p><strong>Plan:</strong> ${plan.name}</p>
              <p><strong>Amount:</strong> ₹${plan.price}</p>
              <p><strong>Date & Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
              <p><strong>Valid Until:</strong> ${expiryDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
            
            <p>Your subscription is now active and you can enjoy all the features of your plan.</p>
            
            <p>If you have any questions or need assistance, please contact our support team at <a href="mailto:support@foodyscan.com">support@foodyscan.com</a></p>
            
            <p style="margin-top: 30px;">Best regards,<br>The FoodyScan Team</p>
          </div>
        `,
      });
      
      console.log('Confirmation email sent to:', userEmail);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the payment if email fails
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment verified and subscription activated',
        expiryDate: expiryDate.toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});