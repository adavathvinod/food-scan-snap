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

interface FoodRecommendationsProps {
  scannedFood: string;
  language?: string;
}

const FoodRecommendations = ({ scannedFood, language = "en" }: FoodRecommendationsProps) => {
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
      if (!showRecommendations) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-food-recommendations', {
          body: { foodName: scannedFood, language }
        });

        if (error) throw error;
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        // Fallback to static recommendations
        setRecommendations(getDummyRecommendations(scannedFood));
      } finally {
        setIsLoading(false);
      }
    };

    if (scannedFood) {
      fetchRecommendations();
    }
  }, [scannedFood, language, showRecommendations]);

  const getDummyRecommendations = (food: string): FoodRecommendation[] => {
    const lowerFood = food.toLowerCase();
    
    if (lowerFood.includes("biryani") || lowerFood.includes("rice")) {
      return [
        {
          name: "Paneer Biryani",
          description: "Aromatic vegetarian biryani with cottage cheese",
          tag: "Protein Rich",
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300",
          orderLink: "https://www.zomato.com",
          platform: "Zomato"
        },
        {
          name: "Tandoori Chicken",
          description: "Grilled chicken marinated in Indian spices",
          tag: "High Protein",
          imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300",
          orderLink: "https://www.swiggy.com",
          platform: "Swiggy"
        },
        {
          name: "Low-Oil Biryani Pack",
          description: "Healthy biryani option with less oil",
          tag: "Low Calorie",
          imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300",
          orderLink: "https://www.amazon.in",
          platform: "Amazon"
        }
      ];
    } else if (lowerFood.includes("salad") || lowerFood.includes("juice")) {
      return [
        {
          name: "Mixed Fruit Smoothie",
          description: "Fresh fruits blended with yogurt",
          tag: "Vitamin Rich",
          imageUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=300",
          orderLink: "https://www.zomato.com",
          platform: "Zomato"
        },
        {
          name: "Quinoa Bowl",
          description: "Protein-packed quinoa with vegetables",
          tag: "Healthy Choice",
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
          orderLink: "https://www.swiggy.com",
          platform: "Swiggy"
        },
        {
          name: "Green Tea Pack",
          description: "Antioxidant-rich organic green tea",
          tag: "Detox",
          imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300",
          orderLink: "https://www.flipkart.com",
          platform: "Flipkart"
        }
      ];
    } else {
      return [
        {
          name: "Grilled Vegetables",
          description: "Healthy mix of seasonal vegetables",
          tag: "Low Calorie",
          imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300",
          orderLink: "https://www.zomato.com",
          platform: "Zomato"
        },
        {
          name: "Protein Shake",
          description: "Nutritious shake for fitness enthusiasts",
          tag: "Protein Rich",
          imageUrl: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300",
          orderLink: "https://www.amazon.in",
          platform: "Amazon"
        },
        {
          name: "Brown Rice Bowl",
          description: "Wholesome brown rice with dal",
          tag: "Fiber Rich",
          imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300",
          orderLink: "https://www.swiggy.com",
          platform: "Swiggy"
        }
      ];
    }
  };

  if (!showRecommendations) return null;

  const translations: any = {
    en: { title: "You May Also Like", orderNow: "Order Now" },
    hi: { title: "आपको यह भी पसंद आ सकता है", orderNow: "अभी ऑर्डर करें" },
    te: { title: "మీకు ఇవి కూడా నచ్చవచ్చు", orderNow: "ఇప్పుడే ఆర్డర్ చేయండి" }
  };

  const t = translations[language] || translations.en;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 mb-8">
      <Card className="border-0 bg-gradient-to-b from-card to-secondary/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[280px] space-y-3">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {recommendations.map((item, index) => (
                <Card key={index} className="min-w-[280px] max-w-[280px] overflow-hidden border border-border shadow-md hover:shadow-lg transition-shadow">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground">
                      {item.tag}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(item.orderLink, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
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

export default FoodRecommendations;
