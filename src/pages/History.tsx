import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ScanRecord {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  health_tip: string | null;
  image_url: string | null;
  scanned_at: string;
}

const History = () => {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("scan_history")
        .select("*")
        .order("scanned_at", { ascending: false });

      if (error) throw error;
      setScans(data || []);
    } catch (error: any) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scan_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setScans(scans.filter(scan => scan.id !== id));
      toast.success("Scan deleted");
    } catch (error: any) {
      toast.error("Failed to delete scan");
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto p-4 pt-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Scan History</h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : scans.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center text-muted-foreground">
              No scans yet. Start scanning food to build your history!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <Card key={scan.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {scan.image_url && (
                      <img
                        src={scan.image_url}
                        alt={scan.food_name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-xl">{scan.food_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(scan.scanned_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteScan(scan.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{scan.calories}</p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{scan.protein}g</p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{scan.fat}g</p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{scan.carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                  </div>
                  {scan.health_tip && (
                    <p className="text-sm text-muted-foreground">{scan.health_tip}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default History;