import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface FoodRecommendation {
  name: string;
  description: string;
  tag: string;
  imageUrl: string;
  orderLink: string;
  platform: string;
}

interface MedicalFoodRecommendationsProps {
  foodsToEat?: string[];
  foodsToAvoid?: string[];
  language?: string;
}

const MedicalFoodRecommendations = ({ 
  foodsToEat = [], 
  foodsToAvoid = [],
  language = "en" 
}: MedicalFoodRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<FoodRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);

  useEffect(() => {
    const checkSettings = () => {
      const setting = localStorage.getItem("showFoodRecommendations");
      setShowRecommendations(setting !== "false");
    };
    
    checkSettings();
    window.addEventListener("storage", checkSettings);
    return () => window.removeEventListener("storage", checkSettings);
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!showRecommendations || foodsToEat.length === 0) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        console.log("Fetching medical food recommendations for:", foodsToEat);
        const { data, error } = await supabase.functions.invoke('get-medical-food-recommendations', {
          body: { 
            foodsToEat,
            foodsToAvoid,
            language 
          }
        });

        if (error) {
          console.error("Edge function error:", error);
          throw error;
        }
        
        console.log("Medical recommendations data:", data);
        const recs = data?.recommendations || [];
        setRecommendations(recs);
        
        // If no recommendations from API, use fallback
        if (recs.length === 0) {
          console.log("No recommendations from API, using fallback");
          setRecommendations(getFallbackRecommendations(foodsToEat));
        }
      } catch (error) {
        console.error("Error fetching medical recommendations:", error);
        setRecommendations(getFallbackRecommendations(foodsToEat));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [foodsToEat, foodsToAvoid, language, showRecommendations]);

  const getFallbackRecommendations = (foods: string[]): FoodRecommendation[] => {
    const link = (platform: string, term: string) => {
      const q = encodeURIComponent(term);
      if (platform === "Zomato") return `https://www.zomato.com/search?q=${q}`;
      if (platform === "Swiggy") return `https://www.swiggy.com/search?q=${q}`;
      if (platform === "Blinkit") return `https://blinkit.com/s/?q=${q}`;
      if (platform === "Amazon") return `https://www.amazon.in/s?k=${q}`;
      if (platform === "Flipkart") return `https://www.flipkart.com/search?q=${q}`;
      return `https://www.google.com/search?q=${q}`;
    };

    const fallbackItems: FoodRecommendation[] = [];
    
    // Generate recommendations based on common health foods
    if (foods.some(f => f.toLowerCase().includes("protein") || f.toLowerCase().includes("chicken") || f.toLowerCase().includes("fish"))) {
      fallbackItems.push({
        name: "Grilled Chicken Breast",
        description: "High protein, low fat chicken",
        tag: "High Protein",
        imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300",
        orderLink: link("Swiggy", "grilled chicken breast"),
        platform: "Swiggy"
      });
    }

    if (foods.some(f => f.toLowerCase().includes("fiber") || f.toLowerCase().includes("vegetables") || f.toLowerCase().includes("salad"))) {
      fallbackItems.push({
        name: "Fresh Salad Bowl",
        description: "Mixed greens with fiber-rich vegetables",
        tag: "Fiber Rich",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
        orderLink: link("Zomato", "fresh salad bowl"),
        platform: "Zomato"
      });
    }

    if (foods.some(f => f.toLowerCase().includes("fruit") || f.toLowerCase().includes("vitamin"))) {
      fallbackItems.push({
        name: "Mixed Fruit Bowl",
        description: "Seasonal fresh fruits",
        tag: "Vitamin Rich",
        imageUrl: "https://images.unsplash.com/photo-1504711331083-98345f3f44d1?w=300",
        orderLink: link("Blinkit", "mixed fruit bowl"),
        platform: "Blinkit"
      });
    }

    if (foods.some(f => f.toLowerCase().includes("green") || f.toLowerCase().includes("spinach") || f.toLowerCase().includes("kale"))) {
      fallbackItems.push({
        name: "Fresh Spinach Pack",
        description: "Iron-rich fresh spinach",
        tag: "Iron Rich",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300",
        orderLink: link("Blinkit", "fresh spinach"),
        platform: "Blinkit"
      });
    }

    // Default healthy items if no matches
    if (fallbackItems.length === 0) {
      fallbackItems.push(
        {
          name: "Greek Yogurt",
          description: "Probiotic-rich healthy yogurt",
          tag: "Healthy",
          imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300",
          orderLink: link("Blinkit", "greek yogurt"),
          platform: "Blinkit"
        },
        {
          name: "Oats & Granola",
          description: "Heart-healthy whole grain breakfast",
          tag: "Heart Healthy",
          imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=300",
          orderLink: link("Amazon", "oats granola"),
          platform: "Amazon"
        }
      );
    }

    return fallbackItems.slice(0, 4);
  };

  if (!showRecommendations || foodsToEat.length === 0) return null;

  const translations: any = {
    en: { title: "Recommended Foods to Order", orderNow: "Order Now" },
    hi: { title: "खाने के लिए सुझाए गए खाद्य पदार्थ", orderNow: "अभी ऑर्डर करें" },
    te: { title: "ఆర్డర్ చేయడానికి సిఫార్సు చేసిన ఆహారాలు", orderNow: "ఇప్పుడే ఆర్డర్ చేయండి" }
  };

  const t = translations[language] || translations.en;

  return (
    <div className="w-full mt-4">
      <Card className="border-0 bg-gradient-to-b from-card to-secondary/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[240px] space-y-3">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {recommendations.map((item, index) => (
                <Card key={index} className="min-w-[240px] max-w-[240px] overflow-hidden border border-border shadow-md hover:shadow-lg transition-shadow">
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs">
                      {item.tag}
                    </Badge>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => window.open(item.orderLink, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t.orderNow}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      via {item.platform}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalFoodRecommendations;
