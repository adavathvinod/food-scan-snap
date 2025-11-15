import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import History from "./pages/History";
import Goals from "./pages/Goals";
import Profile from "./pages/Profile";
import MedicalReports from "./pages/MedicalReports";
import AIChat from "./pages/AIChat";
import ConditionAdvice from "./pages/ConditionAdvice";
import Settings from "./pages/Settings";
import StoryGallery from "./pages/StoryGallery";
import Pricing from "./pages/Pricing";
import EnterpriseContact from "./pages/EnterpriseContact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import AboutUs from "./pages/AboutUs";
import Disclaimer from "./pages/Disclaimer";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import UsersManagement from "./pages/admin/UsersManagement";
import PaymentsManagement from "./pages/admin/PaymentsManagement";
import SecuritySettings from "./pages/admin/SecuritySettings";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
