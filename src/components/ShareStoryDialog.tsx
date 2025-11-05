import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Share } from "@capacitor/share";
import StoryTemplate from "./StoryTemplate";

interface ShareStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutritionData: {
    foodName: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  imageUrl: string;
}

const ShareStoryDialog = ({ open, onOpenChange, nutritionData, imageUrl }: ShareStoryDialogProps) => {
  const [caption, setCaption] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<"minimal" | "bold" | "dark">("minimal");
  const [showWatermark, setShowWatermark] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load watermark preference
    const loadWatermarkPreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("user_settings")
          .select("show_watermark")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          setShowWatermark(data.show_watermark);
        }
      } catch (error) {
        console.error("Error loading watermark preference:", error);
      }
    };

    if (open) {
      loadWatermarkPreference();
      setCaption(`Just scanned my ${nutritionData.foodName}! 😋 #FoodyScan #HealthyEating`);
    }
  }, [open, nutritionData.foodName]);

  const generateStoryImage = async (): Promise<string> => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Canvas not found");

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to generate image"));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, "image/png");
    });
  };

  const saveStoryToDatabase = async (storyImageUrl: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("food_stories").insert({
        user_id: user.id,
        food_name: nutritionData.foodName,
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        fat: nutritionData.fat,
        carbs: nutritionData.carbs,
        template_style: selectedTemplate,
        caption: caption,
        image_url: imageUrl,
        story_image_url: storyImageUrl,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving story:", error);
      throw error;
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) throw new Error("Canvas not found");

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Failed to generate image");
        }

        // Create a File from the blob
        const file = new File([blob], `foodyscsan-${Date.now()}.png`, { type: "image/png" });

        // Try Capacitor Share API (works on mobile)
        try {
          const canShare = await Share.canShare();
          if (canShare.value) {
            // For mobile, we need to use a different approach
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64data = reader.result as string;
              
              await Share.share({
                title: `${nutritionData.foodName} - FoodyScan`,
                text: caption,
                url: base64data,
                dialogTitle: "Share your food story",
              });

              // Save to gallery
              await saveStoryToDatabase(base64data);
              toast.success("Story shared successfully!");
              onOpenChange(false);
            };
            reader.readAsDataURL(file);
            return;
          }
        } catch (e) {
          console.log("Capacitor Share not available, falling back to Web Share API");
        }

        // Fallback to Web Share API (works on some browsers)
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${nutritionData.foodName} - FoodyScan`,
            text: caption,
            files: [file],
          });

          // Save to database
          const blobUrl = URL.createObjectURL(blob);
          await saveStoryToDatabase(blobUrl);
          toast.success("Story shared successfully!");
          onOpenChange(false);
        } else {
          // If Web Share API not available, download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `foodyscan-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);

          await saveStoryToDatabase(url);
          toast.success("Story saved! You can manually share it from your device.");
          onOpenChange(false);
        }
      }, "image/png");
    } catch (error) {
      console.error("Error sharing story:", error);
      toast.error("Failed to share story. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    setIsSaving(true);
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) throw new Error("Canvas not found");

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Failed to generate image");

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `foodyscan-story-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        // Save to database
        await saveStoryToDatabase(url);
        toast.success("Story saved to your device!");
      }, "image/png");
    } catch (error) {
      console.error("Error downloading story:", error);
      toast.error("Failed to download story");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Food Story 🍽️</DialogTitle>
          <DialogDescription>
            Create a beautiful story from your food scan. Choose a template, add a caption, and share!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <Label className="mb-3 block">Choose Template</Label>
            <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="minimal">Clean Minimal</TabsTrigger>
                <TabsTrigger value="bold">Bold & Fun</TabsTrigger>
                <TabsTrigger value="dark">Dark Mode</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTemplate} className="mt-4">
                <StoryTemplate
                  foodName={nutritionData.foodName}
                  calories={nutritionData.calories}
                  protein={nutritionData.protein}
                  fat={nutritionData.fat}
                  carbs={nutritionData.carbs}
                  imageUrl={imageUrl}
                  template={selectedTemplate}
                  caption={caption}
                  showWatermark={showWatermark}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Caption Input */}
          <div>
            <Label htmlFor="caption" className="mb-2 block">
              Add Caption (Optional)
            </Label>
            <Textarea
              id="caption"
              placeholder="Add your caption here..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {caption.length}/150 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleShare}
              disabled={isSharing || isSaving}
              className="flex-1"
              size="lg"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Story
                </>
              )}
            </Button>

            <Button
              onClick={handleDownload}
              disabled={isSharing || isSaving}
              variant="outline"
              size="lg"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your story will be saved to your Story Gallery automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareStoryDialog;
