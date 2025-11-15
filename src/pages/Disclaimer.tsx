import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Disclaimer = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-4">
              <p className="text-foreground leading-relaxed">
                The information provided by this application is for general informational 
                purposes only. While we strive to provide accurate nutritional data through 
                AI-powered analysis, the results should not be considered as professional 
                medical or dietary advice.
              </p>
              
              <p className="text-foreground leading-relaxed">
                <strong>Medical Advice:</strong> This application is not a substitute for 
                professional medical advice, diagnosis, or treatment. Always consult with a 
                qualified healthcare provider or registered dietitian regarding any health 
                concerns or dietary needs.
              </p>

              <p className="text-foreground leading-relaxed">
                <strong>Accuracy:</strong> Nutritional values are estimates based on AI 
                analysis and may vary from actual values. Factors such as portion sizes, 
                preparation methods, and ingredient variations can affect accuracy.
              </p>

              <p className="text-foreground leading-relaxed">
                <strong>Allergies:</strong> This application does not detect allergens. 
                If you have food allergies or dietary restrictions, please verify ingredients 
                independently and consult with healthcare professionals.
              </p>

              <p className="text-foreground leading-relaxed">
                <strong>Liability:</strong> We are not liable for any decisions made based 
                on the information provided by this application. Users assume full 
                responsibility for their dietary choices and health decisions.
              </p>

              <p className="text-foreground leading-relaxed">
                By using this application, you acknowledge that you have read and understood 
                this disclaimer and agree to use the service at your own risk.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Disclaimer;
