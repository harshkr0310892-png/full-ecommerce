import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Crown, 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomerAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
          toast.success('Welcome back to Cartlyfy!');
          
          const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/profile';
          navigate(redirectUrl);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('customer_profiles')
            .insert({
              user_id: data.user.id,
              full_name: formData.fullName,
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          localStorage.setItem('customer_user_id', data.user.id);
          toast.success('Welcome to Cartlyfy!');
          
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

  const passwordStrength = formData.password.length >= 8 ? 'strong' : 
                          formData.password.length >= 6 ? 'medium' : 'weak';

  return (
    <Layout>
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-full blur-[150px]" />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="relative inline-block mb-6">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
              
              {/* Glass logo container */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                <ShoppingBag className="w-10 h-10 md:w-12 md:h-12 text-white" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-2">
              {isLogin ? 'Welcome Back' : 'Join Cartlyfy'}
            </h1>
            <p className="text-white/60 text-sm md:text-base">
              {isLogin 
                ? 'Sign in to access your orders and profile' 
                : 'Create an account to start shopping'}
            </p>
          </div>

          {/* Glass Card */}
          <div className="relative animate-slide-up">
            {/* Card glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-violet-500/20 rounded-3xl blur-xl opacity-75" />
            
            {/* Main glass card */}
            <div className="relative bg-white/[0.08] backdrop-blur-2xl rounded-3xl border border-white/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* Inner glow at top */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              
              <div className="p-6 md:p-8">
                {/* Toggle Buttons */}
                <div className="flex mb-8 p-1.5 bg-white/[0.05] backdrop-blur-sm rounded-2xl border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 relative overflow-hidden",
                      isLogin 
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25" 
                        : "text-white/60 hover:text-white/80 hover:bg-white/[0.05]"
                    )}
                  >
                    {isLogin && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer" />
                    )}
                    <span className="relative">Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 relative overflow-hidden",
                      !isLogin 
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25" 
                        : "text-white/60 hover:text-white/80 hover:bg-white/[0.05]"
                    )}
                  >
                    {!isLogin && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer" />
                    )}
                    <span className="relative">Sign Up</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name Field (Sign Up only) */}
                  {!isLogin && (
                    <div className="animate-fade-in">
                      <Label htmlFor="fullName" className="text-white/80 text-sm font-medium mb-2 block">
                        Full Name
                      </Label>
                      <div className={cn(
                        "relative group transition-all duration-300",
                        focusedField === 'fullName' && "scale-[1.02]"
                      )}>
                        {/* Input glow on focus */}
                        <div className={cn(
                          "absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl opacity-0 blur transition-opacity duration-300",
                          focusedField === 'fullName' && "opacity-50"
                        )} />
                        
                        <div className="relative flex items-center">
                          <div className={cn(
                            "absolute left-4 transition-colors duration-300",
                            focusedField === 'fullName' ? "text-violet-400" : "text-white/40"
                          )}>
                            <User className="w-5 h-5" />
                          </div>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            onFocus={() => setFocusedField('fullName')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Enter your full name"
                            className="w-full pl-12 pr-4 py-4 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <Label htmlFor="email" className="text-white/80 text-sm font-medium mb-2 block">
                      Email Address
                    </Label>
                    <div className={cn(
                      "relative group transition-all duration-300",
                      focusedField === 'email' && "scale-[1.02]"
                    )}>
                      <div className={cn(
                        "absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl opacity-0 blur transition-opacity duration-300",
                        focusedField === 'email' && "opacity-50"
                      )} />
                      
                      <div className="relative flex items-center">
                        <div className={cn(
                          "absolute left-4 transition-colors duration-300",
                          focusedField === 'email' ? "text-violet-400" : "text-white/40"
                        )}>
                          <Mail className="w-5 h-5" />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Enter your email"
                          className="w-full pl-12 pr-4 py-4 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-300"
                        />
                        {formData.email && formData.email.includes('@') && (
                          <div className="absolute right-4 text-green-400 animate-scale-in">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <Label htmlFor="password" className="text-white/80 text-sm font-medium mb-2 block">
                      Password
                    </Label>
                    <div className={cn(
                      "relative group transition-all duration-300",
                      focusedField === 'password' && "scale-[1.02]"
                    )}>
                      <div className={cn(
                        "absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl opacity-0 blur transition-opacity duration-300",
                        focusedField === 'password' && "opacity-50"
                      )} />
                      
                      <div className="relative flex items-center">
                        <div className={cn(
                          "absolute left-4 transition-colors duration-300",
                          focusedField === 'password' ? "text-violet-400" : "text-white/40"
                        )}>
                          <Lock className="w-5 h-5" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Enter your password"
                          className="w-full pl-12 pr-12 py-4 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-300"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Strength Indicator (Sign Up only) */}
                    {!isLogin && formData.password && (
                      <div className="mt-3 animate-fade-in">
                        <div className="flex gap-1.5 mb-2">
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-all duration-300",
                                level === 1 && formData.password.length >= 1 && (
                                  passwordStrength === 'weak' ? "bg-red-500" :
                                  passwordStrength === 'medium' ? "bg-yellow-500" : "bg-green-500"
                                ),
                                level === 2 && formData.password.length >= 6 && (
                                  passwordStrength === 'medium' ? "bg-yellow-500" : 
                                  passwordStrength === 'strong' ? "bg-green-500" : "bg-white/10"
                                ),
                                level === 3 && passwordStrength === 'strong' && "bg-green-500",
                                !(
                                  (level === 1 && formData.password.length >= 1) ||
                                  (level === 2 && formData.password.length >= 6) ||
                                  (level === 3 && passwordStrength === 'strong')
                                ) && "bg-white/10"
                              )}
                            />
                          ))}
                        </div>
                        <p className={cn(
                          "text-xs transition-colors",
                          passwordStrength === 'weak' && "text-red-400",
                          passwordStrength === 'medium' && "text-yellow-400",
                          passwordStrength === 'strong' && "text-green-400"
                        )}>
                          {passwordStrength === 'weak' && "Weak - Add more characters"}
                          {passwordStrength === 'medium' && "Medium - Good, but could be stronger"}
                          {passwordStrength === 'strong' && "Strong - Great password!"}
                        </p>
                      </div>
                    )}

                    {isLogin && (
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => navigate('/forgot-password')}
                          className="text-sm text-violet-400/80 hover:text-violet-400 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full py-4 h-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </Button>
                </form>
                
                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-sm text-white/40 bg-transparent backdrop-blur-sm">
                      or continue with
                    </span>
                  </div>
                </div>
                
                {/* Google Sign In Button */}
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="relative w-full py-4 h-auto bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] text-white font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <span className="relative flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                      <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C4 20.53 7.7 23 12 23Z" fill="#34A853" />
                      <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.04H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.96L5.84 14.09Z" fill="#FBBC05" />
                      <path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.04L19.36 4.07C17.45 2.24 14.97 1 12 1C7.7 1 4 3.47 2.18 7.04L5.84 9.91C6.71 7.31 9.14 5.36 12 5.36Z" fill="#EA4335" />
                    </svg>
                    <span>Continue with Google</span>
                  </span>
                </Button>

                {/* Terms */}
                <p className="mt-6 text-center text-xs text-white/40">
                  By continuing, you agree to Cartlyfy's{' '}
                  <a href="/terms" className="text-violet-400 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="mt-8 text-center animate-fade-in">
            <p className="text-white/30 text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Premium Shopping Experience</span>
              <Sparkles className="w-4 h-4" />
            </p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.4;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }

        /* Input autofill styling */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.06) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </Layout>
  );
}
