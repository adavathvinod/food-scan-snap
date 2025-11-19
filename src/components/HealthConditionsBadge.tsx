import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface HealthCondition {
  id: string;
  condition_name: string;
  severity?: string;
}

export const HealthConditionsBadge = () => {
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConditions();
  }, []);

  const loadConditions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_health_conditions')
        .select('id, condition_name, severity')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      setConditions(data || []);
    } catch (error) {
      console.error('Error loading health conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || conditions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-secondary/50 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Activity className="w-4 h-4" />
        <span>Your Health Profile:</span>
      </div>
      {conditions.map((condition) => (
        <Badge
          key={condition.id}
          variant="secondary"
          className="gap-1"
        >
          {condition.condition_name}
          {condition.severity && (
            <span className="text-xs opacity-70">({condition.severity})</span>
          )}
        </Badge>
      ))}
    </div>
  );
};
