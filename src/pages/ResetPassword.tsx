import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        console.log('ResetPassword: No token in URL, showing resend form');
        setShowResendForm(true);
        setCheckingToken(false);
        return;
      }

      console.log('ResetPassword: Verifying token...');
      
      try {
        const { data, error } = await supabase.functions.invoke('verify-reset-token', {
          body: { token }
        });

        console.log('ResetPassword: Verification result:', data, error);

        if (error) throw error;

        if (data.valid) {
          console.log('ResetPassword: Token is valid');
          setIsValidToken(true);
          setUserEmail(data.email);
        } else {
          console.log('ResetPassword: Token is invalid:', data.error);
          toast.error(data.error || "Invalid or expired reset link");
          setShowResendForm(true);
        }
      } catch (error: any) {
        console.error('ResetPassword: Error verifying token:', error);
        toast.error("Invalid or expired reset link. Please request a new one.");
        setShowResendForm(true);
      } finally {
        setCheckingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setResendLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: resendEmail }
      });

      if (error) throw error;

      toast.success(data.message || "Password reset link sent! Check your email.");
      setTimeout(() => {
        navigate("/admin/login");
      }, 2000);
    } catch (error: any) {
      console.error('Resend reset link error:', error);
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setResendLoading(false);
    }
  };

  if (checkingToken) {
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
      const { data, error } = await supabase.functions.invoke('reset-password-with-token', {
        body: { token, password }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success("Password updated successfully! You can now log in.");
      
      setTimeout(() => {
        // Redirect based on user type (check if email contains admin patterns)
        const isAdmin = userEmail.includes('admin') || userEmail.includes('foodyscan');
        navigate(isAdmin ? "/admin/login" : "/auth");
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
