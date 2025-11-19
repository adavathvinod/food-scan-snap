import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log("Checking for recovery session");
      
      // Check for existing session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession && mounted) {
        console.log("Valid session found:", currentSession);
        setSession(currentSession);
        setIsValidating(false);
        return;
      }

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, currentSession: Session | null) => {
          console.log("Auth state changed:", event, currentSession);
          
          if (!mounted) return;

          if (event === "PASSWORD_RECOVERY" && currentSession) {
            console.log("Valid recovery session detected");
            setSession(currentSession);
            setIsValidating(false);
          } else if (event === "SIGNED_IN" && currentSession) {
            console.log("User signed in");
            setSession(currentSession);
            setIsValidating(false);
          }
        }
      );

      // Give Supabase a moment to process the recovery link
      setTimeout(() => {
        if (mounted && !session) {
          console.log("No valid session found after timeout");
          setIsValidating(false);
        }
      }, 2000);

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!session) {
      toast.error("Invalid or expired reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Updating password via Supabase");
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Reset error:", error);
        toast.error(error.message || "Failed to reset password");
        return;
      }

      toast.success("Password reset successfully!");
      
      // Sign out the user
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
    } catch (error: any) {
      console.error("Reset error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-lg border">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Link Expired</h1>
            <p className="text-muted-foreground">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-lg border">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
