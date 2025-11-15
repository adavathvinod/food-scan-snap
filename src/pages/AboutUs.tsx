import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AboutUs = () => {
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
              <CardTitle className="text-2xl font-bold">About Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-4">
              <p className="text-foreground leading-relaxed">
                Welcome to our food nutrition analysis platform. We are dedicated to helping 
                individuals make informed dietary choices through advanced AI-powered food 
                recognition and nutritional analysis technology.
              </p>
              
              <p className="text-foreground leading-relaxed">
                Our mission is to simplify nutrition tracking and promote healthier eating 
                habits. By leveraging cutting-edge artificial intelligence, we provide instant 
                nutritional insights from food images, making it easier than ever to monitor 
                your daily intake.
              </p>

              <p className="text-foreground leading-relaxed">
                Whether you're managing your weight, tracking macros, or simply curious about 
                what you eat, our platform offers comprehensive tools to support your health 
                journey. We believe that understanding nutrition should be accessible to everyone.
              </p>

              <p className="text-foreground leading-relaxed">
                Thank you for choosing our platform. We're committed to continuously improving 
                our services to better serve your nutritional needs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUs;
