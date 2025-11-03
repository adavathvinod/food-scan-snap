import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import CameraCapture from "@/components/CameraCapture";
import MultiItemNutritionCard from "@/components/MultiItemNutritionCard";
import FoodRecommendations from "@/components/FoodRecommendations";
import Layout from "@/components/Layout";
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

  const analyzeFood = async (file: File) => {
    setIsAnalyzing(true);
    setSelectedFile(file);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
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
      };
    } catch (error: any) {
      console.error("Error analyzing food:", error);
      toast.error(error.message || "Failed to analyze food. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setNutritionData(null);
    setSelectedFile(null);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
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
            
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg text-foreground font-medium">
                  Analyzing your food...
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Our AI is identifying the food and gathering nutrition information
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <MultiItemNutritionCard data={nutritionData} onScanAnother={resetScan} />
            <FoodRecommendations 
              scannedFood={nutritionData.foodName} 
              language="en"
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default Index;