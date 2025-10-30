import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Bell, Globe } from "lucide-react";
import { toast } from "sonner";

const languages = [
  { code: "en", name: "English" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
  { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" }
];

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("en");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadSettings();
      }
    };
    checkUser();
  }, [navigate]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_language")
        .single();

      if (error) throw error;
      
      if (data?.preferred_language) {
        setLanguage(data.preferred_language);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveLanguage = async (newLang: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_language: newLang })
        .eq("id", user.id);

      if (error) throw error;
      
      setLanguage(newLang);
      toast.success("Language preference saved");
    } catch (error) {
      console.error("Error saving language:", error);
      toast.error("Failed to save language preference");
    }
  };

  const toggleReminders = async (enabled: boolean) => {
    setRemindersEnabled(enabled);
    
    if (enabled) {
      // OneSignal integration would be initialized here
      toast.success("Meal reminders enabled");
    } else {
      toast.success("Meal reminders disabled");
    }
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto p-4 pb-24">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Settings</h1>

        <div className="space-y-4">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Preferred Language</Label>
                <Select value={language} onValueChange={saveLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  AI responses will be translated to your preferred language
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Meal Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified based on your meal schedule
                  </p>
                </div>
                <Switch
                  checked={remindersEnabled}
                  onCheckedChange={toggleReminders}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-foreground text-center">
                Food Scan Snap - Your AI-powered nutrition companion
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Version 1.0.0
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
