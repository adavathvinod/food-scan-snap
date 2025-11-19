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
    let validationTimeout: NodeJS.Timeout;
    
    // Check if URL contains recovery token (hash fragment)
    const hasRecoveryToken = window.location.hash.includes('access_token') || 
                            window.location.hash.includes('type=recovery');

    console.log('ResetPassword: Has recovery token in URL:', hasRecoveryToken);

    // Set up auth state listener to catch PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('ResetPassword: Auth event:', event, 'Session:', !!session);
      
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' && session) {
        // Valid recovery link - show password reset form
        console.log('ResetPassword: Valid recovery detected via event');
        clearTimeout(validationTimeout);
        setIsValidRecovery(true);
        setCheckingRecovery(false);
        setShowResendForm(false);
      } else if (event === 'SIGNED_IN' && session && hasRecoveryToken) {
        // Sometimes SIGNED_IN fires instead of PASSWORD_RECOVERY
        console.log('ResetPassword: Valid recovery detected via SIGNED_IN');
        clearTimeout(validationTimeout);
        setIsValidRecovery(true);
        setCheckingRecovery(false);
        setShowResendForm(false);
      }
    });

    // Check for existing session after a brief delay to let Supabase process the URL
    const checkSession = async () => {
      // If there's a recovery token, give Supabase more time to process it
      const initialDelay = hasRecoveryToken ? 1000 : 500;
      
      await new Promise(resolve => setTimeout(resolve, initialDelay));
      
      if (!mounted) return;

      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('ResetPassword: Session check after delay:', !!session);

      if (session) {
        // There's a session - show password reset form
        console.log('ResetPassword: Valid recovery session found');
        setIsValidRecovery(true);
        setCheckingRecovery(false);
      } else if (hasRecoveryToken) {
        // Has token but no session yet, wait longer (token is still being processed)
        console.log('ResetPassword: Token detected, waiting for processing...');
        validationTimeout = setTimeout(() => {
          if (mounted) {
            console.log('ResetPassword: Token processing timeout - showing resend form');
            setShowResendForm(true);
            setCheckingRecovery(false);
          }
        }, 5000); // Wait 5 seconds for token processing
      } else {
        // No token and no session - show resend form quickly
        console.log('ResetPassword: No token or session - showing resend form');
        setShowResendForm(true);
        setCheckingRecovery(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
      clearTimeout(validationTimeout);
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
