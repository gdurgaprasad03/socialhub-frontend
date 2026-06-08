import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Posts from "@/pages/Posts";
import ScheduledPosts from "@/pages/ScheduledPosts";
import ConnectedAccounts from "@/pages/ConnectedAccounts";
import ConnectCallback from "@/pages/ConnectCallback";
import Dashboard from "@/pages/Dashboard";
import Drafts from "@/pages/Drafts";
import SocialAuthCallback from "@/pages/SocialAuthCallback";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import CalendarPage from "@/pages/CalendarPage";
import Billing from "@/pages/Billing";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AuthRequired = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/dashboard/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
          <Route path="/dashboard/scheduled" element={<ProtectedRoute><ScheduledPosts /></ProtectedRoute>} />
          <Route path="/dashboard/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
          <Route path="/dashboard/accounts" element={<ProtectedRoute><ConnectedAccounts /></ProtectedRoute>} />
          <Route path="/dashboard/accounts/callback/:platform" element={<ProtectedRoute><ConnectCallback /></ProtectedRoute>} />
          <Route path="/dashboard/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/social/success" element={<AuthRequired><SocialAuthCallback /></AuthRequired>} />
          <Route path="/social/error" element={<AuthRequired><SocialAuthCallback /></AuthRequired>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
