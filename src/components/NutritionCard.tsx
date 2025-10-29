import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Apple, Flame, Drumstick, Droplet, Wheat, Sparkles } from "lucide-react";

interface NutritionData {
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  healthTip: string;
}

interface NutritionCardProps {
  data: NutritionData;
  onScanAnother: () => void;
}

const NutritionCard = ({ data, onScanAnother }: NutritionCardProps) => {
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-gradient-to-b from-card to-secondary/20">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <Apple className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          {data.foodName}
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

        {/* Action Button */}
        <Button onClick={onScanAnother} className="w-full" size="lg">
          Scan Another Food
        </Button>
      </CardContent>
    </Card>
  );
};

export default NutritionCard;
