import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Loader2, Mail, Lock, User, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomerAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/profile';
        navigate(redirectUrl);
      }
    });
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Google sign-in failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!isLogin && !formData.fullName) {
      toast.error('Please enter your full name');
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
          localStorage.setItem('customer_user_id', data.user.id);
          toast.success('Welcome back!');
          const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/profile';
          navigate(redirectUrl);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { full_name: formData.fullName }
          }
        });
        if (error) throw error;
        if (data.user) {
          const { error: profileError } = await supabase
            .from('customer_profiles')
            .insert({ user_id: data.user.id, full_name: formData.fullName });
          if (profileError) console.error('Profile creation error:', profileError);
          localStorage.setItem('customer_user_id', data.user.id);
          toast.success('Account created successfully!');
          const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/profile';
          navigate(redirectUrl);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {/* Full-page background with animated gradient */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-950/20 via-background to-yellow-950/20" />
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-yellow-500/8 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-500/8 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-bounce"
              style={{
                left: `${15 + i * 15}%`,
                top: `${10 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-md mx-auto">
            {/* Logo / Brand Section */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="relative inline-block mb-6">
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 blur-xl opacity-40 animate-pulse" />
                {/* Crown icon container */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/25 mx-auto ring-2 ring-amber-300/20">
                  <Crown className="w-10 h-10 text-white drop-shadow-lg" />
                  <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-300 animate-pulse" />
                </div>
              </div>
              <h1 className="font-display text-4xl font-bold mb-3 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                {isLogin ? 'Welcome Back' : 'Join the Elite'}
              </h1>
              <p className="text-muted-foreground/80 text-sm max-w-xs mx-auto leading-relaxed">
                {isLogin
                  ? 'Sign in to access your exclusive orders and premium profile'
                  : 'Create your account to unlock premium features and track orders'}
              </p>
            </div>

            {/* Main Glass Card */}
            <div className="relative group">
              {/* Card border glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-yellow-400/10 to-amber-500/20 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/20">
                {/* Inner subtle gradient overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

                <div className="relative z-10">
                  {/* Toggle Buttons - Glassmorphism style */}
                  <div className="flex mb-8 bg-white/[0.04] backdrop-blur-sm rounded-xl p-1.5 border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 relative overflow-hidden",
                        isLogin
                          ? "bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-white shadow-lg shadow-amber-500/20"
                          : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      {isLogin && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                      )}
                      <span className="relative">Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 relative overflow-hidden",
                        !isLogin
                          ? "bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-white shadow-lg shadow-amber-500/20"
                          : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      {!isLogin && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                      )}
                      <span className="relative">Sign Up</span>
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name Field - Sign Up only */}
                    <div
                      className={cn(
                        "transition-all duration-500 overflow-hidden",
                        !isLogin ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2 block">
                        Full Name
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-sm opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center">
                          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center rounded-l-xl bg-white/[0.03] border-r border-white/[0.06]">
                            <User className="w-4 h-4 text-amber-400/60" />
                          </div>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Enter your full name"
                            className="pl-14 h-12 bg-white/[0.03] border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:border-amber-400/40 focus:ring-amber-400/20 transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <Label htmlFor="email" className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2 block">
                        Email Address
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-sm opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center">
                          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center rounded-l-xl bg-white/[0.03] border-r border-white/[0.06]">
                            <Mail className="w-4 h-4 text-amber-400/60" />
                          </div>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email"
                            className="pl-14 h-12 bg-white/[0.03] border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:border-amber-400/40 focus:ring-amber-400/20 transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <Label htmlFor="password" className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2 block">
                        Password
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-sm opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center">
                          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center rounded-l-xl bg-white/[0.03] border-r border-white/[0.06]">
                            <Lock className="w-4 h-4 text-amber-400/60" />
                          </div>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter your password"
                            className="pl-14 pr-12 h-12 bg-white/[0.03] border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:border-amber-400/40 focus:ring-amber-400/20 transition-all duration-300 backdrop-blur-sm"
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-amber-400/70 transition-colors duration-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {isLogin && (
                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="text-xs text-amber-400/60 hover:text-amber-300 transition-colors duration-200"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                      {!isLogin && (
                        <p className="text-[11px] text-muted-foreground/40 mt-2 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Minimum 6 characters required
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <div className="relative group/btn">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl blur opacity-30 group-hover/btn:opacity-50 transition-opacity duration-500" />
                        <Button
                          type="submit"
                          size="lg"
                          className="relative w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-300 border-0 overflow-hidden"
                          disabled={isLoading}
                        >
                          {/* Button shimmer */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                          <span className="relative flex items-center justify-center gap-2">
                            {isLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isLogin ? 'Signing in...' : 'Creating account...'}
                              </>
                            ) : (
                              <>
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                              </>
                            )}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </form>

                  {/* Divider */}
                  <div className="mt-8 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/[0.06]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-4 text-[11px] uppercase tracking-widest text-muted-foreground/40 bg-transparent backdrop-blur-xl">
                          Or continue with
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <div className="relative group/google">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 via-red-500/10 to-green-500/10 rounded-xl blur-sm opacity-0 group-hover/google:opacity-100 transition-opacity duration-500" />
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="relative w-full h-12 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] rounded-xl backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-3"
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                        <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C4 20.53 7.7 23 12 23Z" fill="#34A853" />
                        <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.04H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.96L5.84 14.09Z" fill="#FBBC05" />
                        <path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.04L19.36 4.07C17.45 2.24 14.97 1 12 1C7.7 1 4 3.47 2.18 7.04L5.84 9.91C6.71 7.31 9.14 5.36 12 5.36Z" fill="#EA4335" />
                      </svg>
                      <span className="text-muted-foreground/80 font-medium">Sign in with Google</span>
                    </Button>
                  </div>

                  {/* Footer text */}
                  <p className="mt-6 text-center text-[11px] text-muted-foreground/30 leading-relaxed">
                    By continuing, you agree to our{' '}
                    <button className="text-amber-400/50 hover:text-amber-300 transition-colors underline underline-offset-2">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button className="text-amber-400/50 hover:text-amber-300 transition-colors underline underline-offset-2">
                      Privacy Policy
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </Layout>
  );
}
