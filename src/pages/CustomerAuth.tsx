import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CustomerAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; hue: number; life: number; maxLife: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const createParticle = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: 0,
        hue: 35 + Math.random() * 20,
        life: 0,
        maxLife: 200 + Math.random() * 300,
      });
    };

    for (let i = 0; i < 60; i++) {
      const p = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4,
        hue: 35 + Math.random() * 20,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 300,
      };
      particles.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (particles.length < 60 && Math.random() < 0.1) {
        createParticle();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio < 0.1) {
          p.opacity = lifeRatio * 10 * 0.5;
        } else if (lifeRatio > 0.8) {
          p.opacity = (1 - lifeRatio) * 5 * 0.5;
        } else {
          p.opacity = 0.5;
        }

        if (p.life >= p.maxLife || p.x < -10 || p.x > canvas.width + 10 || p.y < -10 || p.y > canvas.height + 10) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity * 0.15})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(40, 70%, 55%, ${(1 - dist / 120) * 0.06})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

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
          33% { transform: translateY(-12px) rotate(2deg); }
          66% { transform: translateY(6px) rotate(-1deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
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
        @keyframes aurora {
          0% { transform: rotate(0deg) scale(1); opacity: 0.3; }
          33% { transform: rotate(120deg) scale(1.1); opacity: 0.5; }
          66% { transform: rotate(240deg) scale(0.9); opacity: 0.3; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.3; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes input-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          50% { box-shadow: 0 0 24px 3px rgba(245, 158, 11, 0.08); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.2; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
          50% { text-shadow: 0 0 40px rgba(245, 158, 11, 0.4), 0 0 80px rgba(245, 158, 11, 0.1); }
        }
        @keyframes mesh-move {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -20px) rotate(90deg); }
          50% { transform: translate(-10px, 30px) rotate(180deg); }
          75% { transform: translate(-30px, -10px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        .animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 4s ease infinite; }
        .animate-border-flow { background-size: 300% 300%; animation: border-flow 4s ease infinite; }
        .animate-slide-down { animation: slide-down 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-card-enter { animation: card-enter 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-subtle-bounce { animation: subtle-bounce 2s ease-in-out infinite; }
        .animate-ring-spin { animation: ring-spin 20s linear infinite; }
        .animate-input-glow { animation: input-glow 2s ease-in-out infinite; }
        .animate-text-glow { animation: text-glow 3s ease-in-out infinite; }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }

        .auth-input {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .auth-input:focus {
          transform: translateY(-1px);
        }

        .glass-card {
          backdrop-filter: blur(60px) saturate(180%);
          -webkit-backdrop-filter: blur(60px) saturate(180%);
        }

        .glass-input {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .toggle-pill {
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .submit-btn {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 50px -10px rgba(245, 158, 11, 0.5);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .google-btn {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .google-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
        }

        .field-wrapper {
          transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .icon-wrapper {
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .mesh-gradient-1 {
          animation: mesh-move 15s ease-in-out infinite;
        }
        .mesh-gradient-2 {
          animation: mesh-move 20s ease-in-out infinite reverse;
        }
        .mesh-gradient-3 {
          animation: mesh-move 18s ease-in-out infinite;
          animation-delay: -5s;
        }
      `}</style>

      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Multi-layer background */}
        <div className="absolute inset-0">
          {/* Deep base gradient with rich dark tones */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0714] to-[#05080f]" />

          {/* Moving mesh gradients for depth */}
          <div
            className="absolute mesh-gradient-1"
            style={{
              top: '-20%',
              left: '-15%',
              width: '70%',
              height: '70%',
              background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, rgba(109, 40, 217, 0.04) 30%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute mesh-gradient-2"
            style={{
              bottom: '-25%',
              right: '-10%',
              width: '65%',
              height: '65%',
              background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.07) 0%, rgba(217, 119, 6, 0.03) 30%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(50px)',
            }}
          />
          <div
            className="absolute mesh-gradient-3"
            style={{
              top: '30%',
              left: '50%',
              width: '50%',
              height: '50%',
              background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.05) 0%, transparent 60%)',
              borderRadius: '50%',
              filter: 'blur(60px)',
            }}
          />

          {/* Aurora-like streaks */}
          <div
            className="absolute top-0 left-1/4 w-[500px] h-[800px] opacity-[0.03]"
            style={{
              background: 'linear-gradient(180deg, transparent, rgba(168, 85, 247, 0.4), rgba(245, 158, 11, 0.3), transparent)',
              transform: 'rotate(-15deg)',
              filter: 'blur(80px)',
              animation: 'aurora 20s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[400px] h-[600px] opacity-[0.025]"
            style={{
              background: 'linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.3), rgba(245, 158, 11, 0.2), transparent)',
              transform: 'rotate(20deg)',
              filter: 'blur(70px)',
              animation: 'aurora 25s ease-in-out infinite reverse',
            }}
          />

          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
            }}
          />

          {/* Radial vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
            }}
          />

          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Canvas for particle animation */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-[1]"
        />

        {/* Main content */}
        <div className="relative z-10 w-full max-w-[440px] mx-auto px-5 py-10">
          {/* Header / Brand */}
          <div
            className={cn(
              "text-center mb-10 opacity-0",
              mounted && "animate-slide-down"
            )}
          >
            {/* Crown icon with animated rings */}
            <div className="relative inline-flex items-center justify-center mb-8">
              {/* Pulse rings */}
              <div className="absolute w-32 h-32 rounded-full border border-amber-500/5" style={{ animation: 'pulse-ring 4s ease-in-out infinite' }} />
              <div className="absolute w-24 h-24 rounded-full border border-amber-400/10 animate-ring-spin" />
              <div className="absolute w-28 h-28 rounded-full border border-purple-400/5"
                style={{ animation: 'ring-spin 30s linear infinite reverse' }}
              />

              {/* Deep glow behind icon */}
              <div className="absolute w-20 h-20 rounded-full bg-amber-500/15 blur-2xl animate-glow-pulse" />
              <div className="absolute w-24 h-24 rounded-full bg-purple-500/5 blur-3xl animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

              {/* Icon container - glassmorphism */}
              <div className="relative w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center animate-float"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(234, 179, 8, 0.8) 50%, rgba(245, 158, 11, 0.9) 100%)',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 60px rgba(245, 158, 11, 0.15)',
                }}
              >
                <Crown className="w-8 h-8 text-white drop-shadow-lg" strokeWidth={1.5} />
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 0 60%)' }} />
                </div>
              </div>

              {/* Sparkle accents */}
              <Sparkles className="absolute -top-2 right-0 w-4 h-4 text-amber-300/60 animate-subtle-bounce" style={{ animationDelay: '0.3s' }} />
              <div className="absolute -bottom-1 left-1 w-2 h-2 rounded-full bg-amber-400/50 animate-subtle-bounce" style={{ animationDelay: '1s' }} />
              <div className="absolute top-2 -left-3 w-1.5 h-1.5 rounded-full bg-purple-300/30 animate-subtle-bounce" style={{ animationDelay: '1.5s' }} />
            </div>

            <h1 className="font-display text-[32px] font-bold mb-3 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent animate-gradient-shift animate-text-glow">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/35 text-sm leading-relaxed max-w-[300px] mx-auto">
              {isLogin
                ? 'Sign in to access your premium experience'
                : 'Join us and unlock exclusive features'}
            </p>
          </div>

          {/* Auth Card - Frosted glass */}
          <div
            className={cn(
              "relative opacity-0",
              mounted && "animate-card-enter stagger-2"
            )}
          >
            {/* Outer glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-amber-500/5 via-transparent to-purple-500/5 blur-xl pointer-events-none" />

            {/* Animated border */}
            <div className="absolute -inset-[1px] rounded-[22px] bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-white/[0.08] animate-border-flow" />

            {/* Card body */}
            <div className="glass-card relative rounded-[22px] bg-white/[0.04] border border-white/[0.08] p-8 shadow-2xl shadow-black/50"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)',
              }}
            >
              {/* Top highlight */}
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />

              {/* Inner subtle glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-amber-400/[0.04] to-transparent rounded-b-full pointer-events-none" />

              {/* Toggle - Glassmorphism pill */}
              <div className="relative flex mb-8 rounded-xl p-1 border border-white/[0.06]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Sliding indicator */}
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-lg toggle-pill"
                  style={{
                    left: isLogin ? '4px' : 'calc(50% + 0px)',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(234, 179, 8, 0.85) 100%)',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-semibold text-sm relative z-10 transition-colors duration-300",
                    isLogin ? "text-white" : "text-white/35 hover:text-white/55"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-semibold text-sm relative z-10 transition-colors duration-300",
                    !isLogin ? "text-white" : "text-white/35 hover:text-white/55"
                  )}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div
                  className={cn(
                    "field-wrapper overflow-hidden",
                    !isLogin ? "max-h-[100px] opacity-100 mb-0" : "max-h-0 opacity-0 -mb-5"
                  )}
                >
                  <Label htmlFor="fullName" className="text-[11px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2 block">
                    Full Name
                  </Label>
                  <div className="relative group">
                    <div
                      className={cn(
                        "icon-wrapper absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-white/[0.05] rounded-l-xl z-10",
                        focusedField === 'fullName' ? "bg-amber-500/10 border-amber-500/10" : "bg-white/[0.02]"
                      )}
                    >
                      <User className={cn(
                        "w-4 h-4 transition-all duration-300",
                        focusedField === 'fullName' ? "text-amber-400 scale-110" : "text-white/20"
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
                        "auth-input glass-input pl-14 h-12 bg-white/[0.03] border-white/[0.06] rounded-xl text-white placeholder:text-white/15 text-sm",
                        "focus:border-amber-400/25 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-400/10",
                        focusedField === 'fullName' && "animate-input-glow"
                      )}
                    />
                    {/* Focus indicator line */}
                    <div className={cn(
                      "absolute bottom-0 left-12 right-0 h-[2px] rounded-full transition-all duration-500",
                      focusedField === 'fullName'
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0"
                    )} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-[11px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <div
                      className={cn(
                        "icon-wrapper absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-white/[0.05] rounded-l-xl z-10",
                        focusedField === 'email' ? "bg-amber-500/10 border-amber-500/10" : "bg-white/[0.02]"
                      )}
                    >
                      <Mail className={cn(
                        "w-4 h-4 transition-all duration-300",
                        focusedField === 'email' ? "text-amber-400 scale-110" : "text-white/20"
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
                        "auth-input glass-input pl-14 h-12 bg-white/[0.03] border-white/[0.06] rounded-xl text-white placeholder:text-white/15 text-sm",
                        "focus:border-amber-400/25 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-400/10",
                        focusedField === 'email' && "animate-input-glow"
                      )}
                    />
                    <div className={cn(
                      "absolute bottom-0 left-12 right-0 h-[2px] rounded-full transition-all duration-500",
                      focusedField === 'email'
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0"
                    )} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-[11px] font-semibold text-white/25 uppercase tracking-[0.15em] mb-2 block">
                    Password
                  </Label>
                  <div className="relative group">
                    <div
                      className={cn(
                        "icon-wrapper absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-white/[0.05] rounded-l-xl z-10",
                        focusedField === 'password' ? "bg-amber-500/10 border-amber-500/10" : "bg-white/[0.02]"
                      )}
                    >
                      <Lock className={cn(
                        "w-4 h-4 transition-all duration-300",
                        focusedField === 'password' ? "text-amber-400 scale-110" : "text-white/20"
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
                        "auth-input glass-input pl-14 h-12 bg-white/[0.03] border-white/[0.06] rounded-xl text-white placeholder:text-white/15 text-sm pr-12",
                        "focus:border-amber-400/25 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-400/10",
                        focusedField === 'password' && "animate-input-glow"
                      )}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/15 hover:text-amber-400/60 transition-all duration-300 z-10 p-1 rounded-lg hover:bg-white/[0.05]"
                    >
                      {showPassword
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />
                      }
                    </button>
                    <div className={cn(
                      "absolute bottom-0 left-12 right-0 h-[2px] rounded-full transition-all duration-500",
                      focusedField === 'password'
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0"
                    )} />
                  </div>

                  {isLogin && (
                    <div className="mt-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-[11px] text-amber-400/35 hover:text-amber-300 transition-all duration-300 hover:underline underline-offset-2"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  {!isLogin && (
                    <p className="text-[11px] text-white/15 mt-2.5 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Minimum 6 characters
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="submit-btn w-full h-[52px] text-white font-semibold rounded-xl border-0 text-sm relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(234, 179, 8, 0.9) 50%, rgba(245, 158, 11, 0.95) 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradient-shift 3s ease infinite',
                      boxShadow: '0 8px 30px -5px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                    disabled={isLoading}
                  >
                    {/* Hover shine */}
                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    </div>
                    {/* Top highlight */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
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
              <div className="my-7 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.05]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-white/15 bg-transparent"
                    style={{
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      padding: '4px 16px',
                      borderRadius: '20px',
                    }}
                  >
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="google-btn w-full h-12 bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] rounded-xl flex items-center justify-center gap-3 text-sm"
                onClick={handleGoogleSignIn}
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C4 20.53 7.7 23 12 23Z" fill="#34A853" />
                  <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.04H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.96L5.84 14.09Z" fill="#FBBC05" />
                  <path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.04L19.36 4.07C17.45 2.24 14.97 1 12 1C7.7 1 4 3.47 2.18 7.04L5.84 9.91C6.71 7.31 9.14 5.36 12 5.36Z" fill="#EA4335" />
                </svg>
                <span className="text-white/50 font-medium">Continue with Google</span>
              </Button>

              {/* Terms */}
              <p className="mt-7 text-center text-[10px] text-white/12 leading-relaxed">
                By continuing, you agree to our{' '}
                <button className="text-amber-400/25 hover:text-amber-300/50 transition-colors underline underline-offset-2">
                  Terms
                </button>{' '}
                and{' '}
                <button className="text-amber-400/25 hover:text-amber-300/50 transition-colors underline underline-offset-2">
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>

          {/* Bottom accent */}
          <div className={cn(
            "mt-8 text-center opacity-0",
            mounted && "animate-card-enter stagger-3"
          )}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.04]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
              <span className="text-[10px] text-white/20 font-medium tracking-wide">Secured with end-to-end encryption</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
