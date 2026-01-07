import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ShoppingCart, Leaf, Heart, Search, TreePine, User, LogOut } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

import { SearchBar } from "@/components/SearchBar";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const navigate = useNavigate();
  const location = useLocation();
  const [sellerLoggedIn, setSellerLoggedIn] = useState<boolean>(
    typeof window !== "undefined" && sessionStorage.getItem("seller_logged_in") === "true"
  );
  const [sellerName, setSellerName] = useState<string | null>(
    typeof window !== "undefined" ? sessionStorage.getItem("seller_name") : null
  );
  
  const { user: customerUser, profile: customerProfile, isLoggedIn: isCustomerLoggedIn } = useCustomerAuth();

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleSearch = (term: string) => {
    // Navigate to products page with search term
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setMobileMenuOpen(false);
  };

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
    <header className="sticky top-0 z-50 border-b border-border/50 bg-gradient-to-r from-green-50/20 via-card/10 to-emerald-50/20 dark:from-green-900/10 dark:via-card/5 dark:to-emerald-900/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="font-display text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-800 dark:from-green-400 dark:to-emerald-300 bg-clip-text text-transparent whitespace-nowrap">
              ecommerce<span className="hidden sm:inline"> Store</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className="font-display text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link 
              to="/products" 
              className="font-display text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              Collection
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link 
              to="/track-order" 
              className="font-display text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              Track Order
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link 
              to="/contact-us" 
              className="font-display text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 relative group"
            >
              Contact Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {sellerLoggedIn && sellerName && (
              <Button
                variant="ghost"
                className="hidden md:flex"
                onClick={() => navigate('/seller')}
              >
                {sellerName}
              </Button>
            )}

            {/* Customer Profile */}
            {isCustomerLoggedIn ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile')}
                  className="relative hover:bg-gradient-to-br hover:from-green-600/20 hover:to-emerald-700/20 dark:hover:from-green-500/20 dark:hover:to-emerald-600/20"
                >
                  {customerProfile?.avatar_url ? (
                    <img 
                      src={customerProfile.avatar_url} 
                      alt="Profile" 
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[120px]"
                  onClick={() => navigate('/profile')}
                >
                  <span className="truncate">
                    {customerProfile?.full_name || customerUser?.email?.split('@')[0] || 'Customer'}
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex"
                onClick={() => navigate('/auth')}
              >
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}

            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="icon" className="relative hover:bg-gradient-to-br hover:from-green-600/20 hover:to-emerald-700/20 dark:hover:from-green-500/20 dark:hover:to-emerald-600/20">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative hover:bg-gradient-to-br hover:from-green-600/20 hover:to-emerald-700/20 dark:hover:from-green-500/20 dark:hover:to-emerald-600/20">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-500 dark:to-emerald-600 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden hover:bg-gradient-to-br hover:from-green-600/20 hover:to-emerald-700/20 dark:hover:from-green-500/20 dark:hover:to-emerald-600/20"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
        )}>
          <nav className="flex flex-col gap-4 mb-4">
            <Link 
              to="/" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Collection
            </Link>
            <Link 
              to="/track-order" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Track Order
            </Link>
            <Link 
              to="/contact-us" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact Us
            </Link>
            <Link 
              to="/wishlist" 
              className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Wishlist
            </Link>
            {sellerLoggedIn && sellerName && (
              <Link
                to="/seller"
                className="font-display text-base text-foreground/80 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {sellerName}
              </Link>
            )}
            {isCustomerLoggedIn ? (
              <Link
                to="/profile"
                className="font-display text-base bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-700/20 dark:to-emerald-700/20 border border-green-500/50 dark:border-emerald-500/70 text-black dark:text-black py-2.5 px-4 rounded-lg hover:from-green-600/20 hover:to-emerald-600/20 dark:hover:from-green-600/30 dark:hover:to-emerald-600/30 transition-all duration-300 flex items-center gap-2 shadow-sm shadow-green-500/20 dark:shadow-emerald-500/20"
                style={{ color: 'black' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
            ) : (
              <Link
                to="/auth"
                className="font-display text-base bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-700/20 dark:to-emerald-700/20 border border-green-500/50 dark:border-emerald-500/70 text-black dark:text-black py-2.5 px-4 rounded-lg hover:from-green-600/20 hover:to-emerald-600/20 dark:hover:from-green-600/30 dark:hover:to-emerald-600/30 transition-all duration-300 flex items-center gap-2 shadow-sm shadow-green-500/20 dark:shadow-emerald-500/20"
                style={{ color: 'black' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Login
              </Link>
            )}
          </nav>
          
          {/* Mobile Search Bar */}
          <div className="px-2">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search eco products..." 
              context="collection"
            />
          </div>
          
          {/* Eco Badge for Mobile */}
          <div className="mt-4 px-2 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
            <TreePine className="w-4 h-4" />
            <span>Sustainable & Eco-Friendly</span>
          </div>
        </div>
      </div>
    </header>
  );
};
