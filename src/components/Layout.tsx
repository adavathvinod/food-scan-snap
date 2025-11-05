import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Camera, History, Target, User, MoreHorizontal, FileText, MessageCircle, Heart, Settings, ImagePlus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const primaryNavItems = [
    { path: "/", icon: Camera, label: "Scan" },
    { path: "/history", icon: History, label: "History" },
    { path: "/goals", icon: Target, label: "Goals" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const moreItems = [
    { path: "/stories", icon: ImagePlus, label: "Story Gallery" },
    { path: "/reports", icon: FileText, label: "Medical Reports" },
    { path: "/chat", icon: MessageCircle, label: "AI Chat" },
    { path: "/advice", icon: Heart, label: "Health Advice" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary pb-20">
      {children}
      
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {primaryNavItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
          
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>More Features</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-4 mt-6 mb-4">
                {moreItems.map(({ path, icon: Icon, label }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSheetOpen(false)}
                      className={`flex flex-col items-center justify-center p-6 rounded-lg border transition-colors ${
                        isActive
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-card border-border hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium text-center">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
};

export default Layout;