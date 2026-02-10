import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomerAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  useEffect(() => {
    setMounted(true);
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
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes border-flow {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes input-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          50% { box-shadow: 0 0 20px 2px rgba(245, 158, 11, 0.1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
        .animate-border-flow {
          background-size: 300% 300%;
          animation: border-flow 4s ease infinite;
        }
        .animate-slide-up { animation: slide-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-slide-down { animation: slide-down 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-fade-in-custom { animation: fade-in 0.8s ease forwards; }
        .animate-card-enter { animation: card-enter 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-subtle-bounce { animation: subtle-bounce 2s ease-in-out infinite; }
        .animate-ring-spin { animation: ring-spin 20s linear infinite; }
        .animate-input-glow { animation: input-glow 2s ease-in-out infinite; }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }

        .auth-input {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .auth-input:focus {
          transform: translateY(-1px);
        }

        .glass-card {
          backdrop-filter: blur(40px) saturate(150%);
          -webkit-backdrop-filter: blur(40px) saturate(150%);
        }

        .toggle-pill {
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .submit-btn {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -10px rgba(245, 158, 11, 0.4);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .google-btn {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .google-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .field-wrapper {
          transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .icon-wrapper {
          transition: all 0.3s ease;
        }

        .star {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.6);
        }
      `}</style>

      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0b]">
        {/* Deep background layers */}
        <div className="absolute inset-0">
          {/* Base dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0f] via-[#0a0a0b] to-[#080808]" />

          {/* Ambient color orbs */}
          <div
            className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-glow-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full animate-glow-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.06) 0%, transparent 70%)',
              animationDelay: '1.5s',
            }}
          />
          <div
            className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full animate-glow-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.04) 0%, transparent 70%)',
              animationDelay: '3s',
            }}
          />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />

          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating star particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${8 + (i * 8) % 84}%`,
                top: `${5 + (i * 13) % 90}%`,
                width: `${1.5 + (i % 3)}px`,
                height: `${1.5 + (i % 3)}px`,
                animation: `star-twinkle ${3 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 w-full max-w-[420px] mx-auto px-5 py-10">
          {/* Header / Brand */}
          <div
            className={cn(
              "text-center mb-10 opacity-0",
              mounted && "animate-slide-down"
            )}
          >
            {/* Crown icon with animated rings */}
            <div className="relative inline-flex items-center justify-center mb-7">
              {/* Outer rotating ring */}
              <div className="absolute w-24 h-24 rounded-full border border-amber-500/10 animate-ring-spin" />
              <div className="absolute w-28 h-28 rounded-full border border-amber-400/5"
                style={{ animation: 'ring-spin 30s linear infinite reverse' }}
              />

              {/* Glow behind icon */}
              <div className="absolute w-16 h-16 rounded-full bg-amber-500/20 blur-xl animate-glow-pulse" />

              {/* Icon container */}
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30 animate-float">
                <Crown className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>

              {/* Small accent dots */}
              <div className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-subtle-bounce" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-subtle-bounce" style={{ animationDelay: '1s' }} />
            </div>

            <h1 className="font-display text-3xl font-bold mb-2 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent animate-gradient-shift">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px] mx-auto">
              {isLogin
                ? 'Sign in to access your premium experience'
                : 'Join us and unlock exclusive features'}
            </p>
          </div>

          {/* Auth Card */}
          <div
            className={cn(
              "relative opacity-0",
              mounted && "animate-card-enter stagger-2"
            )}
          >
            {/* Card border gradient */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-white/[0.05] animate-border-flow" />

            {/* Card */}
            <div className="glass-card relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-7 shadow-2xl shadow-black/40">
              {/* Top highlight line */}
              <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

              {/* Toggle */}
              <div className="relative flex mb-7 bg-white/[0.04] rounded-xl p-1 border border-white/[0.05]">
                {/* Sliding indicator */}
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/25 toggle-pill"
                  style={{
                    left: isLogin ? '4px' : 'calc(50% + 0px)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-semibold text-sm relative z-10 transition-colors duration-300",
                    isLogin ? "text-white" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-semibold text-sm relative z-10 transition-colors duration-300",
                    !isLogin ? "text-white" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name - Animated mount/unmount */}
                <div
                  className={cn(
                    "field-wrapper overflow-hidden",
                    !isLogin ? "max-h-[100px] opacity-100 mb-0" : "max-h-0 opacity-0 -mb-4"
                  )}
                >
                  <Label htmlFor="fullName" className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-2 block">
                    Full Name
                  </Label>
                  <div className="relative">
                    <div
                      className={cn(
                        "icon-wrapper absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center border-r border-white/[0.05] rounded-l-xl",
                        focusedField === 'fullName' ? "bg-amber-500/10" : "bg-white/[0.02]"
                      )}
                    >
                      <User className={cn(
                        "w-4 h-4 transition-colors duration-300",
                        focusedField === 'fullName' ? "text-amber-400" : "text-white/20"
                      )} />
                    </div>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your full name"
                      className={cn(
                        "auth-input pl-13 h-11 bg-white/[0.03] border-white/[0.06] rounded-xl text-white placeholder:text-white/20 text-sm",
                        "focus:border-amber-400/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-amber-400/10",
                        focusedField === 'fullName' && "animate-input-glow"
                      )}
                      style={{ paddingLeft: '3.25rem' }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div
                      className={cn(
                        "icon-wrapper absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center border-r border-white/[0.05] rounded-l-xl z-10",
                        focusedField === 'email' ? "bg-amber-500/10" : "bg-white/[0.02]"
                      )}
                    >
                      <Mail className={cn(
                        "w-4 h-4 transition-colors duration-300",
                        focusedField === 'email' ? "text-amber-400" : "text-white/20"
                      )} />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your email"
                      className={cn(
                        "auth-input h-11 bg-white/[0.03] border-white/[0.06] rounded-xl text-white placeholder:text-white/20 text-sm",
                        "focus:border-amber-400/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-amber-400/10",
                        focusedField === 'email' && "animate-input-glow"
                      )}
                      style={{ paddingLeft: '3.25rem' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <div
                      className={cn(
                        "icon-wrapper absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center border-r border-white/[0.05] rounded-l-xl z-10",
                        focusedField === 'password' ? "bg-amber-500/10" : "bg-white/[0.02]"
                      )}
                    >
                      <Lock className={cn(
                        "w-4 h-4 transition-colors duration-300",
                        focusedField === 'password' ? "text-amber-400" : "text-white/20"
                      )} />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your password"
                      className={cn(
                        "auth-input h-11 bg-white/[0.03] border-white/[0.06] rounded-xl text-white placeholder:text-white/20 text-sm pr-11",
                        "focus:border-amber-400/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-amber-400/10",
                        focusedField === 'password' && "animate-input-glow"
                      )}
                      style={{ paddingLeft: '3.25rem' }}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-amber-400/70 transition-colors duration-300 z-10"
                    >
                      {showPassword
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />
                      }
                    </button>
                  </div>

                  {isLogin && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-[11px] text-amber-400/40 hover:text-amber-300 transition-colors duration-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  {!isLogin && (
                    <p className="text-[11px] text-white/20 mt-2 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Minimum 6 characters
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    size="lg"
                    className="submit-btn w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-white font-semibold rounded-xl border-0 text-sm relative overflow-hidden group animate-gradient-shift"
                    disabled={isLoading}
                  >
                    {/* Hover shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    <span className="relative flex items-center justify-center gap-2.5">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isLogin ? 'Signing in...' : 'Creating account...'}
                        </>
                      ) : (
                        <>
                          {isLogin ? 'Sign In' : 'Create Account'}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </form>

              {/* Divider */}
              <div className="my-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.05]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-white/20 bg-[#0d0d10]">
                    or
                  </span>
                </div>
              </div>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="google-btn w-full h-11 bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center gap-3 text-sm"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C4 20.53 7.7 23 12 23Z" fill="#34A853" />
                  <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.04H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.96L5.84 14.09Z" fill="#FBBC05" />
                  <path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.04L19.36 4.07C17.45 2.24 14.97 1 12 1C7.7 1 4 3.47 2.18 7.04L5.84 9.91C6.71 7.31 9.14 5.36 12 5.36Z" fill="#EA4335" />
                </svg>
                <span className="text-white/60 font-medium">Continue with Google</span>
              </Button>

              {/* Terms */}
              <p className="mt-6 text-center text-[10px] text-white/15 leading-relaxed">
                By continuing, you agree to our{' '}
                <button className="text-amber-400/30 hover:text-amber-300/60 transition-colors underline underline-offset-2">
                  Terms
                </button>{' '}
                and{' '}
                <button className="text-amber-400/30 hover:text-amber-300/60 transition-colors underline underline-offset-2">
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
