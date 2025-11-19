import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidRecovery, setIsValidRecovery] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let sessionCheckTimeout: NodeJS.Timeout;
    let finalValidationTimeout: NodeJS.Timeout;

    console.log('ResetPassword: Component mounted, URL:', window.location.href);

    // Set up auth state listener FIRST - this is critical
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('ResetPassword: Auth state change ->', { event, hasSession: !!session });
      
      if (!mounted) return;

      // Clear all timeouts when we get a valid auth event
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        clearTimeout(sessionCheckTimeout);
        clearTimeout(finalValidationTimeout);
        
        if (session) {
          console.log('ResetPassword: ✓ Valid recovery session established');
          setIsValidRecovery(true);
          setCheckingRecovery(false);
          setShowResendForm(false);
        }
      }
    });

    // Give Supabase time to process the URL and establish the session
    // We'll check multiple times with increasing intervals
    const performSessionChecks = async () => {
      const checkAttempts = [
        { delay: 500, label: 'First check' },
        { delay: 1500, label: 'Second check' },
        { delay: 3000, label: 'Third check' },
        { delay: 5000, label: 'Final check' }
      ];

      for (const attempt of checkAttempts) {
        await new Promise(resolve => setTimeout(resolve, attempt.delay));
        
        if (!mounted) return;

        const { data: { session } } = await supabase.auth.getSession();
        console.log(`ResetPassword: ${attempt.label} (${attempt.delay}ms) - Session:`, !!session);

        if (session) {
          console.log('ResetPassword: ✓ Session found on', attempt.label);
          clearTimeout(finalValidationTimeout);
          setIsValidRecovery(true);
          setCheckingRecovery(false);
          setShowResendForm(false);
          return; // Stop checking
        }
      }

      // After all attempts, if still no session, show resend form
      if (mounted) {
        console.log('ResetPassword: ✗ No session after all attempts - showing resend form');
        setShowResendForm(true);
        setCheckingRecovery(false);
      }
    };

    performSessionChecks();

    return () => {
      mounted = false;
      clearTimeout(sessionCheckTimeout);
      clearTimeout(finalValidationTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset link sent! Check your email.");
      setTimeout(() => {
        navigate("/admin/login");
      }, 2000);
    } catch (error: any) {
      console.error('Resend reset link error:', error);
      toast.error(error.message || "Failed to send reset link");
      setResendLoading(false);
    }
  };

  if (checkingRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-center text-muted-foreground">Verifying your reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResendForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Link Expired</CardTitle>
            <CardDescription>
              This reset link is invalid or has expired. Enter your email to receive a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResendLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resendEmail">Email Address</Label>
                <Input
                  id="resendEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={resendLoading}>
                {resendLoading ? "Sending..." : "Send New Reset Link"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/admin/login")}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password updated successfully! You can now log in.");
      
      // Sign out to ensure clean state
      await supabase.auth.signOut();
      
      // Redirect to login - check if it was an admin based on referrer or default to user login
      setTimeout(() => {
        const wasAdmin = document.referrer.includes('/admin');
        navigate(wasAdmin ? "/admin/login" : "/auth");
      }, 1500);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || "Failed to reset password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
