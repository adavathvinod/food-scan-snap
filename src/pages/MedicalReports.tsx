import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import MedicalFoodRecommendations from "@/components/MedicalFoodRecommendations";

interface MedicalReport {
  id: string;
  report_type: string;
  extracted_data: any;
  recommendations: string;
  uploaded_at: string;
}

const MedicalReports = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadReports();
      }
    };
    checkUser();
  }, [navigate]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("medical_reports")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load medical reports");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;
          
          const { data, error } = await supabase.functions.invoke("analyze-medical-report", {
            body: { image: base64Image, reportType: "general" },
          });

          if (error) throw error;

          // Upload image to storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          
          const { data: uploadData } = await supabase.storage
            .from('medical-reports')
            .upload(fileName, file);

          const imageUrl = uploadData 
            ? supabase.storage.from('medical-reports').getPublicUrl(fileName).data.publicUrl
            : null;

          // Save to database
          const { error: dbError } = await supabase
            .from('medical_reports')
            .insert({
              user_id: user.id,
              report_type: data.reportType,
              extracted_data: data.extracted,
              recommendations: JSON.stringify(data.recommendations),
              image_url: imageUrl,
            });

          if (dbError) throw dbError;

          toast.success("Medical report analyzed successfully!");
          loadReports();
        } catch (error: any) {
          console.error("Error analyzing report:", error);
          toast.error(error.message || "Failed to analyze report");
        } finally {
          setAnalyzing(false);
        }
      };
    } catch (error: any) {
      console.error("Error reading file:", error);
      toast.error("Failed to read file");
      setAnalyzing(false);
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from("medical_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setReports(reports.filter(r => r.id !== id));
      toast.success("Report deleted");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  };

  if (loading || !user) {
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
        <h1 className="text-3xl font-bold mb-6 text-foreground">Medical Reports</h1>
        
        {/* Upload Section */}
        <Card className="mb-6 border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Upload Medical Report</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload lab reports for AI-powered analysis and personalized recommendations
            </p>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              disabled={analyzing}
              className="hidden"
              id="report-upload"
            />
            <Button
              onClick={() => document.getElementById('report-upload')?.click()}
              disabled={analyzing}
              className="w-full max-w-xs"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No medical reports yet. Upload one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const recommendations = typeof report.recommendations === 'string' 
                ? JSON.parse(report.recommendations) 
                : report.recommendations;
              
              return (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Medical Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(report.uploaded_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Extracted Data */}
                    {Object.keys(report.extracted_data).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-foreground">Lab Values</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(report.extracted_data).map(([key, value]) => (
                            <div key={key} className="bg-secondary/30 p-2 rounded">
                              <span className="text-muted-foreground">{key}:</span>{" "}
                              <span className="font-medium text-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {recommendations && (
                      <div className="space-y-3">
                        {recommendations.foodsToEat && recommendations.foodsToEat.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm text-foreground mb-1">Foods to Eat</h4>
                            <p className="text-sm text-muted-foreground">
                              {recommendations.foodsToEat.join(", ")}
                            </p>
                          </div>
                        )}
                        {recommendations.foodsToAvoid && recommendations.foodsToAvoid.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm text-foreground mb-1">Foods to Avoid</h4>
                            <p className="text-sm text-muted-foreground">
                              {recommendations.foodsToAvoid.join(", ")}
                            </p>
                          </div>
                        )}
                        {recommendations.plan30Days && (
                          <div>
                            <h4 className="font-semibold text-sm text-foreground mb-1">30-Day Plan</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {recommendations.plan30Days}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Food Ordering Recommendations */}
                    {recommendations && (
                      <MedicalFoodRecommendations
                        foodsToEat={recommendations.foodsToEat || []}
                        foodsToAvoid={recommendations.foodsToAvoid || []}
                      />
                    )}

                    <p className="text-xs text-muted-foreground italic">
                      ⚠️ For information only — consult a doctor for medical advice.
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MedicalReports;
