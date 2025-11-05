import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Drumstick, Droplet, Wheat, Sparkles, Info } from "lucide-react";

interface FoodItem {
  name: string;
  icon: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

interface MultiItemNutritionData {
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  healthTip: string;
  quickAdvice: string;
  items: FoodItem[];
  isMultiItem: boolean;
}

interface MultiItemNutritionCardProps {
  data: MultiItemNutritionData;
  onScanAnother: () => void;
  onShareStory: () => void;
}

const MultiItemNutritionCard = ({ data, onScanAnother, onShareStory }: MultiItemNutritionCardProps) => {
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {/* Quick Advice Banner */}
      {data.quickAdvice && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">{data.quickAdvice}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Items */}
      {data.isMultiItem && data.items && data.items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">
            Detected Items ({data.items.length})
          </h3>
          <div className="grid gap-3">
            {data.items.map((item, index) => (
              <Card key={index} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground mb-2">{item.name}</h4>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <Flame className="w-3 h-3 text-primary mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Cal</p>
                          <p className="text-sm font-bold text-foreground">{item.calories}</p>
                        </div>
                        <div>
                          <Drumstick className="w-3 h-3 text-primary mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Protein</p>
                          <p className="text-sm font-bold text-foreground">{item.protein}g</p>
                        </div>
                        <div>
                          <Droplet className="w-3 h-3 text-primary mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Fat</p>
                          <p className="text-sm font-bold text-foreground">{item.fat}g</p>
                        </div>
                        <div>
                          <Wheat className="w-3 h-3 text-primary mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Carbs</p>
                          <p className="text-sm font-bold text-foreground">{item.carbs}g</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Total Summary Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-b from-card to-secondary/20">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-foreground">
            {data.isMultiItem ? "Total Meal Summary" : data.foodName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nutrition Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Calories</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.calories}</p>
            </div>
            
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Drumstick className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Protein</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.protein}g</p>
            </div>
            
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Fat</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.fat}g</p>
            </div>
            
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Wheat className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Carbs</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{data.carbs}g</p>
            </div>
          </div>

          {data.fiber > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Wheat className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Fiber</span>
              </div>
              <p className="text-xl font-bold text-foreground">{data.fiber}g</p>
            </div>
          )}

          {/* Health Tip */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-1">Health Tip</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.healthTip}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={onScanAnother} variant="outline" className="flex-1" size="lg">
              Scan Another
            </Button>
            <Button 
              onClick={onShareStory}
              className="flex-1" 
              size="lg"
            >
              Share Story 🎉
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiItemNutritionCard;
