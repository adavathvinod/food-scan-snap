import { useState } from "react";
import { Loader2, UtensilsCrossed } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import NutritionCard from "@/components/NutritionCard";
import { toast } from "sonner";

interface NutritionData {
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  healthTip: string;
}

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);

  const analyzeFood = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        // Call edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-food`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ image: base64Image }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to analyze food");
        }

        const data = await response.json();
        setNutritionData(data);
        toast.success("Food analyzed successfully!");
      };
      
      reader.onerror = () => {
        throw new Error("Failed to read image file");
      };
    } catch (error) {
      console.error("Error analyzing food:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze food");
      setNutritionData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setNutritionData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 shadow-lg">
            <UtensilsCrossed className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            FoodAI Scanner
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Upload a photo of your food and get instant nutrition insights powered by AI
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!nutritionData ? (
            <div className="space-y-6">
              <ImageUpload onImageSelect={analyzeFood} isAnalyzing={isAnalyzing} />
              
              {isAnalyzing && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                  <p className="text-lg font-medium text-foreground">Analyzing your food...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take a few moments
                  </p>
                </div>
              )}
            </div>
          ) : (
            <NutritionCard data={nutritionData} onScanAnother={resetScan} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Powered by Google Gemini AI & CalorieNinjas API</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
