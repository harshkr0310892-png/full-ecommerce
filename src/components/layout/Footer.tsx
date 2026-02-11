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

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    // Changed to fixed so content scrolls BEHIND it (essential for glass effect)
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="container mx-auto px-2 sm:px-4 pt-4 pb-2">
        <div
          className={cn(
            // --- SHAPE & POSITION ---
            "pointer-events-auto", // Re-enable clicks
            "rounded-full", // Cleaner pill shape
            "px-4 sm:px-6",
            "transition-all duration-300",
            
            // --- THE GLASS EFFECT (FIXED) ---
            // Light Mode: Slightly white, very blurry
            "bg-white/60", 
            // Dark Mode: Dark grey/black but LOW opacity (30%)
            "dark:bg-black/30", 
            // The Blur: This creates the frosted glass look
            "backdrop-blur-xl supports-[backdrop-filter]:bg-white/20",
            
            // --- BORDER & SHADOW ---
            // Subtle white border for highlight
            "border border-white/20 dark:border-white/10",
            // Soft shadow to lift it off the page
            "shadow-lg shadow-black/5 dark:shadow-black/20"
          )}
        >
          {/* Top row */}
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group flex-shrink-0"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="font-display text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-100 whitespace-nowrap tracking-tight">
                ecommerce<span className="hidden sm:inline text-emerald-600 dark:text-emerald-500">Store</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { name: "Home", path: "/" },
                { name: "Collection", path: "/products" },
                { name: "Contact Us", path: "/contact-us" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    location.pathname === link.path
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Seller chip */}
              {sellerLoggedIn && sellerName && (
                <Button
                  variant="ghost"
                  className="hidden md:inline-flex h-9 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs px-4"
                  onClick={() => navigate("/seller")}
                >
                  Seller Panel
                </Button>
              )}

              {/* Customer profile */}
              {isCustomerLoggedIn ? (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="h-9 px-3 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 gap-2"
                    onClick={() => navigate("/profile")}
                  >
                     {customerProfile?.avatar_url ? (
                      <img
                        src={customerProfile.avatar_url}
                        alt="Profile"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {customerProfile?.full_name?.split(' ')[0] || "Account"}
                    </span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200"
                  onClick={() => navigate("/auth")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}

              {/* Cart button */}
              <Link to="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div
            className={cn(
              "md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-zinc-200/50 dark:border-white/5",
              mobileMenuOpen ? "max-h-[500px] opacity-100 pb-4 mt-2" : "max-h-0 opacity-0 mt-0"
            )}
          >
            <nav className="flex flex-col gap-2 pt-4">
              <Link
                to="/"
                className="px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 font-medium"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 font-medium"
              >
                Collection
              </Link>
              <Link
                to="/contact-us"
                className="px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 font-medium"
              >
                Contact Us
              </Link>

              {isCustomerLoggedIn ? (
                 <Link
                 to="/profile"
                 className="mx-2 mt-2 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex items-center gap-3"
               >
                 {customerProfile?.avatar_url ? (
                   <img
                     src={customerProfile.avatar_url}
                     alt="Profile"
                     className="w-8 h-8 rounded-full object-cover"
                   />
                 ) : (
                   <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                     <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                   </div>
                 )}
                 <div>
                   <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {customerProfile?.full_name || "My Account"}
                   </p>
                   <p className="text-xs text-zinc-500 dark:text-zinc-400">View Profile</p>
                 </div>
               </Link>
              ) : (
                <Link
                  to="/auth"
                  className="mx-4 mt-2 py-2.5 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-medium shadow-lg shadow-emerald-600/20"
                >
                  Sign In / Sign Up
                </Link>
              )}
            </nav>

            <div className="mt-4 px-2">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search products..."
                context="collection"
              />
            </div>
            
            {/* Eco Badge Mobile */}
            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                <TreePine className="w-3 h-3" />
                100% Sustainable
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
