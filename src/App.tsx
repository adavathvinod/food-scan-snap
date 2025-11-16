import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Immediate load for critical pages
import Auth from "./pages/Auth";
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const History = lazy(() => import("./pages/History"));
const Goals = lazy(() => import("./pages/Goals"));
const Profile = lazy(() => import("./pages/Profile"));
const MedicalReports = lazy(() => import("./pages/MedicalReports"));
const AIChat = lazy(() => import("./pages/AIChat"));
const ConditionAdvice = lazy(() => import("./pages/ConditionAdvice"));
const Settings = lazy(() => import("./pages/Settings"));
const StoryGallery = lazy(() => import("./pages/StoryGallery"));
const Pricing = lazy(() => import("./pages/Pricing"));
const EnterpriseContact = lazy(() => import("./pages/EnterpriseContact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const PaymentsManagement = lazy(() => import("./pages/admin/PaymentsManagement"));
const SecuritySettings = lazy(() => import("./pages/admin/SecuritySettings"));
const ProtectedAdminRoute = lazy(() => import("./components/admin/ProtectedAdminRoute"));

// Optimized QueryClient with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Index />} />
            <Route path="/history" element={<History />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<MedicalReports />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/advice" element={<ConditionAdvice />} />
            <Route path="/stories" element={<StoryGallery />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/enterprise-contact" element={<EnterpriseContact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/profile" element={<ProtectedAdminRoute><AdminProfile /></ProtectedAdminRoute>} />
            <Route path="/admin/users" element={<ProtectedAdminRoute><UsersManagement /></ProtectedAdminRoute>} />
            <Route path="/admin/payments" element={<ProtectedAdminRoute><PaymentsManagement /></ProtectedAdminRoute>} />
            <Route path="/admin/security" element={<ProtectedAdminRoute><SecuritySettings /></ProtectedAdminRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
