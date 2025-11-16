import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TranslatedText } from "@/components/TranslatedText";

const PrivacyPolicy = () => {
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
            <TranslatedText text="Back" />
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                <TranslatedText text="Privacy Policy" />
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <TranslatedText 
                text="We value your privacy. We collect basic information such as name, email, contact number, and usage activity only to improve service quality, user experience, and communication. We do not sell, share, or misuse any data with third parties except when legally required. By using our platform, you agree to the collection and usage of information according to this policy. You can contact us anytime if you want to modify or delete your stored information." 
                as="p" 
                className="text-foreground leading-relaxed"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
