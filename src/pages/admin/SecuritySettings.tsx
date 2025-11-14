import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Key, AlertTriangle } from "lucide-react";

const SecuritySettings = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description: "Admin access is protected with role verification",
      status: "Active",
    },
    {
      icon: Lock,
      title: "Authentication System",
      description: "Supabase authentication with secure session management",
      status: "Active",
    },
    {
      icon: Key,
      title: "Row Level Security",
      description: "Database policies ensure users can only access their own data",
      status: "Active",
    },
    {
      icon: AlertTriangle,
      title: "Admin Route Protection",
      description: "All admin routes require valid admin role verification",
      status: "Active",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Settings</h1>
          <p className="text-muted-foreground">Overview of security features and configurations</p>
        </div>

        <div className="grid gap-6">
          {securityFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <CardTitle>{feature.title}</CardTitle>
                        <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          {feature.status}
                        </span>
                      </div>
                      <CardDescription className="mt-2">{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}

          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-5 h-5" />
                Security Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-800 space-y-2">
              <p>• Never share your admin credentials</p>
              <p>• Use strong, unique passwords</p>
              <p>• Regularly review user access and permissions</p>
              <p>• Monitor payment transactions for anomalies</p>
              <p>• Keep the application and dependencies updated</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SecuritySettings;
