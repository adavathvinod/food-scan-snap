import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Building2, Sparkles } from "lucide-react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  plan_type: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[] | any;
}

interface Subscription {
  plan_type: string;
  status: string;
  expiry_date: string;
}

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPlansAndSubscription();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const loadPlansAndSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      
      // Parse features from JSON
      const parsedPlans = (plansData || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string)
      }));
      setPlans(parsedPlans);

      // Fetch current subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('plan_type, status, expiry_date')
        .eq('user_id', user.id)
        .single();

      if (!subError && subData) {
        setCurrentSubscription(subData);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRemainingDays = () => {
    if (!currentSubscription) return 0;
    const expiryDate = new Date(currentSubscription.expiry_date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handlePayment = async (plan: Plan) => {
    if (plan.plan_type === 'enterprise') {
      navigate('/enterprise-contact');
      return;
    }

    if (plan.plan_type === 'free') {
      toast({
        title: "Free Plan Active",
        description: "You already have access to the free plan!",
      });
      return;
    }

    setProcessingPlan(plan.plan_type);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: { planType: plan.plan_type },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (orderError) throw orderError;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NutriScan Pro',
        description: `${orderData.planName} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          await verifyPayment(response, plan.plan_type);
        },
        prefill: {
          email: session.user.email,
        },
        theme: {
          color: '#0EA5E9',
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
      setProcessingPlan(null);
    }
  };

  const verifyPayment = async (paymentResponse: any, planType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke(
        'verify-razorpay-payment',
        {
          body: {
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            planType,
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Payment Successful! 🎉",
        description: "Your subscription has been activated",
      });

      await loadPlansAndSubscription();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Payment verification failed",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'free': return <Sparkles className="h-6 w-6" />;
      case 'monthly': return <Zap className="h-6 w-6" />;
      case 'annual': return <Crown className="h-6 w-6" />;
      case 'enterprise': return <Building2 className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanButton = (plan: Plan) => {
    const isCurrentPlan = currentSubscription?.plan_type === plan.plan_type;
    const isPlanActive = currentSubscription?.status === 'active' || currentSubscription?.status === 'trial';

    if (plan.plan_type === 'free') {
      return (
        <Button className="w-full" variant="outline" disabled>
          Default Plan
        </Button>
      );
    }

    if (plan.plan_type === 'enterprise') {
      return (
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
          onClick={() => handlePayment(plan)}
          disabled={processingPlan !== null}
        >
          Contact Us
        </Button>
      );
    }

    if (isCurrentPlan && isPlanActive) {
      return (
        <Button className="w-full" variant="outline" disabled>
          Current Plan
        </Button>
      );
    }

    return (
      <Button 
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" 
        onClick={() => handlePayment(plan)}
        disabled={processingPlan !== null}
      >
        {processingPlan === plan.plan_type ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Subscribe for ₹${plan.price}`
        )}
      </Button>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg">
            Select the perfect plan for your nutrition tracking needs
          </p>
          
          {currentSubscription && (
            <div className="mt-6 inline-block">
              <Badge variant="secondary" className="text-lg px-6 py-2">
                {currentSubscription.status === 'trial' ? 'Free Trial - ' : 'Active - '}
                {getRemainingDays()} days remaining
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all hover:shadow-xl ${
                plan.plan_type === 'monthly' ? 'border-primary border-2 shadow-lg scale-105' : ''
              }`}
            >
              {plan.plan_type === 'monthly' && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getPlanIcon(plan.plan_type)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-3xl font-bold text-foreground">
                  ₹{plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.duration_days === 365 ? 'year' : plan.duration_days === 30 ? 'month' : 'trial'}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {getPlanButton(plan)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            All plans support payments via UPI, PhonePe, Google Pay, Debit/Credit Cards, and NetBanking
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;