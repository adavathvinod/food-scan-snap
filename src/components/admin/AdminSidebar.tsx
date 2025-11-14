import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  User, 
  Users, 
  CreditCard, 
  Shield, 
  LogOut 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: User, label: "Profile", path: "/admin/profile" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: Shield, label: "Security", path: "/admin/security" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  return (
    <div className="w-64 bg-card border-r min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
