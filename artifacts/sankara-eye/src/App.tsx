import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Donate from "@/pages/donate";
import Dashboard from "@/pages/dashboard";
import EyeCalls from "@/pages/eye-calls";
import Units from "@/pages/units";
import Users from "@/pages/users";
import Profile from "@/pages/profile";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Mail, AlertTriangle, KeyRound, LogOut } from "lucide-react";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function SignInPage() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.mustChangePassword) {
        setLocation("/change-password");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const loggedUser = await login({ email, password });
      if (loggedUser.mustChangePassword) {
        setLocation("/change-password");
      } else {
        setLocation("/dashboard");
      }
    } catch (err: any) {
      setError(err?.data?.error || err?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-orange-50/50 via-white to-orange-100/30 px-4 gap-4 relative overflow-hidden">
      {/* Ambient Blur Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-200 rounded-full blur-[100px] opacity-40 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-[440px] flex justify-center pb-2 z-10">
        <img
          src={`${basePath}/logo.png`}
          alt="Sankara Eye Foundation"
          className="w-full max-w-[340px] h-auto object-contain hover:scale-[1.02] transition-transform duration-300"
        />
      </div>

      <Card className="w-full max-w-[440px] rounded-2xl bg-white/80 backdrop-blur-md shadow-xl border border-gray-100 overflow-hidden z-10">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 text-center">
            Eye Bank Management Portal
          </CardTitle>
          <CardDescription className="text-gray-500 text-center text-sm">
            Sign in to access coordinator services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-3">
              <AlertDescription className="text-sm font-medium leading-snug">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@sankaraeye.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white font-semibold py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="w-full max-w-[440px] rounded-xl bg-orange-50 border border-orange-100 px-5 py-3 flex items-start gap-3">
        <svg className="mt-0.5 shrink-0 text-orange-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-sm text-orange-800 leading-snug">
          <span className="font-semibold">Hospital Staff Only.</span> Sign in with your registered account. Access is restricted to authorised Sankara Eye Foundation staff.
        </p>
      </div>
    </div>
  );
}

function ForcedPasswordChangePage() {
  const { user, changePassword, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLocation("/sign-in");
    } else if (!user.mustChangePassword) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await changePassword({ oldPassword, newPassword });
      toast({
        title: "Success",
        description: "Password updated successfully. Welcome to your portal!",
      });
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err?.data?.error || err?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/sign-in");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 px-4 gap-4">
      <Card className="w-full max-w-[460px] rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 h-5 w-5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Forced Password Change Required</h3>
            <p className="text-xs text-amber-700 mt-0.5 leading-snug">
              For security reasons, all newly created accounts must change their temporary password before continuing.
            </p>
          </div>
        </div>

        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 text-center">
            Set Your Secure Password
          </CardTitle>
          <CardDescription className="text-gray-500 text-center">
            Configure a secure password to activate your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-3">
              <AlertDescription className="text-sm font-medium leading-snug">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword" className="text-sm font-medium text-gray-700">
                Current Password (temporary password)
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="oldPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password (minimum 8 characters)
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter secure password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                onClick={handleLogout}
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4" />
                Cancel & Sign Out
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    if (user.mustChangePassword) {
      return <Redirect to="/change-password" />;
    }
    return <Redirect to="/dashboard" />;
  }

  return <Home />;
}

function ProtectedRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  if (user.mustChangePassword) {
    return <Redirect to="/change-password" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function AuthProviderWithRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/donate" component={Donate} />
          <Route path="/sign-in" component={SignInPage} />
          <Route path="/change-password" component={ForcedPasswordChangePage} />
          
          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/eye-calls"><ProtectedRoute component={EyeCalls} /></Route>
          <Route path="/units"><ProtectedRoute component={Units} /></Route>
          <Route path="/users"><ProtectedRoute component={Users} /></Route>
          <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
          
          <Route component={NotFound} />
        </Switch>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <AuthProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;