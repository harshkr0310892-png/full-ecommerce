import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomerAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const redirectUrl =
          new URLSearchParams(window.location.search).get("redirect") ||
          "/profile";
        navigate(redirectUrl);
      }
    });
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/profile` },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast.error(error.message || "Google sign-in failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in email and password");
      return;
    }
    if (!isLogin && !formData.fullName) {
      toast.error("Please enter your full name");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;

        if (data.user) {
          localStorage.setItem("customer_user_id", data.user.id);
          toast.success("Welcome back!");
          const redirectUrl =
            new URLSearchParams(window.location.search).get("redirect") ||
            "/profile";
          navigate(redirectUrl);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { full_name: formData.fullName },
          },
        });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from("customer_profiles")
            .insert({ user_id: data.user.id, full_name: formData.fullName });

          if (profileError) console.error("Profile creation error:", profileError);

          localStorage.setItem("customer_user_id", data.user.id);
          toast.success("Account created!");
          const redirectUrl =
            new URLSearchParams(window.location.search).get("redirect") ||
            "/profile";
          navigate(redirectUrl);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else if (error.message?.includes("User already registered")) {
        toast.error("An account with this email already exists");
      } else {
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-200px)] px-4 py-10 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        {/* subtle glossy background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {isLogin ? "Sign in" : "Create account"}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {isLogin
                ? "Access your orders and profile."
                : "Create an account to start shopping."}
            </p>
          </div>

          {/* Glass Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/55 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
            {/* glossy highlights */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent" />
            <div className="pointer-events-none absolute -top-28 -right-28 h-64 w-64 rounded-full bg-white/35 blur-2xl dark:bg-white/10" />
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-white/60 dark:bg-white/15" />

            {/* Toggle */}
            <div className="relative p-4 sm:p-6 pb-0">
              <div className="grid grid-cols-2 rounded-xl bg-black/5 p-1 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-medium transition",
                    isLogin
                      ? "bg-white/80 text-slate-900 shadow-sm backdrop-blur dark:bg-slate-950/60 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-medium transition",
                    !isLogin
                      ? "bg-white/80 text-slate-900 shadow-sm backdrop-blur dark:bg-slate-950/60 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  )}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative p-4 sm:p-6 space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-200">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="John Doe"
                      className="h-11 pl-9 bg-white/70 dark:bg-slate-950/30"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    className="h-11 pl-9 bg-white/70 dark:bg-slate-950/30"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-200">
                  Password
                </Label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    className="h-11 pl-9 pr-10 bg-white/70 dark:bg-slate-950/30"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                )}
              </Button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/70 dark:border-slate-800/70" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs text-slate-500 dark:text-slate-400 bg-white/55 dark:bg-slate-900/50 backdrop-blur">
                    OR
                  </span>
                </div>
              </div>

              {/* Google button WITH logo */}
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full h-11 border-white/40 bg-white/40 hover:bg-white/55 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.07-3.71 1.07-2.86 0-5.29-1.95-6.16-4.55H2.18v2.87C4 20.53 7.7 23 12 23Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l2.66-2.87Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.36c1.62 0 3.06.57 4.21 1.68l3.15-2.97C17.45 2.24 14.97 1 12 1 7.7 1 4 3.47 2.18 7.04l3.66 2.87C6.71 7.31 9.14 5.36 12 5.36Z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </span>
              </Button>

              <p className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                By continuing, you agree to our{" "}
                <a href="/terms" className="underline underline-offset-2">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy" className="underline underline-offset-2">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
