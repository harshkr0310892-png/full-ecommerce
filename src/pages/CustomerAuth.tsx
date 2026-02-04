import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  Globe
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
            data: { full_name: formData.fullName }
          }
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('customer_profiles').insert({
              user_id: data.user.id,
              full_name: formData.fullName,
            });
          localStorage.setItem('customer_user_id', data.user.id);
          toast.success('Welcome to Cartlyfy!');
          const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/profile';
          navigate(redirectUrl);
        }
      }
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message.includes('User already registered')) {
        toast.error('Account already exists');
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
      {/* Background Container - Fixed to viewport */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-[#0A0A0B]">
        {/* Deep mesh gradient */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-violet-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-fuchsia-600/20 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px]" />
        
        {/* Subtle noise texture overlay for realism */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="relative min-h-[100dvh] flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          
          {/* Header & Logo */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="relative inline-flex items-center justify-center mb-6 group cursor-default">
              {/* Back glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              
              {/* Logo Box */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <ShoppingBag className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                <Sparkles className="absolute top-2 right-2 w-4 h-4 text-amber-300 animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent drop-shadow-sm">
                Cartlyfy
              </span>
            </h1>
            <p className="text-white/50 text-base font-medium">
              {isLogin ? 'Welcome back to premium shopping' : 'Join the exclusive club'}
            </p>
          </div>

          {/* Main Glass Card */}
          <div className="relative animate-slide-up group/card">
            {/* Card Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-b from-white/20 to-transparent rounded-[2rem] blur-sm opacity-30" />
            
            <div className="relative bg-[#1a1a1e]/40 backdrop-blur-2xl border border-white/10 rounded-[1.8rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Top Gloss Highlight */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              
              <div className="p-6 sm:p-8">
                {/* Toggle Switch */}
                <div className="flex p-1 mb-8 bg-black/20 rounded-xl border border-white/5">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative isolate",
                      isLogin ? "text-white shadow-[0_2px_10px_rgba(139,92,246,0.3)]" : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {isLogin && (
                      <div className="absolute inset-0 bg-white/10 rounded-lg -z-10 animate-fade-in" />
                    )}
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative isolate",
                      !isLogin ? "text-white shadow-[0_2px_10px_rgba(139,92,246,0.3)]" : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {!isLogin && (
                      <div className="absolute inset-0 bg-white/10 rounded-lg -z-10 animate-fade-in" />
                    )}
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div className="space-y-1.5 animate-fade-in">
                      <Label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Full Name</Label>
                      <div className={cn(
                        "relative group transition-all duration-300 rounded-xl",
                        focusedField === 'fullName' ? "bg-white/5 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "bg-white/[0.03]"
                      )}>
                        <User className={cn("absolute left-4 top-3.5 w-5 h-5 transition-colors", focusedField === 'fullName' ? "text-violet-400" : "text-white/30")} />
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          onFocus={() => setFocusedField('fullName')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Ex. John Doe"
                          className="w-full pl-12 pr-4 py-6 bg-transparent border-white/10 rounded-xl text-base text-white placeholder:text-white/20 focus:border-violet-500/50 focus:ring-0 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Email</Label>
                    <div className={cn(
                      "relative group transition-all duration-300 rounded-xl",
                      focusedField === 'email' ? "bg-white/5 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "bg-white/[0.03]"
                    )}>
                      <Mail className={cn("absolute left-4 top-3.5 w-5 h-5 transition-colors", focusedField === 'email' ? "text-violet-400" : "text-white/30")} />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="hello@cartlyfy.com"
                        className="w-full pl-12 pr-4 py-6 bg-transparent border-white/10 rounded-xl text-base text-white placeholder:text-white/20 focus:border-violet-500/50 focus:ring-0 transition-all"
                      />
                      {formData.email.includes('@') && <Check className="absolute right-4 top-3.5 w-5 h-5 text-emerald-500 animate-scale-in" />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Password</Label>
                    <div className={cn(
                      "relative group transition-all duration-300 rounded-xl",
                      focusedField === 'password' ? "bg-white/5 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "bg-white/[0.03]"
                    )}>
                      <Lock className={cn("absolute left-4 top-3.5 w-5 h-5 transition-colors", focusedField === 'password' ? "text-violet-400" : "text-white/30")} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-6 bg-transparent border-white/10 rounded-xl text-base text-white placeholder:text-white/20 focus:border-violet-500/50 focus:ring-0 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-white/30 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {!isLogin && formData.password && (
                      <div className="flex gap-1.5 pt-2 px-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", 
                            i === 1 && formData.password.length > 0 ? (passwordStrength === 'weak' ? "bg-rose-500" : passwordStrength === 'medium' ? "bg-amber-500" : "bg-emerald-500") :
                            i === 2 && formData.password.length > 5 ? (passwordStrength === 'medium' ? "bg-amber-500" : "bg-emerald-500") :
                            i === 3 && passwordStrength === 'strong' ? "bg-emerald-500" : "bg-white/10"
                          )} />
                        ))}
                      </div>
                    )}
                  </div>

                  {isLogin && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full py-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-base rounded-xl shadow-lg shadow-violet-900/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/10 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <span className="flex items-center gap-2">
                        {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center"><span className="bg-[#1a1a1e]/0 px-4 text-xs text-white/30 uppercase tracking-widest backdrop-blur-xl">Or continue with</span></div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-6 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium rounded-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" /><path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C4 20.53 7.7 23 12 23Z" fill="#34A853" /><path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.04H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.96L5.84 14.09Z" fill="#FBBC05" /><path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.04L19.36 4.07C17.45 2.24 14.97 1 12 1C7.7 1 4 3.47 2.18 7.04L5.84 9.91C6.71 7.31 9.14 5.36 12 5.36Z" fill="#EA4335" /></svg>
                  Google
                </Button>
              </div>
            </div>
            
            <p className="mt-8 text-center text-xs text-white/30">
              Secured by <span className="text-white/50 font-medium">Cartlyfy Shield</span>
              <br />
              <a href="#" className="hover:text-violet-400 transition-colors mr-2">Terms</a>
              &bull;
              <a href="#" className="hover:text-violet-400 transition-colors ml-2">Privacy</a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(0, 0, 0, 0) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </Layout>
  );
}
