import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({
    id: "",
    email: "",
    full_name: "",
    profile_photo: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile({
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name || "",
        profile_photo: profileData.profile_photo || "",
      });
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email: profile.email,
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, profile_photo: publicUrl });
      toast.success("Profile photo updated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords don't match");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;
      
      toast.success("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Profile</h1>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.profile_photo} />
                  <AvatarFallback>{profile.full_name?.[0] || "A"}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="photo" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md hover:bg-secondary/80">
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </div>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input value="Admin" disabled />
              </div>

              <Button onClick={handleUpdateProfile} disabled={updating}>
                {updating ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </div>

              <Button onClick={handleChangePassword} disabled={updating}>
                {updating ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminProfile;
