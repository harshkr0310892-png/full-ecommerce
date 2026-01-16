import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Crown, Loader2, User, Phone, MapPin, Package, 
  Clock, CheckCircle, Truck, XCircle, LogOut, Camera,
  Edit2, Save, X, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
}

interface Order {
  id: string;
  order_id: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  return_status?: string | null;
  return_reason?: string | null;
  return_request_date?: string | null;
  return_processed_date?: string | null;
  return_refund_amount?: number | null;
  items?: { product_name: string; quantity: number; product_price: number; product_image?: string }[];
  messages?: {
    id: string;
    message: string;
    created_at: string;
    is_admin: boolean;
  }[];
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: "text-yellow-500", label: "Pending" },
  confirmed: { icon: <CheckCircle className="w-4 h-4" />, color: "text-blue-500", label: "Confirmed" },
  processing: { icon: <Package className="w-4 h-4" />, color: "text-purple-500", label: "Processing" },
  shipped: { icon: <Truck className="w-4 h-4" />, color: "text-indigo-500", label: "Shipped" },
  delivered: { icon: <CheckCircle className="w-4 h-4" />, color: "text-green-500", label: "Delivered" },
  cancelled: { icon: <XCircle className="w-4 h-4" />, color: "text-red-500", label: "Cancelled" },
};

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiAvatarOpen, setAiAvatarOpen] = useState(false);
  const [aiAvatarPrompt, setAiAvatarPrompt] = useState("");
  const [aiAvatarLoading, setAiAvatarLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<any[]>([]); // Type should match your returns table
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUserEmail(session.user.email || '');
    await Promise.all([
      loadProfile(session.user.id),
      loadOrders(session.user.id, session.user.email || ''),
      loadReturns(session.user.id),
    ]);
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
      setEditForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address: data.address || '',
      });
    } else {
      // If no profile exists, create one
      console.log('No profile found, creating new profile');
      try {
        const { data: newProfile, error: insertError } = await supabase
          .from('customer_profiles')
          .insert({
            user_id: userId,
            full_name: null,
            phone: null,
            address: null,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        if (newProfile) {
          setProfile(newProfile);
          setEditForm({
            full_name: newProfile.full_name || '',
            phone: newProfile.phone || '',
            address: newProfile.address || '',
          });
        }
      } catch (error) {
        console.error('Error creating profile:', error);
      }
    }
  };

  const loadOrders = async (userId: string, email: string) => {
    // Load orders linked by user_id or email
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`user_id.eq.${userId},customer_email.eq.${email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
      return;
    }

    // Load order items, messages, and other details for each order
    const ordersWithDetails = await Promise.all(
      (data || []).map(async (order) => {
        // Load order items
        const { data: items } = await supabase
          .from('order_items')
          .select('product_name, quantity, product_price, product_id')
          .eq('order_id', order.id);
        
        // Get product images for each item
        const itemsWithImages = await Promise.all(
          (items || []).map(async (item) => {
            // Fetch product details to get image
            const { data: product } = await supabase
              .from('products')
              .select('image_url')
              .eq('id', item.product_id)
              .single();
            
            return {
              ...item,
              product_image: product?.image_url
            };
          })
        );
        
        // Load order messages
        const { data: messages } = await supabase
          .from('order_messages')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true });
        
        return { 
          ...order, 
          items: itemsWithImages,
          messages: messages || []
        };
      })
    );

    setOrders(ordersWithDetails);
  };

  const loadReturns = async (userId: string) => {
    try {
      // First get the order IDs for this user
      const { data: userOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId);

      if (ordersError) throw ordersError;

      const orderIds = userOrders.map(order => order.id);
      
      if (orderIds.length === 0) {
        setReturns([]);
        return;
      }
      
      // Load returns for these orders
      const { data: returnsData, error } = await supabase
        .from('returns')
        .select('*')
        .in('order_id', orderIds)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      setReturns(returnsData || []);
    } catch (error) {
      console.error('Error loading returns:', error);
      // Still initialize with empty array even if there's an error
      setReturns([]);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          address: editForm.address,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleAvatarUpload called');
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('You must be logged in to upload a photo');
      navigate('/auth');
      return;
    }
    
    if (!e.target.files || !e.target.files[0]) {
      console.log('No file selected', {
        hasFile: !!(e.target.files && e.target.files[0]),
        hasProfile: !!profile
      });
      toast.error('Please select an image file');
      return;
    }
    
    if (!profile) {
      console.log('Profile not loaded yet', {
        hasFile: !!(e.target.files && e.target.files[0]),
        hasProfile: !!profile
      });
      toast.error('Profile not loaded. Please wait and try again.');
      return;
    }

    const file = e.target.files[0];
    console.log('File selected:', file.name, file.size, file.type);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      console.log('Invalid file type:', file.type);
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      console.log('File too large:', file.size);
      return;
    }
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
      toast.error('Only JPG, PNG, GIF, and WebP files are allowed');
      console.log('Invalid file extension:', fileExt);
      return;
    }
    
    const fileName = `${profile.user_id}.${fileExt}`;
    console.log('Generated file name:', fileName);

    setUploading(true);
    try {
      // First, delete existing file if it exists (to replace with new one)
      try {
        console.log('Attempting to remove existing file:', fileName);
        await supabase.storage
          .from('customer-avatars')
          .remove([fileName]);
        console.log('Successfully removed existing file');
      } catch (removeError) {
        console.log('No existing file to remove or remove failed:', removeError);
        // Continue with upload even if remove fails
      }
      
      // Upload to storage
      console.log('Attempting to upload file:', fileName);
      const { data, error: uploadError } = await supabase.storage
        .from('customer-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('customer-avatars')
        .getPublicUrl(fileName, { transform: null });
      
      console.log('Public URL data:', urlData);
      
      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      // Update profile
      console.log('Updating profile with avatar URL:', urlData.publicUrl);
      const { error: updateError } = await supabase
        .from('customer_profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: urlData.publicUrl });
      toast.success('Profile photo updated!');
      console.log('Profile updated successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('customer_user_id');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleGenerateAiAvatar = async () => {
    if (aiAvatarLoading) return;

    const prompt = aiAvatarPrompt.trim();
    if (prompt.length < 3) {
      toast.error('Please describe your avatar (at least 3 characters)');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('You must be logged in to generate an avatar');
      navigate('/auth');
      return;
    }

    if (!profile) {
      toast.error('Profile not loaded. Please wait and try again.');
      return;
    }

    setAiAvatarLoading(true);
    try {
      const resp = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed to generate avatar');
      }

      const svg = data?.svg;
      if (typeof svg !== 'string' || svg.trim().length < 10) {
        throw new Error('Invalid avatar received');
      }

      const fileName = `${profile.user_id}.svg`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });

      const { error: uploadError } = await supabase.storage
        .from('customer-avatars')
        .upload(fileName, blob, {
          upsert: true,
          contentType: 'image/svg+xml',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('customer-avatars')
        .getPublicUrl(fileName, { transform: null });

      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate avatar URL');
      }

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('customer_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('AI avatar updated!');
      setAiAvatarOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to generate avatar');
    } finally {
      setAiAvatarLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-card rounded-xl border border-border/50 p-6 mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-primary/20">
                  {profile?.avatar_url ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load, hide the img and show the fallback User icon
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'block';
                          }
                        }}
                      />
                      <User 
                        className="w-10 h-10 text-muted-foreground absolute inset-0 m-auto avatar-fallback" 
                        style={{display: 'none'}} 
                      />
                    </div>
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold mb-1">
                  {profile?.full_name || 'Customer'}
                </h1>
                <p className="text-muted-foreground">{userEmail}</p>
                {profile?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4" /> {profile.phone}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="royalOutline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                    <Button
                      variant="royal"
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="royalOutline"
                      size="sm"
                      onClick={() => setAiAvatarOpen(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-1" /> AI Avatar
                    </Button>
                    <Button
                      variant="royalOutline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-1" /> Logout
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-border grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit_name">Full Name</Label>
                  <Input
                    id="edit_name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone">Phone Number</Label>
                  <Input
                    id="edit_phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="edit_address">Address</Label>
                  <Textarea
                    id="edit_address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Enter your address"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <Dialog open={aiAvatarOpen} onOpenChange={setAiAvatarOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate AI Avatar</DialogTitle>
                  <DialogDescription>
                    Describe the avatar you want (example: “classic royal gentleman with short hair, blue background”).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label htmlFor="ai_avatar_prompt">Avatar description</Label>
                  <Textarea
                    id="ai_avatar_prompt"
                    value={aiAvatarPrompt}
                    onChange={(e) => setAiAvatarPrompt(e.target.value)}
                    placeholder="Describe your avatar..."
                    rows={4}
                    disabled={aiAvatarLoading}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setAiAvatarOpen(false)}
                    disabled={aiAvatarLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="royal"
                    onClick={handleGenerateAiAvatar}
                    disabled={aiAvatarLoading || aiAvatarPrompt.trim().length < 3}
                  >
                    {aiAvatarLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating
                      </>
                    ) : (
                      'Generate'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Order History */}
          <div className="animate-fade-in stagger-2">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Order History
            </h2>

            {orders.length === 0 ? (
              <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't placed any orders yet. Start shopping!
                </p>
                <Button variant="royal" onClick={() => navigate('/products')}>
                  <Crown className="w-4 h-4 mr-2" /> Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const isExpanded = expandedOrders[order.id] || false;
                  
                  const toggleOrder = (orderId: string) => {
                    setExpandedOrders(prev => ({
                      ...prev,
                      [orderId]: !prev[orderId]
                    }));
                  };
                  
                  return (
                    <div
                      key={order.id}
                      className="bg-card rounded-lg border border-border/60 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Collapsed View */}
                      <div className="p-4 md:p-6" onClick={() => toggleOrder(order.id)}>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-display font-semibold text-primary">
                                  {order.order_id}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border border-border bg-muted/40",
                                    status.color
                                  )}
                                >
                                  {status.icon}
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>

                            <div className="flex flex-col md:items-end gap-2">
                              <div className="text-lg font-bold tabular-nums">
                                ₹{Number(order.total).toFixed(2)}
                              </div>

                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="royalOutline"
                                  size="sm"
                                  onClick={() => navigate(`/track-order?id=${order.order_id}`)}
                                >
                                  Track
                                </Button>

                                {/* Return button for delivered orders */}
                                {order.status === 'delivered' && !order.return_status && (
                                  <ReturnOrderButton 
                                    order={order} 
                                    profile={profile} 
                                    onReturnRequest={() => {
                                      const userId = profile?.user_id || '';
                                      loadOrders(userId, userEmail);
                                      loadReturns(userId);
                                    }} 
                                  />
                                )}

                                {order.return_status && (
                                  <span className={cn(
                                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                                    order.return_status === 'requested' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                    order.return_status === 'approved' ? 'border-green-200 bg-green-50 text-green-700' :
                                    order.return_status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' :
                                    order.return_status === 'refunded' ? 'border-green-200 bg-green-50 text-green-700' :
                                    'border-gray-200 bg-gray-50 text-gray-700'
                                  )}>
                                    Return: {order.return_status.charAt(0).toUpperCase() + order.return_status.slice(1)}
                                  </span>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => toggleOrder(order.id)}
                                >
                                  {isExpanded ? 'Hide' : 'Details'}
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Order Summary - Always visible */}
                          <div className="rounded-md border border-border/50 bg-muted/10">
                            <div className="px-4 py-2 border-b border-border/50 text-xs font-medium text-muted-foreground">
                              Items
                            </div>
                            <div className="p-4 space-y-3">
                              {order.items && order.items.length > 0 ? (
                                <>
                                  {order.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                      {item.product_image && (
                                        <img
                                          src={item.product_image}
                                          alt={item.product_name}
                                          className="w-10 h-10 object-cover rounded-md border border-border/50"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.parentElement?.querySelector('.image-fallback');
                                            if (fallback) {
                                              (fallback as HTMLElement).style.display = 'block';
                                            }
                                          }}
                                        />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                                        <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                                      </div>
                                      <div className="text-right text-sm tabular-nums">
                                        ₹{Number(item.product_price).toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{order.items.length - 2} more item{order.items.length - 2 === 1 ? '' : 's'}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">No items found for this order.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded View */}
                      {isExpanded && (
                        <div className="p-4 md:p-6 pt-0 md:pt-0 border-t border-border/50 mt-4 md:mt-0">
                          {/* Order Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Delivery Address */}
                            <div className="border border-border/50 rounded-lg p-4">
                              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Delivery Address</h4>
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-muted-foreground">{order.customer_phone}</p>
                              <p className="mt-1">{order.customer_address}</p>
                              {order.customer_address?.includes('Landmarks:') && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground">Landmarks:</p>
                                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {order.customer_address
                                      .split('Landmarks:')[1]
                                      ?.split('•')
                                      .filter(item => item.trim())
                                      .map((item, idx) => (
                                        <li key={idx}>{item.trim()}</li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            {/* Order Summary with Total */}
                            <div className="border border-border/50 rounded-lg p-4">
                              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Order Summary</h4>
                              <div className="space-y-3">
                                {order.items && order.items.length > 0 && order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    {item.product_image && (
                                      <img 
                                        src={item.product_image} 
                                        alt={item.product_name}
                                        className="w-12 h-12 object-cover rounded-lg border border-border/50"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const fallback = target.parentElement?.querySelector('.image-fallback');
                                          if (fallback) {
                                            (fallback as HTMLElement).style.display = 'block';
                                          }
                                        }}
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium">{item.product_name}</p>
                                      <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                      <p>₹{Number(item.product_price).toFixed(2)}</p>
                                      <p className="text-muted-foreground text-sm">₹{Number(item.product_price).toFixed(2)} each</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-border/50 mt-3 pt-3 font-semibold">
                                Total: ₹{Number(order.total).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Messages from Store */}
                          {order.messages && order.messages.length > 0 && (
                            <div className="border-t border-border/50 pt-4">
                              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Messages from Store</h4>
                              <div className="space-y-2">
                                {order.messages.map((message, idx) => (
                                  <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-sm text-black">{message.message}</p>
                                    <p className="text-xs text-black mt-1">
                                      {new Date(message.created_at).toLocaleString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Return History */}
          <div className="animate-fade-in stagger-2 mt-12">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Return History
            </h2>

            {returns.length === 0 ? (
              <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">No Returns Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't initiated any returns yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map((ret) => (
                  <div
                    key={ret.id}
                    className="bg-card rounded-lg border border-border/60 shadow-sm p-4 md:p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-semibold text-primary">
                            Return for Order: {ret.order_id}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                              ret.return_status === 'requested' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                              ret.return_status === 'approved' ? 'border-green-200 bg-green-50 text-green-700' :
                              ret.return_status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' :
                              ret.return_status === 'refunded' ? 'border-green-200 bg-green-50 text-green-700' :
                              'border-gray-200 bg-gray-50 text-gray-700'
                            )}
                          >
                            {ret.return_status.charAt(0).toUpperCase() + ret.return_status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(ret.requested_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Reason:</span> {ret.return_reason}
                        </p>
                        {ret.refund_amount && (
                          <p className="text-sm">
                            <span className="font-medium">Refund Amount:</span> ₹{Number(ret.refund_amount).toFixed(2)}
                          </p>
                        )}
                        {ret.images && ret.images.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Return Images:</p>
                            <div className="flex flex-wrap gap-2">
                              {ret.images.slice(0, 4).map((image, idx) => (
                                <a 
                                  key={idx}
                                  href={image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img 
                                    src={image}
                                    alt={`Return image ${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded border"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.parentElement?.querySelector('.image-fallback');
                                      if (fallback) {
                                        (fallback as HTMLElement).style.display = 'block';
                                      }
                                    }}
                                  />
                                  <div className="image-fallback hidden absolute inset-0 bg-gray-200 flex items-center justify-center rounded">
                                    <span className="text-xs text-gray-500">Img {idx + 1}</span>
                                  </div>
                                </a>
                              ))}
                              {ret.images.length > 4 && (
                                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded border text-xs text-gray-500">
                                  +{ret.images.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const ReturnOrderButton = ({ order, profile, onReturnRequest }: { order: Order, profile: CustomerProfile | null, onReturnRequest: () => void }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newImages = [...images, ...files];
    
    if (newImages.length > 6) {
      setImageError('Maximum 6 images allowed');
      return;
    }
    
    if (newImages.length < 2) {
      setImageError('Minimum 2 images required');
    } else {
      setImageError('');
    }
    
    setImages(newImages);
    
    // Create previews for the new images
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };
  
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
    
    if (newImages.length < 2) {
      setImageError('Minimum 2 images required');
    } else {
      setImageError('');
    }
  };
  
  const handleRequestReturn = async () => {
    if (!profile?.full_name || !profile.phone || !profile.address) {
      setShowProfileAlert(true);
      return;
    }
    
    // Validate image count
    if (images.length < 2 || images.length > 6) {
      setImageError('Please upload between 2 and 6 images');
      return;
    }

    // Check if order is older than 7 days
    const orderDate = new Date(order.created_at);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      alert("Cannot return order. Order is older than 7 days.");
      return;
    }
    
    setLoading(true);
    try {
      // Upload images to storage
      const imageUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileName = `${order.id}-return-${Date.now()}-${i}-${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('return-images')
          .upload(fileName, file, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('return-images')
          .getPublicUrl(fileName);
          
        if (urlData?.publicUrl) {
          imageUrls.push(urlData.publicUrl);
        }
      }
      
      // Determine the actual return reason - if 'Other', use the custom reason
      const actualReason = reason === 'Other' ? otherReason : reason;
      
      const { error } = await supabase
        .from('returns')
        .insert({
          order_id: order.id,
          customer_name: profile.full_name,
          customer_phone: profile.phone,
          customer_address: profile.address,
          return_reason: actualReason,
          return_status: 'requested',
          images: imageUrls
        });

      if (error) throw error;

      // Update the order's return status
      await supabase
        .from('orders')
        .update({
          return_status: 'requested',
          return_reason: reason,
          return_request_date: new Date().toISOString()
        })
        .eq('id', order.id);

      toast.success('Return request submitted successfully!');
      setOpen(false);
      setReason("");
      onReturnRequest(); // Refresh orders
    } catch (error: any) {
      console.error('Error requesting return:', error);
      toast.error('Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Request Return
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              Submit a return request for order {order.order_id}
            </DialogDescription>
          </DialogHeader>
          
          {showProfileAlert && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                Please fill your profile details (name, phone, address) before requesting a return.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="return-reason">Return Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wrong Size">Wrong Size</SelectItem>
                  <SelectItem value="Damaged Product">Damaged Product</SelectItem>
                  <SelectItem value="Not As Described">Not As Described</SelectItem>
                  <SelectItem value="Changed Mind">Changed Mind</SelectItem>
                  <SelectItem value="Quality Issues">Quality Issues</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reason === 'Other' && (
              <div>
                <Label htmlFor="custom-reason">Please specify</Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Enter your reason here..."
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                />
              </div>
            )}
            
            {/* Image Upload Section */}
            <div>
              <Label>Upload Images (minimum 2, maximum 6)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors hover:border-primary/50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id={`return-image-upload-${order.id}`}
                />
                <label 
                  htmlFor={`return-image-upload-${order.id}`} 
                  className="cursor-pointer inline-block"
                >
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm text-muted-foreground">
                      Click to upload images or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </label>
              </div>
              
              {imageError && (
                <p className="text-sm text-destructive mt-1">{imageError}</p>
              )}
              
              {/* Preview images */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-20 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                {images.length}/6 images uploaded
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestReturn} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
