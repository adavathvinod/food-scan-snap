import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut } from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface Profile {
  email: string;
  full_name: string;
}

interface Stats {
  totalScans: number;
  avgDailyCalories: number;
}

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { t, loading: translationLoading } = useTranslation([
    "Profile", "Personal Information", "Manage your account details",
    "Email", "Full Name", "Save", "Cancel", "Edit Profile",
    "Your Stats", "Track your scanning activity", "Total Scans",
    "Avg Calories/Scan", "Log Out", "Profile updated!",
    "Failed to update profile", "Failed to log out"
  ]);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return { email: data.email, full_name: data.full_name || "" };
    },
  });

  const { data: stats = { totalScans: 0, avgDailyCalories: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ["profileStats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scan_history").select("calories, scanned_at");
      if (error) throw error;
      const totalScans = data.length;
      const totalCalories = data.reduce((sum, scan) => sum + scan.calories, 0);
      const avgDailyCalories = totalScans > 0 ? Math.round(totalCalories / totalScans) : 0;
      return { totalScans, avgDailyCalories };
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Profile updated!"));
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error(t("Failed to update profile")),
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error(t("Failed to log out"));
    }
  };

  const handleEdit = () => {
    if (profileData) {
      setFullName(profileData.full_name);
      setEditing(true);
    }
  };

  const loading = profileLoading || statsLoading || translationLoading;

  if (loading) {
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
      <div className="container max-w-4xl mx-auto p-4 pt-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">{t("Profile")}</h1>

        {/* Profile Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("Personal Information")}</CardTitle>
            <CardDescription>{t("Manage your account details")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("Email")}</Label>
              <Input value={profileData?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("Full Name")}</Label>
              <Input
                value={editing ? fullName : (profileData?.full_name || "")}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!editing}
              />
            </div>
            {editing ? (
              <div className="flex gap-2">
                <Button onClick={() => saveProfileMutation.mutate()} className="flex-1">{t("Save")}</Button>
                <Button onClick={() => setEditing(false)} variant="outline" className="flex-1">{t("Cancel")}</Button>
              </div>
            ) : (
              <Button onClick={handleEdit} className="w-full">{t("Edit Profile")}</Button>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("Your Stats")}</CardTitle>
            <CardDescription>{t("Track your scanning activity")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-3xl font-bold text-primary">{stats.totalScans}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("Total Scans")}</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-3xl font-bold text-primary">{stats.avgDailyCalories}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("Avg Calories/Scan")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button onClick={handleLogout} variant="destructive" className="w-full">
          <LogOut className="w-4 h-4 mr-2" />
          {t("Log Out")}
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;
