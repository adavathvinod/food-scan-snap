import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut } from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";

interface Profile {
  email: string;
  full_name: string;
}

interface Stats {
  totalScans: number;
  avgDailyCalories: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile>({ email: "", full_name: "" });
  const [stats, setStats] = useState<Stats>({ totalScans: 0, avgDailyCalories: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({
          email: profileData.email,
          full_name: profileData.full_name || "",
        });
      }

      // Load stats
      const { data: scans } = await supabase
        .from("scan_history")
        .select("calories, scanned_at");

      if (scans) {
        const totalScans = scans.length;
        const totalCalories = scans.reduce((sum, scan) => sum + scan.calories, 0);
        const avgDailyCalories = totalScans > 0 ? Math.round(totalCalories / totalScans) : 0;
        setStats({ totalScans, avgDailyCalories });
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: profile.full_name })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated!");
      setEditing(false);
    } catch (error: any) {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to log out");
    }
  };

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
        <h1 className="text-3xl font-bold mb-6 text-foreground">Profile</h1>

        {/* Profile Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Manage your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                disabled={!editing}
              />
            </div>
            {editing ? (
              <div className="flex gap-2">
                <Button onClick={saveProfile} className="flex-1">Save</Button>
                <Button onClick={() => setEditing(false)} variant="outline" className="flex-1">Cancel</Button>
              </div>
            ) : (
              <Button onClick={() => setEditing(true)} className="w-full">Edit Profile</Button>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
            <CardDescription>Track your scanning activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-3xl font-bold text-primary">{stats.totalScans}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Scans</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-3xl font-bold text-primary">{stats.avgDailyCalories}</p>
                <p className="text-sm text-muted-foreground mt-1">Avg Calories/Scan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button onClick={handleLogout} variant="destructive" className="w-full">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;