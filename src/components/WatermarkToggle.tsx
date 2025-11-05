import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WatermarkToggle = () => {
  const [showWatermark, setShowWatermark] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatermarkPreference();
  }, []);

  const loadWatermarkPreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("show_watermark")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setShowWatermark(data.show_watermark);
      } else {
        // Create default settings if they don't exist
        const { error: insertError } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, show_watermark: true });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error loading watermark preference:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatermark = async (checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setShowWatermark(checked);

      const { error } = await supabase
        .from("user_settings")
        .upsert(
          { user_id: user.id, show_watermark: checked },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      toast.success(
        checked 
          ? "Watermark will appear on your stories" 
          : "Watermark will be hidden from your stories"
      );
    } catch (error) {
      console.error("Error updating watermark preference:", error);
      toast.error("Failed to update watermark setting");
      setShowWatermark(!checked); // Revert on error
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Show FoodyScan Watermark</Label>
        <p className="text-sm text-muted-foreground">
          Add "#FoodyScan" branding to your shared stories
        </p>
      </div>
      <Switch
        checked={showWatermark}
        onCheckedChange={toggleWatermark}
      />
    </div>
  );
};

export default WatermarkToggle;
