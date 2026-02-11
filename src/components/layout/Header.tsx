import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, Leaf, TreePine, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { SearchBar } from "@/components/SearchBar";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const navigate = useNavigate();
  const location = useLocation();

  const [sellerLoggedIn, setSellerLoggedIn] = useState<boolean>(
    typeof window !== "undefined" &&
      sessionStorage.getItem("seller_logged_in") === "true"
  );
  const [sellerName, setSellerName] = useState<string | null>(
    typeof window !== "undefined" ? sessionStorage.getItem("seller_name") : null
  );

  const {
    user: customerUser,
    profile: customerProfile,
    isLoggedIn: isCustomerLoggedIn,
  } = useCustomerAuth();

  const cartItemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Scroll detection for enhanced glass effect
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = useCallback(
    (term: string) => {
      navigate(`/products?search=${encodeURIComponent(term)}`);
      setMobileMenuOpen(false);
    },
    [navigate]
  );

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Seller login via sellerEmail query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sellerEmailParam = params.get("sellerEmail");

    if (sellerEmailParam && !sessionStorage.getItem("seller_logged_in")) {
      const verify = async () => {
        const { data, error } = await supabase
          .from("sellers")
          .select("name,email,is_active,is_banned")
          .eq("email", sellerEmailParam)
          .maybeSingle();

        if (!error && data && data.is_active && !data.is_banned) {
          sessionStorage.setItem("seller_logged_in", "true");
          sessionStorage.setItem("seller_email", data.email);
          sessionStorage.setItem("seller_name", data.name);
          setSellerLoggedIn(true);
          setSellerName(data.name);
          navigate("/seller");
        }
      };
      verify();
    }
  }, [location.search, navigate]);

  // Detect seller session from Supabase auth
  useEffect(() => {
    const detectFromSession = async () => {
      if (sessionStorage.getItem("seller_logged_in") === "true") return;

      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email;
      if (!email) return;

      const { data, error } = await supabase
        .from("sellers")
        .select("id,name,email,is_active,is_banned")
        .eq("email", email)
        .maybeSingle();

      if (!error && data && data.is_active && !data.is_banned) {
        sessionStorage.setItem("seller_logged_in", "true");
        sessionStorage.setItem("seller_email", data.email);
        sessionStorage.setItem("seller_name", data.name);
        sessionStorage.setItem("seller_id", data.id);
        setSellerLoggedIn(true);
        setSellerName(data.name);
      }
    };
    detectFromSession();
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 pt-2 pb-3 sm:pt-3 sm:pb-4">
        {/* Glass card - GPU accelerated, lighter blur */}
        <div
          className={cn(
            "rounded-[32px] sm:rounded-[42px]",
            "border transition-all duration-300 ease-out",
            // This is the key fix: visible background colors with proper opacity
            scrolled
              ? [
                  "bg-white/70 dark:bg-zinc-900/80",
                  "border-white/30 dark:border-zinc-700/50",
                  "shadow-lg shadow-black/[0.08] dark:shadow-black/30",
                ]
              : [
                  "bg-white/50 dark:bg-zinc-900/60",
                  "border-white/20 dark:border-zinc-700/40",
                  "shadow-md shadow-black/[0.05] dark:shadow-black/20",
                ],
            // Lighter blur = way less lag. xl is enough for glass look
            "backdrop-blur-xl",
            // Force GPU layer for smooth compositing
            "transform-gpu will-change-[backdrop-filter,background-color]",
            "px-3 sm:px-5"
          )}
          style={{
            // Hardware-accelerated backdrop filter with fallback
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            backdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          {/* Top row */}
          <div className="flex items-center justify-between gap-2 py-2.5 sm:py-3">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
            >
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="font-display text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-800 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent whitespace-nowrap">
                ecommerce<span className="hidden sm:inline"> Store</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { to: "/", label: "Home" },
                { to: "/products", label: "Collection" },
                { to: "/contact-us", label: "Contact Us" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "font-display text-sm lg:text-base transition-colors duration-200 relative group",
                    location.pathname === to
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400"
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300",
                      location.pathname === to
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    )}
                  />
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Seller chip */}
              {sellerLoggedIn && sellerName && (
                <Button
                  variant="ghost"
                  className="hidden md:inline-flex h-9 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs sm:text-sm px-3 transition-colors duration-200"
                  onClick={() => navigate("/seller")}
                >
                  <span className="truncate max-w-[120px]">
                    Seller: {sellerName}
                  </span>
                </Button>
              )}

              {/* Customer profile */}
              {isCustomerLoggedIn ? (
                <div className="hidden md:flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/profile")}
                    className="relative hover:bg-emerald-500/10 rounded-full transition-colors duration-200"
                  >
                    {customerProfile?.avatar_url ? (
                      <img
                        src={customerProfile.avatar_url}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/40"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs sm:text-sm px-3 max-w-[140px] transition-colors duration-200"
                    onClick={() => navigate("/profile")}
                  >
                    <span className="truncate">
                      {customerProfile?.full_name ||
                        customerUser?.email?.split("@")[0] ||
                        "Customer"}
                    </span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex h-9 rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs sm:text-sm px-3 transition-colors duration-200"
                  onClick={() => navigate("/auth")}
                >
                  <User className="w-4 h-4 mr-1.5" />
                  Login
                </Button>
              )}

              {/* Cart button */}
              <Link to="/cart" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full hover:bg-emerald-500/10 transition-colors duration-200"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium shadow-sm">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full hover:bg-emerald-500/10 transition-colors duration-200"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation – simple opacity + height transition */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-black/5 dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col gap-1 py-3">
                {[
                  { to: "/", label: "Home" },
                  { to: "/products", label: "Collection" },
                  { to: "/contact-us", label: "Contact Us" },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "font-display text-base py-2 px-3 rounded-xl transition-colors duration-200",
                      location.pathname === to
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                        : "text-foreground/85 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-500/5"
                    )}
                    onClick={closeMobileMenu}
                  >
                    {label}
                  </Link>
                ))}

                {sellerLoggedIn && sellerName && (
                  <Link
                    to="/seller"
                    className="font-display text-base py-2 px-3 rounded-xl text-foreground/85 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    Seller: {sellerName}
                  </Link>
                )}

                {isCustomerLoggedIn ? (
                  <Link
                    to="/profile"
                    className="font-display text-base bg-emerald-500/10 border border-emerald-500/30 text-foreground dark:text-emerald-50 py-2.5 px-4 rounded-xl hover:bg-emerald-500/20 transition-colors duration-200 flex items-center gap-2 mt-1"
                    onClick={closeMobileMenu}
                  >
                    {customerProfile?.avatar_url ? (
                      <img
                        src={customerProfile.avatar_url}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="truncate">
                      {customerProfile?.full_name ||
                        customerUser?.email?.split("@")[0] ||
                        "Profile"}
                    </span>
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="font-display text-base bg-emerald-500/10 border border-emerald-500/30 text-foreground dark:text-emerald-50 py-2.5 px-4 rounded-xl hover:bg-emerald-500/20 transition-colors duration-200 flex items-center gap-2 mt-1"
                    onClick={closeMobileMenu}
                  >
                    <User className="w-4 h-4" />
                    Login
                  </Link>
                )}
              </nav>

              {/* Mobile Search */}
              <div className="px-1.5 pb-2">
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="Search eco products..."
                  context="collection"
                />
              </div>

              {/* Eco Badge */}
              <div className="px-3 pb-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300/90">
                <TreePine className="w-4 h-4" />
                <span>Sustainable & Eco-Friendly</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
