import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FoodScanWarningProps {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  onGetAlternative?: () => void;
}

export const FoodScanWarning = ({ 
  foodName, 
  calories, 
  protein, 
  carbs, 
  fat,
  onGetAlternative 
}: FoodScanWarningProps) => {
  const [analysis, setAnalysis] = useState<{
    status: 'safe' | 'warning' | 'harmful';
    message: string;
    reason: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeFoodAgainstConditions();
  }, [foodName]);

  const analyzeFoodAgainstConditions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get active health conditions
      const { data: conditions } = await supabase
        .from('user_health_conditions')
        .select('condition_name, severity')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!conditions || conditions.length === 0) {
        setLoading(false);
        return;
      }

      // Simple rule-based analysis
      const conditionNames = conditions.map(c => c.condition_name.toLowerCase());
      let status: 'safe' | 'warning' | 'harmful' = 'safe';
      let message = '';
      let reason = '';

      // Diabetes checks
      if (conditionNames.some(c => c.includes('diabetes'))) {
        if (carbs > 50) {
          status = 'harmful';
          message = '⚠️ High carbs may spike blood sugar';
          reason = 'This food has high carbohydrates which can significantly impact blood glucose levels.';
        } else if (carbs > 30) {
          status = 'warning';
          message = '⚠️ Moderate carbs - monitor portion size';
          reason = 'Contains moderate carbs. Consider eating in smaller portions.';
        }
      }

      // Cholesterol checks
      if (conditionNames.some(c => c.includes('cholesterol'))) {
        if (fat > 15) {
          status = 'harmful';
          message = '⚠️ High fat content not recommended';
          reason = 'High fat content can worsen cholesterol levels.';
        } else if (fat > 10) {
          status = 'warning';
          message = '⚠️ Moderate fat - limit intake';
          reason = 'Contains moderate fat. Best consumed occasionally.';
        }
      }

      // Blood pressure checks
      if (conditionNames.some(c => c.includes('pressure') || c.includes('bp'))) {
        if (foodName.toLowerCase().includes('salt') || 
            foodName.toLowerCase().includes('pickle') ||
            foodName.toLowerCase().includes('papad')) {
          status = 'harmful';
          message = '⚠️ High sodium - avoid if possible';
          reason = 'Salty foods can increase blood pressure.';
        }
      }

      // Obesity/Weight checks
      if (conditionNames.some(c => c.includes('obesity') || c.includes('overweight'))) {
        if (calories > 400) {
          status = 'warning';
          message = '⚠️ High calorie food';
          reason = 'This is calorie-dense. Consider smaller portions.';
        }
      }

      // Kidney function checks
      if (conditionNames.some(c => c.includes('kidney'))) {
        if (protein > 25) {
          status = 'warning';
          message = '⚠️ High protein content';
          reason = 'High protein intake may stress kidneys. Consult your doctor about protein limits.';
        }
      }

      if (status === 'safe') {
        message = '✅ Safe for your health conditions';
        reason = 'This food appears suitable for your health profile.';
      }

      setAnalysis({ status, message, reason });
    } catch (error) {
      console.error('Error analyzing food:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analysis) return null;

  const Icon = analysis.status === 'safe' ? CheckCircle : 
               analysis.status === 'warning' ? Info : AlertTriangle;

  const variant = analysis.status === 'safe' ? 'default' : 
                  analysis.status === 'warning' ? 'default' : 'destructive';

  return (
    <Alert variant={variant} className="my-4">
      <Icon className="h-4 w-4" />
      <AlertTitle>{analysis.message}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{analysis.reason}</p>
        {analysis.status !== 'safe' && onGetAlternative && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGetAlternative}
            className="mt-2"
          >
            Get Healthier Alternative
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
