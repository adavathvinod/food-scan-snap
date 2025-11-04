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
        console.log("Fetching recommendations for:", scannedFood);
        const { data, error } = await supabase.functions.invoke('get-food-recommendations', {
          body: { foodName: scannedFood, language }
        });

        if (error) {
          console.error("Edge function error:", error);
          throw error;
        }
        
        console.log("Recommendations data:", data);
        const recs = data?.recommendations || [];
        console.log("Setting recommendations:", recs);
        setRecommendations(recs);
        
        // If no recommendations from API, use dummy data
        if (recs.length === 0) {
          console.log("No recommendations from API, using fallback");
          setRecommendations(getDummyRecommendations(scannedFood));
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        // Fallback to static recommendations
        const fallback = getDummyRecommendations(scannedFood);
        console.log("Using dummy recommendations:", fallback);
        setRecommendations(fallback);
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
    const link = (platform: string, term: string) => {
      const q = encodeURIComponent(term);
      if (platform === "Zomato") return `https://www.zomato.com/search?q=${q}`;
      if (platform === "Swiggy") return `https://www.swiggy.com/search?q=${q}`;
      if (platform === "Blinkit") return `https://blinkit.com/s/?q=${q}`;
      if (platform === "Amazon") return `https://www.amazon.in/s?k=${q}`;
      if (platform === "Flipkart") return `https://www.flipkart.com/search?q=${q}`;
      return `https://www.google.com/search?q=${q}`;
    };
    
    if (lowerFood.includes("biryani") || lowerFood.includes("rice")) {
      return [
        {
          name: "Boondi Raita",
          description: "Cool yogurt with crispy boondi pearls",
          tag: "Popular",
          imageUrl: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=300",
          orderLink: link("Zomato", "raita"),
          platform: "Zomato"
        },
        {
          name: "Mirchi Salan",
          description: "Hyderabadi chili peanut curry for biryani",
          tag: "Classic",
          imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300",
          orderLink: link("Zomato", "mirchi salan"),
          platform: "Zomato"
        },
        {
          name: "Tandoori Chicken",
          description: "Grilled chicken marinated in spices",
          tag: "High Protein",
          imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300",
          orderLink: link("Swiggy", "tandoori chicken"),
          platform: "Swiggy"
        },
        {
          name: "Soft Drink Can",
          description: "Cola / soda to pair with meals",
          tag: "Trending",
          imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300",
          orderLink: link("Blinkit", "coke can"),
          platform: "Blinkit"
        }
      ];
    } else if (lowerFood.includes("salad") || lowerFood.includes("juice")) {
      return [
        {
          name: "Green Salad",
          description: "Fresh salad with mixed greens",
          tag: "Healthy",
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
          orderLink: link("Zomato", "green salad"),
          platform: "Zomato"
        },
        {
          name: "Fruit Bowl",
          description: "Seasonal fruits, ready to eat",
          tag: "Vitamin Rich",
          imageUrl: "https://images.unsplash.com/photo-1504711331083-98345f3f44d1?w=300",
          orderLink: link("Swiggy", "fruit bowl"),
          platform: "Swiggy"
        },
        {
          name: "Cold-Pressed Juice",
          description: "Fresh cold-pressed juice pack",
          tag: "Detox",
          imageUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=300",
          orderLink: link("Blinkit", "cold pressed juice"),
          platform: "Blinkit"
        },
        {
          name: "Green Tea Pack",
          description: "Antioxidant-rich organic green tea",
          tag: "Light",
          imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300",
          orderLink: link("Flipkart", "green tea"),
          platform: "Flipkart"
        }
      ];
    } else {
      return [
        {
          name: "Masala Papad",
          description: "Crispy papad topped with onions and masala",
          tag: "Snack",
          imageUrl: "https://images.unsplash.com/photo-1626019183442-e48e8b8a4e0b?w=300",
          orderLink: link("Zomato", "masala papad"),
          platform: "Zomato"
        },
        {
          name: "Protein Shake",
          description: "Whey protein nutrition shake",
          tag: "Protein Rich",
          imageUrl: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300",
          orderLink: link("Amazon", "whey protein"),
          platform: "Amazon"
        },
        {
          name: "Curd (Dahi)",
          description: "Fresh curd to pair with meals",
          tag: "Cooling",
          imageUrl: "https://images.unsplash.com/photo-1604908553488-c6e6e8dc1bd8?w=300",
          orderLink: link("Blinkit", "dahi curd"),
          platform: "Blinkit"
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
