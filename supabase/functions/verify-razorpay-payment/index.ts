import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac } from "https://deno.land/std@0.160.0/node/crypto.ts";

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