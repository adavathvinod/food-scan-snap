import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TranslatedText } from "@/components/TranslatedText";

const RefundPolicy = () => {
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
                <TranslatedText text="Refund & Cancellation Policy" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-foreground leading-relaxed">
                <li><TranslatedText text="Refund requests must be submitted within 5 days from the original date of payment." /></li>
                <li><TranslatedText text="Refunds will be processed only after proper verification." /></li>
                <li><TranslatedText text="Approved refunds will be initiated within 5–7 business days to the original payment method." /></li>
                <li><TranslatedText text="Processing time may vary depending on the bank or payment gateway." /></li>
                <li><TranslatedText text="Partially used or fully used digital subscription services are not eligible for a full refund." /></li>
                <li><TranslatedText text="Any fraudulent, misuse, or abnormal activity will lead to cancellation of refund." /></li>
              </ol>

              <div className="pt-4 border-t">
                <TranslatedText text="For any support, contact us:" as="p" className="font-semibold text-foreground mb-2" />
                <div className="flex items-center gap-2 text-foreground">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:foodyscan98@gmail.com" className="hover:underline">
                    foodyscan98@gmail.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;
