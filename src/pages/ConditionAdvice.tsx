import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const commonConditions = [
  "Hair loss",
  "Low BP",
  "Acidity",
  "Diabetes",
  "Low energy",
  "Weight gain",
  "Thyroid",
  "High cholesterol",
  "PCOS",
  "Anemia"
];

interface Advice {
  foodSuggestions: {
    vegetarian: string[];
    nonVegetarian: string[];
  };
  habits: string[];
  rationale: string;
  disclaimer: string;
}

const ConditionAdvice = () => {
  const [selectedCondition, setSelectedCondition] = useState("");
  const [customCondition, setCustomCondition] = useState("");
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);
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
  }, [navigate]);

  const getAdvice = async (condition: string) => {
    if (!condition.trim()) return;

    setLoading(true);
    setAdvice(null);

    try {
      const { data, error } = await supabase.functions.invoke("condition-advice", {
        body: { condition },
      });

      if (error) throw error;

      setAdvice(data);
    } catch (error: any) {
      console.error("Error getting advice:", error);
      toast.error(error.message || "Failed to get advice");
    } finally {
      setLoading(false);
    }
  };

  const handleConditionSelect = (condition: string) => {
    setSelectedCondition(condition);
    setCustomCondition("");
    getAdvice(condition);
  };

  const handleCustomSubmit = () => {
    if (customCondition.trim()) {
      setSelectedCondition("");
      getAdvice(customCondition);
    }
  };

  if (!user) {
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
      <div className="container max-w-4xl mx-auto p-4 pb-24">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Health Condition Advice</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select a Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {commonConditions.map((condition) => (
                <Button
                  key={condition}
                  variant={selectedCondition === condition ? "default" : "outline"}
                  onClick={() => handleConditionSelect(condition)}
                  disabled={loading}
                  className="justify-start"
                >
                  {condition}
                </Button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or enter your own</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                placeholder="Enter any health condition or symptom..."
                disabled={loading}
              />
              <Button
                onClick={handleCustomSubmit}
                disabled={loading || !customCondition.trim()}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Getting personalized advice...</p>
            </CardContent>
          </Card>
        )}

        {advice && !loading && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Food Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-foreground">🥬 Vegetarian Options</h3>
                  <ul className="space-y-2">
                    {advice.foodSuggestions.vegetarian?.map((food, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-primary mt-1">•</span>
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-foreground">🍗 Non-Vegetarian Options</h3>
                  <ul className="space-y-2">
                    {advice.foodSuggestions.nonVegetarian?.map((food, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-primary mt-1">•</span>
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lifestyle Habits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {advice.habits.map((habit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-primary mt-1">•</span>
                      <span>{habit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why This Helps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{advice.rationale}</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-foreground">
                  {advice.disclaimer}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ConditionAdvice;
