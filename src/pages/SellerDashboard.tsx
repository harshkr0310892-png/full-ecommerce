import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store, LogOut, Loader2, RefreshCw, Package, Tag, ShoppingBag, Upload, Edit2, Trash2, X, TrendingUp, Calendar, DollarSign, BarChart3, MessageCircle, Send, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AttributesManager } from "@/components/admin/AttributesManager";
import { DeliveryBoysManager } from "@/components/admin/DeliveryBoysManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";

interface Seller {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_banned: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_status: string;
  created_at: string;
  seller_name?: string | null;
  discount_percentage?: number | null;
  images?: string[] | null;
  stock_quantity?: number | null;
  category_id?: string | null;
  cash_on_delivery?: boolean;
  features?: { feature: string }[] | null;
  detailed_description?: string | null;
  height?: string | null;
  width?: string | null;
  weight?: string | null;
  brand?: string | null;
  brand_logo_url?: string | null;
  seller_description?: string | null;
  gst_percentage?: number | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  parent_id?: string | null;
}

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_state: string | null;
  customer_pincode: string | null;
  customer_landmark1: string | null;
  customer_landmark2: string | null;
  customer_landmark3: string | null;
  customer_email: string | null;
  status: string;
  payment_method: 'online' | 'cod';
  total: number;
  created_at: string;
  updated_at: string;
  delivery_boy_id: string | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
}

interface OrderMessage {
  id: string;
  order_id: string;
  message: string;
  is_admin: boolean;
  is_delivery_boy?: boolean;
  created_at: string;
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [isSellerLoggedIn, setIsSellerLoggedIn] = useState(false);
  const sellerEmail = sessionStorage.getItem("seller_email");
  const sellerName = sessionStorage.getItem("seller_name");
  const sellerId = sessionStorage.getItem("seller_id");
  type TabValue = "products" | "attributes" | "orders" | "sales" | "delivery-boys" | "categories";
  const [activeTab, setActiveTab] = useState<TabValue>("products");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [hasVariantImages, setHasVariantImages] = useState(false);
  const [orderItems, setOrderItems] = useState<Record<string, { id: string; order_id: string; product_id: string; quantity: number; product_name?: string; product_price?: number; variant_info?: { attribute_name?: string; value_name?: string; variant_id?: string } | null }[]>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderMessages, setOrderMessages] = useState<Record<string, OrderMessage[]>>({});
  const [newSellerMessage, setNewSellerMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    detailed_description: "",
    price: "",
    discount_percentage: "0",
    stock_status: "in_stock",
    stock_quantity: "0",
    category_id: "",
    main_category_id: "",
    cash_on_delivery: false,
    features: [{ feature: "" }] as { feature: string }[],
    height: "",
    width: "",
    weight: "",
    brand: "",
    brand_logo_url: "",
    seller_name: "",
    seller_description: "",
    gst_percentage: "",
  });

  // State for sales year selection
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Fetch messages for selected order and subscribe to realtime inserts
  useEffect(() => {
    if (!selectedOrder) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", selectedOrder.id)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to fetch messages");
        return;
      }
      if (data) {
        setOrderMessages(prev => ({ ...prev, [selectedOrder.id]: data as OrderMessage[] }));
      }
    };
    fetchMessages();
    const channel = supabase
      .channel(`order_messages:${selectedOrder.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "order_messages",
        filter: `order_id=eq.${selectedOrder.id}`,
      }, (payload) => {
        setOrderMessages(prev => {
          const current = prev[selectedOrder.id] || [];
          const exists = current.some(m => m.id === (payload.new as any).id);
          if (exists) return prev;
          const updated = [...current, payload.new as OrderMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          return { ...prev, [selectedOrder.id]: updated };
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrder]);

  const sendSellerMessage = async () => {
    if (!newSellerMessage.trim() || !selectedOrder) return;
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from("order_messages")
        .insert({
          order_id: selectedOrder.id,
          message: newSellerMessage.trim(),
          is_admin: true,
          is_delivery_boy: false,
        });
      if (error) throw error;
      const { data, error: fetchError } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", selectedOrder.id)
        .order("created_at", { ascending: true });
      if (fetchError) {
        console.error("Error refreshing messages:", fetchError);
      } else if (data) {
        setOrderMessages(prev => ({ ...prev, [selectedOrder.id]: data as OrderMessage[] }));
      }
      setNewSellerMessage("");
      toast.success("Message sent!");
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error(err?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("seller_logged_in") === "true";
    setIsSellerLoggedIn(isLoggedIn);
    if (!isLoggedIn && sellerEmail) {
      // Try to auto-verify from email in session (set via Header)
      setIsSellerLoggedIn(true);
    } else if (!isLoggedIn) {
      navigate("/seller/login");
    }
  }, [navigate, sellerEmail]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("seller_logged_in");
    sessionStorage.removeItem("seller_email");
    sessionStorage.removeItem("seller_name");
    sessionStorage.removeItem("seller_id");
    navigate("/seller/login");
  }, [navigate]);

  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ["seller", sellerEmail],
    queryFn: async () => {
      if (!sellerEmail) return null as Seller | null;
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("email", sellerEmail)
        .maybeSingle();
      if (error) throw error;
      return data as Seller | null;
    },
    enabled: !!sellerEmail,
  });

  useEffect(() => {
    if (seller?.id) {
      if (sessionStorage.getItem("seller_id") !== seller.id) {
        sessionStorage.setItem("seller_id", seller.id);
      }
      if (seller.name && sessionStorage.getItem("seller_name") !== seller.name) {
        sessionStorage.setItem("seller_name", seller.name);
      }
    }
  }, [seller]);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["seller-products", seller?.id || sellerId],
    queryFn: async () => {
      const id = seller?.id || sellerId;
      if (!id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!(seller?.id || sellerId),
  });

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("seller_id", null)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  // Seller-created category values (child categories where seller_id = this seller)
  const { data: sellerCategoryValues, refetch: refetchSellerCategoryValues } = useQuery({
    queryKey: ["seller-category-values", seller?.id || sellerId],
    queryFn: async () => {
      const id = seller?.id || sellerId;
      if (!id) return [] as Category[];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("seller_id", id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!(seller?.id || sellerId),
  });

  const valuesByParent = (sellerCategoryValues || []).reduce((acc: Record<string, Category[]>, v) => {
    const parent = v.parent_id || "";
    if (!acc[parent]) acc[parent] = [];
    acc[parent].push(v);
    return acc;
  }, {} as Record<string, Category[]>);

  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<Category | null>(null);
  const [valueForm, setValueForm] = useState({ name: "", description: "", parent_id: "" });

  const addValueMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string; parent_id: string }) => {
      const activeSellerId = seller?.id || sellerId;
      if (!activeSellerId) throw new Error("Seller not detected");
      const data = {
        name: payload.name,
        description: payload.description || null,
        parent_id: payload.parent_id,
        seller_id: activeSellerId,
        sort_order: 0,
        is_active: true,
      };
      const { error } = await supabase.from("categories").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchSellerCategoryValues && refetchSellerCategoryValues();
      refetchCategories && refetchCategories();
      toast.success("Value added");
      setValueDialogOpen(false);
      setValueForm({ name: "", description: "", parent_id: "" });
      setEditingValue(null);
    },
    onError: () => toast.error("Failed to add value"),
  });

  const updateValueMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; description?: string }) => {
      const activeSellerId = seller?.id || sellerId;
      if (!activeSellerId) throw new Error("Seller not detected");
      const data = { name: payload.name, description: payload.description || null };
      const { error } = await supabase.from("categories").update(data).eq("id", payload.id).eq("seller_id", activeSellerId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchSellerCategoryValues && refetchSellerCategoryValues();
      toast.success("Value updated");
      setValueDialogOpen(false);
      setEditingValue(null);
    },
    onError: () => toast.error("Failed to update value"),
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (id: string) => {
      const activeSellerId = seller?.id || sellerId;
      if (!activeSellerId) throw new Error("Seller not detected");
      const { error } = await supabase.from("categories").delete().eq("id", id).eq("seller_id", activeSellerId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchSellerCategoryValues && refetchSellerCategoryValues();
      toast.success("Value deleted");
    },
    onError: () => toast.error("Failed to delete value"),
  });

  // Sellers can view admin categories and add/edit/delete their own "values" (child categories) under them.

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["seller-orders", seller?.id || sellerId],
    queryFn: async () => {
      const id = seller?.id || sellerId;
      if (!id) return [] as Order[];

      // IMPORTANT:
      // Primary path: use order_items.seller_id snapshot (survives product deletion).
      // Fallback path: for older/new rows where seller_id is NULL, derive via join to products.
      // This keeps seller dashboard working even if seller_id wasn't captured in cart/checkout.

      const orderIdsSet = new Set<string>();

      // (A) Snapshot-based lookup
      const { data: snapshotItems, error: snapshotError } = await supabase
        .from("order_items")
        .select("order_id")
        .eq("seller_id", id);
      if (snapshotError) throw snapshotError;
      (snapshotItems || []).forEach((it: any) => orderIdsSet.add(it.order_id as string));

      // (B) Fallback join-based lookup (works only while products still exist)
      const { data: joinItems, error: joinError } = await supabase
        .from("order_items")
        .select("order_id, products!inner(seller_id)")
        .eq("products.seller_id", id);
      if (joinError) throw joinError;
      (joinItems || []).forEach((it: any) => orderIdsSet.add(it.order_id as string));

      const orderIds = Array.from(orderIdsSet);
      if (orderIds.length === 0) return [] as Order[];

      const { data: filteredOrders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("id", orderIds)
        .order("created_at", { ascending: false });
      if (ordersError) throw ordersError;

      return (filteredOrders || []) as Order[];
    },
    enabled: !!(seller?.id || sellerId),
  });

  // Order filters
  const [orderFilter, setOrderFilter] = useState<
    | "all"
    | "this_month"
    | "by_month"
    | "week_1"
    | "week_2"
    | "week_3"
    | "week_4"
    | "last_7"
    | "custom"
  >("all");
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0,7)); // YYYY-MM
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const computeRange = (filterType: string) => {
    const now = new Date();
    if (!orders || orders.length === 0) return null;
    if (filterType === "all") return null;
    if (filterType === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    if (filterType === "by_month") {
      const [y, m] = (filterMonth || now.toISOString().slice(0,7)).split("-").map(Number);
      const start = new Date(y, (m || now.getMonth()+1) - 1, 1);
      const end = new Date(y, (m || now.getMonth()+1), 0, 23, 59, 59, 999);
      return { start, end };
    }
    if (filterType.startsWith("week_")) {
      const week = Number(filterType.split("_")[1].slice(0)) || 1;
      // determine current month
      const year = now.getFullYear();
      const month = now.getMonth();
      const startDay = (week - 1) * 7 + 1;
      const start = new Date(year, month, startDay);
      const end = new Date(year, month, startDay + 6, 23, 59, 59, 999);
      // clamp to month
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      if (end > monthEnd) end.setTime(monthEnd.getTime());
      return { start, end };
    }
    if (filterType === "last_7") {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return { start, end };
    }
    if (filterType === "custom") {
      if (!customFrom || !customTo) return null;
      const start = new Date(customFrom);
      const end = new Date(customTo);
      end.setHours(23,59,59,999);
      return { start, end };
    }
    return null;
  };

  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [] as Order[];
    const range = computeRange(orderFilter);
    if (!range) return orders;
    return orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= range.start && d <= range.end;
    });
  }, [orders, orderFilter, filterMonth, customFrom, customTo]);

  const { data: deliveryBoys } = useQuery({
    queryKey: ["seller-delivery-boys", seller?.id || sellerId],
    queryFn: async () => {
      const id = seller?.id || sellerId;
      if (!id) return [] as any[];
      const { data, error } = await supabase
        .from("delivery_boys" as any)
        .select("*")
        .eq("seller_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!(seller?.id || sellerId),
  });

  const { data: sellerProducts, isLoading: sellerProductsLoading, refetch: refetchSellerProducts } = useQuery({
    queryKey: ["seller-products", seller?.id || sellerId],
    queryFn: async () => {
      const id = seller?.id || sellerId;
      if (!id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,price,image_url,stock_status,created_at,seller_name,seller_id,category_id")
        .eq("seller_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!(seller?.id || sellerId),
  });

  useEffect(() => {
    if (!orders || orders.length === 0) {
      setOrderItems({});
      return;
    }
    const loadItems = async () => {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orders.map(o => o.id));
      if (data) {
        const byOrder: Record<string, any[]> = {};
        data.forEach(item => {
          const pid = (item as any).product_id as string;
          const product = (sellerProducts || []).find(p => p.id === pid);
          if (!product) return;
          const entry = {
            id: (item as any).id as string,
            order_id: (item as any).order_id as string,
            product_id: pid,
            quantity: (item as any).quantity as number,
            product_name: product.name,
            product_price: Number(product.price),
            variant_info: (item as any).variant_info as any,
          };
          const oid = (item as any).order_id as string;
          if (!byOrder[oid]) byOrder[oid] = [];
          byOrder[oid].push(entry);
        });
        setOrderItems(byOrder);
      }
    };
    loadItems();
  }, [orders, sellerProducts]);

  const getProductById = (id: string) => {
    return (sellerProducts || []).find(p => p.id === id);
  };

  const addFeature = () => {
    setProductForm({
      ...productForm,
      features: [...productForm.features, { feature: "" }],
    });
  };
  const removeFeature = (index: number) => {
    const newFeatures = [...productForm.features];
    newFeatures.splice(index, 1);
    setProductForm({
      ...productForm,
      features: newFeatures,
    });
  };
  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...productForm.features];
    newFeatures[index] = { feature: value };
    setProductForm({
      ...productForm,
      features: newFeatures,
    });
  };

  useEffect(() => {
    if (seller && (!seller.is_active || seller.is_banned)) {
      toast.error("Access restricted");
      handleLogout();
    }
  }, [seller, handleLogout]);

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      detailed_description: "",
      price: "",
      discount_percentage: "0",
      stock_status: "in_stock",
      stock_quantity: "0",
      category_id: "",
      main_category_id: "",
      cash_on_delivery: false,
      features: [{ feature: "" }],
      height: "",
      width: "",
      weight: "",
      brand: "",
      brand_logo_url: "",
      seller_name: seller?.name || sellerName || "",
      seller_description: "",
      gst_percentage: "",
    });
    setProductImages([]);
    setHasVariantImages(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    (async () => {
      let mainCatId = "";
      if (product.category_id) {
        const adminCat = (categories || []).find(c => c.id === product.category_id);
        if (adminCat) mainCatId = product.category_id;
        else {
          const localVal = (sellerCategoryValues || []).find(c => c.id === product.category_id);
          if (localVal) mainCatId = localVal.parent_id || "";
          else {
            try {
              const { data: catData } = await supabase.from("categories").select("parent_id").eq("id", product.category_id).maybeSingle();
              if (catData && (catData as any).parent_id) mainCatId = (catData as any).parent_id;
            } catch (e) {
              // ignore
            }
          }
        }
      }
      setProductForm({
      name: product.name || "",
      description: product.description || "",
      detailed_description: product.detailed_description || "",
      price: String(product.price ?? ""),
      discount_percentage: String(product.discount_percentage ?? "0"),
      stock_status: product.stock_status || "in_stock",
      stock_quantity: String(product.stock_quantity ?? "0"),
      category_id: product.category_id || "",
      main_category_id: mainCatId,
      cash_on_delivery: Boolean(product.cash_on_delivery),
      features: Array.isArray(product.features) ? product.features : [{ feature: "" }],
      height: product.height || "",
      width: product.width || "",
      weight: product.weight || "",
      brand: product.brand || "",
      brand_logo_url: product.brand_logo_url || "",
      seller_name: seller?.name || sellerName || "",
      seller_description: product.seller_description || "",
      gst_percentage: product.gst_percentage != null ? String(product.gst_percentage) : "",
      });
    })();
    setProductImages(product.images || (product.image_url ? [product.image_url] : []));
    setHasVariantImages(false);
    setProductDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = 8 - productImages.length;
    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }
    setUploadingImages(true);
    const newImages: string[] = [];
    try {
      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
        newImages.push(publicUrl);
      }
      setProductImages([...productImages, ...newImages]);
      toast.success("Images uploaded successfully!");
    } catch {
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingBrandLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `brand-logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
      setProductForm({ ...productForm, brand_logo_url: publicUrl });
      toast.success("Brand logo uploaded successfully!");
    } catch {
      toast.error("Failed to upload brand logo");
    } finally {
      setUploadingBrandLogo(false);
      if (brandLogoInputRef.current) brandLogoInputRef.current.value = "";
    }
  };

  const productMutation = useMutation({
    mutationFn: async (product: typeof productForm & { id?: string }) => {
      const activeSellerId = seller?.id || sellerId;
      const activeSellerName = seller?.name || sellerName;

      if (!activeSellerId || !activeSellerName) throw new Error("Seller not detected");
      const data = {
        name: product.name,
        description: product.description || null,
        price: parseFloat(product.price),
        discount_percentage: parseInt(product.discount_percentage) || 0,
        image_url: productImages[0] || null,
        images: productImages,
        stock_status: product.stock_status,
        stock_quantity: parseInt(product.stock_quantity) || 0,
        category_id: product.category_id || product.main_category_id || null,
        cash_on_delivery: Boolean(product.cash_on_delivery),
        features: product.features,
        detailed_description: product.detailed_description || null,
        dimensions: product.height || product.width || product.weight
          ? `${product.height || ""} x ${product.width || ""} x ${product.weight || ""}`.replace(/x\\s*x/g, "x").replace(/^\\s*x\\s*|\\s*x\\s*$/g, "") || null
          : null,
        height: product.height || null,
        width: product.width || null,
        weight: product.weight || null,
        brand: product.brand || null,
        brand_logo_url: product.brand_logo_url || null,
        seller_name: activeSellerName,
        seller_description: product.seller_description || null,
        gst_percentage: product.gst_percentage ? parseFloat(product.gst_percentage) : null,
        seller_id: activeSellerId,
      };
      if (product.id) {
        const { error } = await supabase.from("products").update(data).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      const activeSellerId = seller?.id || sellerId;
      queryClient.invalidateQueries({ queryKey: ["seller-products", activeSellerId] });
      toast.success(editingProduct ? "Product updated!" : "Product added!");
      resetProductForm();
      setProductDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error saving product:", error);
      toast.error(`Failed to save product: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders", seller?.id || sellerId] });
      toast.success("Order status updated!");
    },
    onError: (error) => {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    },
  });

  const updateOrderDeliveryBoyMutation = useMutation({
    mutationFn: async ({ id, delivery_boy_id }: { id: string; delivery_boy_id: string | null }) => {
      const { error } = await supabase.from("orders" as any).update({ delivery_boy_id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders", seller?.id || sellerId] });
      toast.success("Delivery boy assignment updated!");
    },
    onError: (error) => {
      console.error("Error updating delivery boy assignment:", error);
      toast.error("Failed to update delivery boy assignment");
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders", seller?.id || sellerId] });
      toast.success("Order deleted!");
    },
    onError: (error) => {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const activeSellerId = seller?.id || sellerId;
      if (!activeSellerId) throw new Error("Seller not detected");
      const { error } = await supabase.from("products").delete().eq("id", id).eq("seller_id", activeSellerId);
      if (error) throw error;
    },
    onSuccess: () => {
      const activeSellerId = seller?.id || sellerId;
      queryClient.invalidateQueries({ queryKey: ["seller-products", activeSellerId] });
      toast.success("Product deleted!");
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      toast.error(`Failed to delete product: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  if (!isSellerLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            <span className="font-display text-xl font-bold gradient-gold-text">
              Seller Dashboard
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm mr-4">
              {sellerName}
            </span>
            <Button variant="royalOutline" size="sm" onClick={handleLogout} className="px-2 py-1 text-sm">
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as TabValue)}>
          {/* Mobile sidebar */}
          <div className="sm:hidden mb-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="royalOutline" size="sm" className="w-full justify-start">
                  <Menu className="w-4 h-4 mr-2" />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-4 border-b border-border/50">
                  <SheetTitle>Seller Menu</SheetTitle>
                </SheetHeader>
                <div className="p-3">
                  <div className="grid gap-2">
                    <Button
                      variant={activeTab === "products" ? "royal" : "ghost"}
                      className="justify-start"
                      onClick={() => { setActiveTab("products"); setMobileMenuOpen(false); }}
                    >
                      <Package className="w-4 h-4 mr-2" /> Products
                    </Button>
                    <Button
                      variant={activeTab === "attributes" ? "royal" : "ghost"}
                      className="justify-start"
                      onClick={() => { setActiveTab("attributes"); setMobileMenuOpen(false); }}
                    >
                      <Tag className="w-4 h-4 mr-2" /> Attributes
                    </Button>
                    <Button
                      variant={activeTab === "orders" ? "royal" : "ghost"}
                      className="justify-start"
                      onClick={() => { setActiveTab("orders"); setMobileMenuOpen(false); }}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" /> Orders
                    </Button>
                    <Button
                      variant={activeTab === "sales" ? "royal" : "ghost"}
                      className="justify-start"
                      onClick={() => { setActiveTab("sales"); setMobileMenuOpen(false); }}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" /> Sales
                    </Button>
                    <Button
                      variant={activeTab === "delivery-boys" ? "royal" : "ghost"}
                      className="justify-start"
                      onClick={() => { setActiveTab("delivery-boys"); setMobileMenuOpen(false); }}
                    >
                      <Package className="w-4 h-4 mr-2" /> Delivery Boys
                    </Button>
                    <Button
                      variant={activeTab === "categories" ? "royal" : "ghost"}
                      className="justify-start"
                      onClick={() => { setActiveTab("categories"); setMobileMenuOpen(false); }}
                    >
                      <Tag className="w-4 h-4 mr-2" /> Categories
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop tabs */}
          <TabsList className="hidden sm:flex w-max min-w-full sm:min-w-max gap-2 sm:flex-row sm:items-center mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2 whitespace-nowrap w-full justify-start sm:w-auto sm:justify-center">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="attributes" className="flex items-center gap-2 whitespace-nowrap w-full justify-start sm:w-auto sm:justify-center">
              <Tag className="w-4 h-4" />
              Attributes
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 whitespace-nowrap w-full justify-start sm:w-auto sm:justify-center">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2 whitespace-nowrap w-full justify-start sm:w-auto sm:justify-center">
              <TrendingUp className="w-4 h-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="delivery-boys" className="flex items-center gap-2 whitespace-nowrap w-full justify-start sm:w-auto sm:justify-center">
              <Package className="w-4 h-4" />
              Delivery Boys
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2 whitespace-nowrap w-full justify-start sm:w-auto sm:justify-center">
              <Tag className="w-4 h-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Your Products</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchProducts()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Dialog
                  open={productDialogOpen}
                  onOpenChange={(open) => {
                    setProductDialogOpen(open);
                    if (!open) resetProductForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="royal">Add Product</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display">
                        {editingProduct ? "Edit Product" : "Add New Product"}
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        productMutation.mutate({
                          ...productForm,
                          id: editingProduct?.id,
                        });
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="Enter product name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          placeholder="Enter product description"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="detailed_description">Detailed Description</Label>
                        <Textarea
                          id="detailed_description"
                          value={productForm.detailed_description}
                          onChange={(e) => setProductForm({ ...productForm, detailed_description: e.target.value })}
                          placeholder="Enter detailed product description"
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Features</Label>
                        <div className="space-y-2 mt-1">
                          {productForm.features.map((feature, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={feature.feature}
                                onChange={(e) => updateFeature(index, e.target.value)}
                                placeholder="Enter a feature"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeFeature(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" onClick={addFeature} className="w-full">
                            <X className="w-4 h-4 mr-2" />
                            Add Feature
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={productForm.brand}
                          onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                          placeholder="e.g., Nike, Apple, Samsung"
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brand_logo">Brand Logo</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => brandLogoInputRef.current?.click()}
                            disabled={uploadingBrandLogo}
                            className="w-full"
                          >
                            {uploadingBrandLogo ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose Brand Logo
                              </>
                            )}
                          </Button>
                          {productForm.brand_logo_url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setProductForm({ ...productForm, brand_logo_url: "" })}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {productForm.brand_logo_url && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={productForm.brand_logo_url}
                              alt="Brand Logo"
                              className="w-12 h-12 rounded-full object-cover border border-border"
                            />
                            <span className="text-xs text-muted-foreground">Logo uploaded</span>
                          </div>
                        )}
                        <input
                          ref={brandLogoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBrandLogoUpload}
                          className="hidden"
                          id="brand_logo"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="height">Height</Label>
                          <Input
                            id="height"
                            value={productForm.height}
                            onChange={(e) => setProductForm({ ...productForm, height: e.target.value })}
                            placeholder="e.g., 10 cm"
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="width">Width</Label>
                          <Input
                            id="width"
                            value={productForm.width}
                            onChange={(e) => setProductForm({ ...productForm, width: e.target.value })}
                            placeholder="e.g., 5 cm"
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="weight">Weight</Label>
                          <Input
                            id="weight"
                            value={productForm.weight}
                            onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                            placeholder="e.g., 2 kg"
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="seller_description">Seller Description</Label>
                        <Textarea
                          id="seller_description"
                          value={productForm.seller_description}
                          onChange={(e) => setProductForm({ ...productForm, seller_description: e.target.value })}
                          placeholder="Tell us about the seller"
                          className="mt-1 text-sm min-h-[80px]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gst_percentage">GST (%)</Label>
                        <Input
                          id="gst_percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={productForm.gst_percentage}
                          onChange={(e) => setProductForm({ ...productForm, gst_percentage: e.target.value })}
                          placeholder="e.g., 18"
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="price">Price (₹) *</Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="0.00"
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="discount">Discount (%)</Label>
                          <Input
                            id="discount"
                            type="number"
                            min="0"
                            max="100"
                            value={productForm.discount_percentage}
                            onChange={(e) => setProductForm({ ...productForm, discount_percentage: e.target.value })}
                            placeholder="0"
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="stock_status">Stock Status</Label>
                          <Select
                            value={productForm.stock_status}
                            onValueChange={(value) => setProductForm({ ...productForm, stock_status: value })}
                          >
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_stock">In Stock</SelectItem>
                              <SelectItem value="low_stock">Low Stock</SelectItem>
                              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="stock_quantity">Stock Quantity</Label>
                          <Input
                            id="stock_quantity"
                            type="number"
                            min="0"
                            value={productForm.stock_quantity}
                            onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                            placeholder="0"
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <div>
                          <Label>Main Category (admin)</Label>
                          <Select
                            value={productForm.main_category_id}
                            onValueChange={(value) => setProductForm({ ...productForm, main_category_id: value, category_id: "" })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select main category" />
                            </SelectTrigger>
                            <SelectContent>
                              {(categories || []).map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Label className="mt-3">Your Category (value)</Label>
                          <Select
                            value={productForm.category_id || (productForm.main_category_id || "")}
                            onValueChange={(value) => {
                              if (value === "use-main") {
                                setProductForm({ ...productForm, category_id: productForm.main_category_id || "" });
                              } else {
                                setProductForm({ ...productForm, category_id: value });
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select your category (or use main)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="use-main">Use main category</SelectItem>
                              {((sellerCategoryValues || []).filter((v: any) => v.parent_id === productForm.main_category_id)).map((val: any) => (
                                <SelectItem key={val.id} value={val.id}>{val.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <Switch
                          checked={productForm.cash_on_delivery}
                          onCheckedChange={(checked) =>
                            setProductForm({ ...productForm, cash_on_delivery: Boolean(checked) })
                          }
                        />
                        <Label>Enable Cash on Delivery</Label>
                      </div>
                      {!hasVariantImages && (
                        <div>
                          <Label>Product Images (Max 8)</Label>
                          <div className="mt-2 space-y-3">
                            {productImages.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {productImages.map((url, index) => (
                                  <div key={index} className="relative aspect-square">
                                    <img
                                      src={url}
                                      alt={`Product ${index + 1}`}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {productImages.length < 8 && (
                              <div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full text-sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploadingImages}
                                >
                                  {uploadingImages ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Upload Images ({productImages.length}/8)
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {editingProduct && (
                        <ProductVariantsEditor
                          productId={editingProduct.id}
                          basePrice={parseFloat(productForm.price) || 0}
                          onVariantImagesStatusChange={setHasVariantImages}
                          sellerId={seller?.id || sellerId || undefined}
                        />
                      )}
                      <Button type="submit" variant="royal" className="w-full">
                        {editingProduct ? "Update Product" : "Add Product"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {productsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {product.images?.[0] || product.image_url ? (
                        <img
                          src={product.images?.[0] || product.image_url || ""}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold truncate">{product.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="font-medium">₹{Number(product.price).toFixed(2)}</span>
                        {product.discount_percentage && product.discount_percentage > 0 && (
                          <span className="text-green-600">-{product.discount_percentage}%</span>
                        )}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs",
                            product.stock_status === "in_stock" && "bg-green-500/10 text-green-600",
                            product.stock_status === "low_stock" && "bg-yellow-500/10 text-yellow-600",
                            product.stock_status === "out_of_stock" && "bg-red-500/10 text-red-600"
                          )}
                        >
                          {(product.stock_quantity || 0)} left
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No products yet. Add your first product!</p>
              </div>
            )}
          </TabsContent>

          {/* Categories tab removed for sellers. Admin manages categories; sellers select from admin categories when adding products. */}

          <TabsContent value="attributes" className="space-y-6">
            <AttributesManager sellerId={sellerId || undefined} />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">Sales Analytics</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">View Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const selected = Number(e.target.value);
                    const currentYear = new Date().getFullYear();
                    if (selected <= currentYear) {
                      setSelectedYear(selected);
                    } else {
                      toast.error(`Cannot select year ${selected}. Future years are not allowed.`);
                    }
                  }}
                  className="px-3 py-1 border rounded-md bg-card text-sm"
                >
                  {(() => {
                    // Get all years with sales data and include current year
                    const currentYear = new Date().getFullYear();
                    const availableYears = new Set<number>([currentYear]);
                    
                    if (orders && orders.length > 0) {
                      orders.forEach(order => {
                        if (order.status !== 'cancelled') {
                          const orderYear = new Date(order.created_at).getFullYear();
                          availableYears.add(orderYear);
                        }
                      });
                    }
                    
                    // Convert to sorted array in descending order
                    const sortedYears = Array.from(availableYears).sort((a, b) => b - a);
                    
                    return sortedYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                        {year === currentYear && " (Current)"}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">This Month ({selectedYear})</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && 
                           orderDate.getFullYear() === selectedYear &&
                           o.status !== 'cancelled';
                  }).reduce((sum, o) => sum + Number(o.total), 0).toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && 
                           orderDate.getFullYear() === selectedYear &&
                           o.status !== 'cancelled';
                  }).length || 0} orders
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Year {selectedYear}</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate.getFullYear() === selectedYear &&
                           o.status !== 'cancelled';
                  }).reduce((sum, o) => sum + Number(o.total), 0).toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate.getFullYear() === selectedYear &&
                           o.status !== 'cancelled';
                  }).length || 0} orders
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">All Time</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{orders?.filter(o => o.status !== 'cancelled')
                    .reduce((sum, o) => sum + Number(o.total), 0).toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {orders?.filter(o => o.status !== 'cancelled').length || 0} total orders
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Avg Order</span>
                </div>
                <p className="text-3xl font-bold">
                  ₹{orders && orders.filter(o => o.status !== 'cancelled').length > 0
                    ? Math.round(orders.filter(o => o.status !== 'cancelled')
                        .reduce((sum, o) => sum + Number(o.total), 0) / 
                        orders.filter(o => o.status !== 'cancelled').length).toLocaleString()
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">per order</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="font-display text-lg font-bold mb-4">Monthly Sales ({selectedYear})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthName = new Date(selectedYear, i).toLocaleString('default', { month: 'short' });
                  const monthSales = orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate.getMonth() === i && 
                           orderDate.getFullYear() === selectedYear &&
                           o.status !== 'cancelled';
                  }).reduce((sum, o) => sum + Number(o.total), 0) || 0;
                  const monthOrders = orders?.filter(o => {
                    const orderDate = new Date(o.created_at);
                    return orderDate.getMonth() === i && 
                           orderDate.getFullYear() === selectedYear &&
                           o.status !== 'cancelled';
                  }).length || 0;
                  const isCurrentMonth = i === new Date().getMonth() && selectedYear === new Date().getFullYear();
                  
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "p-4 rounded-lg border",
                        isCurrentMonth ? "border-primary bg-primary/5" : "border-border/50"
                      )}
                    >
                      <p className={cn(
                        "text-sm font-medium mb-1",
                        isCurrentMonth ? "text-primary" : "text-muted-foreground"
                      )}>
                        {monthName}
                      </p>
                      <p className="text-xl font-bold">₹{monthSales.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{monthOrders} orders</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h3 className="font-display text-lg font-bold mb-4">Yearly Sales Comparison</h3>
              <div className="space-y-4">
                {(() => {
                  const yearlyData = orders?.reduce((acc, order) => {
                    if (order.status === 'cancelled') return acc;
                    const year = new Date(order.created_at).getFullYear();
                    if (!acc[year]) {
                      acc[year] = { total: 0, count: 0 };
                    }
                    acc[year].total += Number(order.total);
                    acc[year].count += 1;
                    return acc;
                  }, {} as Record<number, { total: number; count: number }>) || {};
                  
                  const years = Object.keys(yearlyData).sort((a, b) => Number(b) - Number(a));
                  const maxTotal = Math.max(...Object.values(yearlyData).map(y => y.total), 1);
                  
                  if (years.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No sales data available yet
                      </div>
                    );
                  }
                  
                  return years.map(year => {
                    const data = yearlyData[Number(year)];
                    const percentage = (data.total / maxTotal) * 100;
                    const isBestYear = data.total === maxTotal && years.length > 1;
                    const isSelectedYear = Number(year) === selectedYear;
                    
                    return (
                      <div key={year} className="space-y-2">
                        <div className="flex justify_between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{year}</span>
                            {isBestYear && (
                              <span className="px-2 py-0.5 text-xs rounded-full gradient-gold text-primary-foreground">
                                Best Year
                              </span>
                            )}
                            {isSelectedYear && !isBestYear && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold">₹{data.total.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground ml-2">({data.count} orders)</span>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isBestYear ? "gradient-gold" : isSelectedYear ? "bg-primary" : "bg-primary/60"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="orders" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold">Your Orders</h2>
                <Button variant="ghost" size="icon" onClick={() => refetchOrders()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Filter:</label>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value as any)}
                  className="px-2 py-1 border rounded-md bg-card text-sm"
                >
                  <option value="all">All</option>
                  <option value="this_month">This Month</option>
                  <option value="by_month">By Month</option>
                  <option value="week_1">Week 1 (1-7)</option>
                  <option value="week_2">Week 2 (8-14)</option>
                  <option value="week_3">Week 3 (15-21)</option>
                  <option value="week_4">Week 4 (22-31)</option>
                  <option value="last_7">Last 7 Days</option>
                  <option value="custom">Custom Range</option>
                </select>

                {orderFilter === "by_month" && (
                  <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-40" />
                )}

                {orderFilter === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                    <span className="text-sm">to</span>
                    <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                  </div>
                )}
              </div>
            </div>
            {ordersLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const items = orderItems[order.id] || [];
                  return (
                    <div key={order.id} className="p-4 bg-card rounded-xl border border-border/50">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm" style={{color: 'hsl(0deg 0% 0%)'}}>Order ID</p>
                          <p className="font-display text-xl font-bold" style={{color: 'hsl(0deg 0% 0%)'}}>{order.order_id}</p>
                          <div className="mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                              {order.payment_method === "online" ? "Online Payment" : "Cash on Delivery"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-display text-lg font-bold">₹{Number(order.total).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium mb-2" style={{color: 'hsl(0deg 0% 0%)'}}>Products Ordered:</p>
                        <div className="space-y-2">
                          {items.map((item) => {
                            const product = getProductById(item.product_id);
                            const imageUrl = product?.images?.[0] || product?.image_url;
                            return (
                              <div key={item.id} className="flex gap-2 items-start">
                                {imageUrl ? (
                                  <img src={imageUrl} alt={item.product_name || ""} className="w-12 h-12 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-base truncate">{item.product_name}</p>
                                  {item.variant_info && item.variant_info.attribute_name && (
                                    <p className="text-sm">
                                      {item.variant_info.attribute_name}: {item.variant_info.value_name}
                                    </p>
                                  )}
                                  {product?.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground">
                                    ₹{Number(item.product_price ?? product?.price ?? 0).toFixed(2)} × {item.quantity}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-3 mb-3">
                        <div>
                          <p className="text-sm" style={{color: 'hsl(0deg 0% 0%)'}}>Customer</p>
                          <p className="font-semibold text-base" style={{color: 'hsl(0deg 0% 0%)'}}>{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Address Details</p>
                          <div className="bg-muted/20 rounded-lg p-3 space-y-1">
                            <p className="text-sm" style={{color: 'hsl(0deg 0% 0%)'}}>{order.customer_address}</p>
                            {order.customer_state && (
                              <p className="text-sm" style={{color: 'hsl(0deg 0% 0%)'}}>
                                <span className="font-medium">State:</span> {order.customer_state}
                                {order.customer_pincode && ` | Pincode: ${order.customer_pincode}`}
                              </p>
                            )}
                            {(order.customer_landmark1 || order.customer_landmark2 || order.customer_landmark3) && (
                              <div className="text-sm" style={{color: 'hsl(0deg 0% 0%)'}}>
                                <p className="font-medium" style={{color: 'hsl(0deg 0% 0%)'}}>Landmarks:</p>
                                {order.customer_landmark1 && <p style={{color: 'hsl(0deg 0% 0%)'}}>• {order.customer_landmark1}</p>}
                                {order.customer_landmark2 && <p style={{color: 'hsl(0deg 0% 0%)'}}>• {order.customer_landmark2}</p>}
                                {order.customer_landmark3 && <p style={{color: 'hsl(0deg 0% 0%)'}}>• {order.customer_landmark3}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border/50">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Status</p>
                              <Select
                                value={order.status}
                                onValueChange={(value) => updateOrderMutation.mutate({ id: order.id, status: value })}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="packed">Packed</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Delivery Boy</p>
                              <Select
                                value={order.delivery_boy_id || ""}
                                onValueChange={(value) =>
                                  updateOrderDeliveryBoyMutation.mutate({ id: order.id, delivery_boy_id: value === "none" ? null : value })
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Unassigned</SelectItem>
                                  {deliveryBoys?.map((d: any) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.username || d.name || d.id}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Message
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Messages - {order.order_id}</DialogTitle>
                                  <DialogDescription>
                                    Send and receive messages related to order {order.order_id}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="h-60 overflow-y-auto space-y-3 bg-muted/30 rounded-lg p-4">
                                    {orderMessages[order.id] && orderMessages[order.id].length > 0 ? (
                                      orderMessages[order.id].map((msg) => (
                                        <div key={msg.id} className={cn("flex", (msg.is_admin || msg.is_delivery_boy) ? "justify-end" : "justify-start")}>
                                          <div className={cn(
                                            "max-w-[80%] px-4 py-2 rounded-2xl text-sm",
                                            (msg.is_admin || msg.is_delivery_boy)
                                              ? "bg-primary text-primary-foreground rounded-br-md"
                                              : "bg-muted rounded-bl-md"
                                          )}>
                                            <p>{msg.message}</p>
                                            <p className="text-xs opacity-70 mt-1">
                                              {new Date(msg.created_at).toLocaleString()}
                                            </p>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-center text-muted-foreground text-sm py-8">No messages yet</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Textarea
                                      value={newSellerMessage}
                                      onChange={(e) => setNewSellerMessage(e.target.value)}
                                      placeholder="Send update to customer..."
                                      className="min-h-[60px] resize-none"
                                    />
                                    <Button
                                      variant="royal"
                                      onClick={sendSellerMessage}
                                      disabled={sendingMessage || !newSellerMessage.trim()}
                                    >
                                      {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {(order.status === "delivered" || order.status === "cancelled") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteOrderMutation.mutate(order.id)}
                                disabled={deleteOrderMutation.isPending}
                                title="Delete order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No orders found for this seller.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="delivery-boys" className="space-y-6">
            <DeliveryBoysManager sellerId={sellerId || undefined} />
          </TabsContent>
          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Product Categories</h2>
                <p className="text-sm text-muted-foreground">Admin-created categories (read-only)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetchCategories && refetchCategories()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {(!categories || categories.length === 0) ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No categories available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="p-4 bg-card rounded-xl border border-border/50">
                    <div className="flex items-start gap-4">
                      {category.image_url && (
                        <img src={category.image_url} alt={category.name} className="w-20 h-20 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{category.name}</h3>
                            {category.description && <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>}
                            <p className="text-xs text-muted-foreground mt-1">Order: {category.sort_order} {category.is_active ? '✓' : '✗'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog open={valueDialogOpen && valueForm.parent_id === category.id && !editingValue} onOpenChange={(open) => { if (!open) { setValueDialogOpen(false); setValueForm({ name: "", description: "", parent_id: "" }); } }}>
                              <DialogTrigger asChild>
                                <Button variant="royal" size="sm" onClick={() => { setValueForm({ name: "", description: "", parent_id: category.id }); setEditingValue(null); setValueDialogOpen(true); }}>
                                  Add Value
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Add Value under {category.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                  <div>
                                    <Label>Name *</Label>
                                    <Input value={valueForm.name} onChange={(e) => setValueForm({ ...valueForm, name: e.target.value })} className="mt-1" />
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <Textarea value={valueForm.description} onChange={(e) => setValueForm({ ...valueForm, description: e.target.value })} className="mt-1" rows={3} />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="royal" onClick={() => addValueMutation.mutate({ name: valueForm.name, description: valueForm.description, parent_id: category.id })} disabled={!valueForm.name || addValueMutation.isPending}>
                                      {addValueMutation.isPending ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => { setValueDialogOpen(false); setValueForm({ name: "", description: "", parent_id: "" }); }}>Cancel</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        {/* Values list */}
                        <div className="mt-4">
                          <Label className="text-sm">Values</Label>
                          <div className="mt-2 space-y-2">
                            {(valuesByParent[category.id] || []).length === 0 ? (
                              <div className="text-sm text-muted-foreground">No values added by you</div>
                            ) : (
                              (valuesByParent[category.id] || []).map((val) => (
                                <div key={val.id} className="flex items-center justify-between gap-3 p-2 bg-background rounded">
                                  <div>
                                    <div className="text-sm font-medium">{val.name}</div>
                                    {val.description && <div className="text-xs text-muted-foreground">{val.description}</div>}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => { setEditingValue(val); setValueForm({ name: val.name, description: val.description || "", parent_id: val.parent_id || "" }); setValueDialogOpen(true); }}>
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteValueMutation.mutate(val.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Edit dialog for value */}
                    <Dialog open={valueDialogOpen && !!editingValue} onOpenChange={(open) => { if (!open) { setValueDialogOpen(false); setEditingValue(null); setValueForm({ name: "", description: "", parent_id: "" }); } }}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Value</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Name *</Label>
                            <Input value={valueForm.name} onChange={(e) => setValueForm({ ...valueForm, name: e.target.value })} className="mt-1" />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea value={valueForm.description} onChange={(e) => setValueForm({ ...valueForm, description: e.target.value })} className="mt-1" rows={3} />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="royal" onClick={() => editingValue && updateValueMutation.mutate({ id: editingValue.id, name: valueForm.name, description: valueForm.description })} disabled={!valueForm.name || updateValueMutation.isPending}>
                              {updateValueMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="ghost" onClick={() => { setValueDialogOpen(false); setEditingValue(null); setValueForm({ name: "", description: "", parent_id: "" }); }}>Cancel</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}