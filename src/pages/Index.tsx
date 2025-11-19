import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import CameraCapture from "@/components/CameraCapture";
import MultiItemNutritionCard from "@/components/MultiItemNutritionCard";
import FoodRecommendations from "@/components/FoodRecommendations";
import ShareStoryDialog from "@/components/ShareStoryDialog";
import Layout from "@/components/Layout";
import { FoodScanWarning } from "@/components/FoodScanWarning";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NutritionData {
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  healthTip: string;
  quickAdvice: string;
  items: any[];
  isMultiItem: boolean;
}

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const analyzeFood = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setSelectedFile(file);
    
    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;
          
          const { data, error } = await supabase.functions.invoke("analyze-food", {
            body: { image: base64Image },
          });

          if (error) throw error;

          // Upload image to storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('food-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error("Storage error:", uploadError);
          }

          const imageUrl = uploadData 
            ? supabase.storage.from('food-images').getPublicUrl(fileName).data.publicUrl
            : null;

          // Store image URL for sharing
          if (imageUrl) {
            setUploadedImageUrl(imageUrl);
          }

          // Save to database
          const { error: dbError } = await supabase
            .from('scan_history')
            .insert({
              user_id: user.id,
              food_name: data.foodName,
              calories: data.calories,
              protein: data.protein,
              fat: data.fat,
              carbs: data.carbs,
              health_tip: data.healthTip,
              image_url: imageUrl,
            });

          if (dbError) {
            console.error("Database error:", dbError);
          }

          setNutritionData({
            foodName: data.foodName,
            calories: data.calories,
            protein: data.protein,
            fat: data.fat,
            carbs: data.carbs,
            fiber: data.fiber || 0,
            healthTip: data.healthTip,
            quickAdvice: data.quickAdvice || "",
            items: data.items || [],
            isMultiItem: data.isMultiItem || false,
          });

          toast.success("Food analyzed and saved!");
        } catch (error: any) {
          console.error("Error analyzing food:", error);
          toast.error(error.message || "Failed to analyze food. Please try again.");
        } finally {
          setIsAnalyzing(false);
        }
      };

      reader.onerror = () => {
        console.error("FileReader error");
        toast.error("Failed to read image file. Please try again.");
        setIsAnalyzing(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error preparing analysis:", error);
      toast.error(error.message || "Failed to start analysis.");
      setIsAnalyzing(false);
    }
  }, [user]);

  const resetScan = useCallback(() => {
    setNutritionData(null);
    setSelectedFile(null);
    setUploadedImageUrl("");
  }, []);

  const handleShareStory = useCallback(() => {
    if (!nutritionData) {
      toast.error("Scan your food first to create your first Foody Story!");
      return;
    }
    
    if (!uploadedImageUrl) {
      toast.error("Food image not available. Please scan again.");
      return;
    }

    setShareDialogOpen(true);
  }, [nutritionData, uploadedImageUrl]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center justify-center space-y-6 p-8 rounded-lg bg-card/50 backdrop-blur-md border border-primary/20 shadow-lg animate-scale-in">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              <div className="absolute inset-0 w-16 h-16 animate-ping rounded-full bg-primary/20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-foreground">
                Analyzing your food… please wait 🍲
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Our AI is identifying the food and gathering nutrition information
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container max-w-2xl mx-auto p-4 pt-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground">
            Food Scan Snap
          </h1>
          <p className="text-muted-foreground">
            Capture or upload food images for instant nutrition insights
          </p>
        </header>

        {/* Main Content */}
        {!nutritionData ? (
          <div className="space-y-6">
            <div className="grid gap-4">
              <CameraCapture onCapture={analyzeFood} isAnalyzing={isAnalyzing} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <ImageUpload onImageSelect={analyzeFood} isAnalyzing={isAnalyzing} />
            </div>
          </div>
        ) : (
          <>
            <FoodScanWarning
              foodName={nutritionData.foodName}
              calories={nutritionData.calories}
              protein={nutritionData.protein}
              carbs={nutritionData.carbs}
              fat={nutritionData.fat}
              onGetAlternative={() => {
                const message = `I just scanned ${nutritionData.foodName}. Can you suggest a healthier alternative that's safe for my health conditions?`;
                navigate('/ai-chat', { state: { initialMessage: message } });
              }}
            />
            
            <MultiItemNutritionCard 
              data={nutritionData} 
              onScanAnother={resetScan}
              onShareStory={handleShareStory}
            />
            <FoodRecommendations 
              scannedFood={nutritionData.isMultiItem ? (nutritionData.items?.[0]?.name || nutritionData.foodName) : nutritionData.foodName} 
              language="en"
            />
          </>
        )}
      </div>

      {/* Share Story Dialog */}
      {nutritionData && uploadedImageUrl && (
        <ShareStoryDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          nutritionData={{
            foodName: nutritionData.foodName,
            calories: nutritionData.calories,
            protein: nutritionData.protein,
            fat: nutritionData.fat,
            carbs: nutritionData.carbs,
          }}
          imageUrl={uploadedImageUrl}
        />
      )}
    </Layout>
  );
};

export default Index;