import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import ForgotPassword from "./pages/ForgotPassword";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute, GuestRoute } from "./components/AuthRoutes";
import EditMessageModal from "./components/EditMessageModal";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });

  useEffect(() => {
    // Check authentication status when app loads
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });

  // Show loading indicator only during initial check
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      {/* Always show navbar for all users */}
      <Navbar />

      <Routes>
        {/* Protected routes - require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Guest routes - only accessible if NOT authenticated */}
        <Route element={<GuestRoute />}>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> 
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Public routes - accessible to everyone */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/about" element={<AboutUs />} />
      </Routes>

      <Toaster />
      
      {/* Global modals */}
      <EditMessageModal />
    </div>
  );
};
export default App;
