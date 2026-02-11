import { useEffect, useState } from "react";
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

  const handleSearch = (term: string) => {
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setMobileMenuOpen(false);
  };

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
    <header className="sticky top-0 z-50 bg-transparent">
      <div className="container mx-auto px-2 sm:px-4 pt-2 pb-3 sm:pt-3 sm:pb-4">
        {/* Glass card with big border-radius */}
        <div
          className={cn(
            "rounded-[42px]", // ~40px radius (35–55 range)
            "border border-white/10 dark:border-zinc-700/60",
            // more transparent & subtle
            "bg-white/5 dark:bg-zinc-900/70",
            "backdrop-blur-2xl",
            "shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
            "transition-colors duration-300",
            "px-3 sm:px-5"
          )}
        >
          {/* Top row */}
          <div className="flex items-center justify-between gap-2 py-2.5 sm:py-3">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
            >
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/40">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="font-display text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-800 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent whitespace-nowrap">
                ecommerce<span className="hidden sm:inline"> Store</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className="font-display text-sm lg:text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                to="/products"
                className="font-display text-sm lg:text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
              >
                Collection
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                to="/contact-us"
                className="font-display text-sm lg:text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
              >
                Contact Us
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {/* Seller chip */}
              {sellerLoggedIn && sellerName && (
                <Button
                  variant="ghost"
                  className="hidden md:inline-flex h-9 rounded-full border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-xs sm:text-sm px-3"
                  onClick={() => navigate("/seller")}
                >
                  <span className="truncate max-w-[120px]">
                    Seller: {sellerName}
                  </span>
                </Button>
              )}

              {/* Customer profile */}
              {isCustomerLoggedIn ? (
                <div className="hidden md:flex items-center gap-2">
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
                    className="h-9 rounded-full border border-white/10 bg-white/5 dark:bg-zinc-800/70 hover:bg-white/10 hover:dark:bg-zinc-700/80 text-xs sm:text-sm px-3 max-w-[140px]"
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
                  className="hidden md:inline-flex h-9 rounded-full border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/15 text-xs sm:text-sm px-3"
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
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center shadow-md shadow-emerald-500/60">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full hover:bg-emerald-500/10 active:scale-95 transition-transform duration-200 will-change-transform"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center transition-transform duration-250 ease-out will-change-transform",
                    mobileMenuOpen
                      ? "rotate-90 scale-110"
                      : "rotate-0 scale-100"
                  )}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation – smoother (no max-height animation) */}
          <div
            className={cn(
              "md:hidden overflow-hidden transform-gpu will-change-transform transition-[opacity,transform] duration-220 ease-out",
              mobileMenuOpen
                ? "opacity-100 translate-y-0 max-h-[420px] pb-3"
                : "opacity-0 -translate-y-1 max-h-0 pointer-events-none"
            )}
          >
            <nav className="flex flex-col gap-4 mb-3 pt-1">
              <Link
                to="/"
                className="font-display text-base text-foreground/85 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="font-display text-base text-foreground/85 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Collection
              </Link>
              <Link
                to="/contact-us"
                className="font-display text-base text-foreground/85 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>

              {sellerLoggedIn && sellerName && (
                <Link
                  to="/seller"
                  className="font-display text-base text-foreground/85 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Seller: {sellerName}
                </Link>
              )}

              {isCustomerLoggedIn ? (
                <Link
                  to="/profile"
                  className="font-display text-base bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-700/25 dark:to-emerald-700/25 border border-emerald-500/60 text-black dark:text-emerald-50 py-2.5 px-4 rounded-xl hover:from-green-600/20 hover:to-emerald-600/20 dark:hover:from-green-700/35 dark:hover:to-emerald-700/35 transition-all duration-300 flex items-center gap-2 shadow-sm shadow-emerald-500/30"
                  onClick={() => setMobileMenuOpen(false)}
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
                  className="font-display text-base bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-700/25 dark:to-emerald-700/25 border border-emerald-500/60 text-black dark:text-emerald-50 py-2.5 px-4 rounded-xl hover:from-green-600/20 hover:to-emerald-600/20 dark:hover:from-green-700/35 dark:hover:to-emerald-700/35 transition-all duration-300 flex items-center gap-2 shadow-sm shadow-emerald-500/30"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              )}
            </nav>

            {/* Mobile Search Bar */}
            <div className="px-1.5">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search eco products..."
                context="collection"
              />
            </div>

            {/* Eco Badge */}
            <div className="mt-3 px-1.5 pb-1 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300/90">
              <TreePine className="w-4 h-4" />
              <span>Sustainable & Eco-Friendly</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
