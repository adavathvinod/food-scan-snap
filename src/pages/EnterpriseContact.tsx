import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Mail, Phone, User, MessageSquare, ArrowLeft } from "lucide-react";

const EnterpriseContact = () => {
  const [formData, setFormData] = useState({
    organizationName: "",
    contactPerson: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('enterprise_inquiries')
        .insert({
          organization_name: formData.organizationName,
          contact_person: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          user_id: user?.id || null,
        });

      if (error) throw error;

      toast({
        title: "Inquiry Submitted! 🎉",
        description: "We'll contact you within 24 hours to discuss your requirements.",
      });

      setFormData({
        organizationName: "",
        contactPerson: "",
        email: "",
        phone: "",
        message: "",
      });

      setTimeout(() => navigate('/pricing'), 2000);
    } catch (error: any) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/pricing')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pricing
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">Enterprise Plan Inquiry</CardTitle>
            <CardDescription className="text-base">
              Tell us about your organization and we'll create a custom solution for you
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="organizationName">
                  <Building2 className="inline h-4 w-4 mr-2" />
                  Organization Name *
                </Label>
                <Input
                  id="organizationName"
                  placeholder="Enter your organization name"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">
                  <User className="inline h-4 w-4 mr-2" />
                  Contact Person *
                </Label>
                <Input
                  id="contactPerson"
                  placeholder="Enter contact person name"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  <MessageSquare className="inline h-4 w-4 mr-2" />
                  Your Requirements *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your organization size, requirements, and how you plan to use our platform..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ We'll review your requirements within 24 hours</li>
                  <li>✓ Our team will schedule a demo call with you</li>
                  <li>✓ We'll prepare a custom quote based on your needs</li>
                  <li>✓ You'll get dedicated onboarding support</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EnterpriseContact;