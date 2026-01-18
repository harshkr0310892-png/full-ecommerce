import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  // `id` is the cart line id (product id or productId#variantId)
  id: string;
  // `product_id` is the original product id
  product_id?: string;
  name: string;
  price: number;
  discount_percentage: number;
  image_url: string | null;
  cash_on_delivery?: boolean;
  stock_quantity?: number | null;
  quantity: number;
  variant_info?: {
    variant_id: string;
    attribute_name: string;
    attribute_value: string;
  } | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateItem: (id: string, patch: Partial<Omit<CartItem, 'id' | 'quantity'>>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getDiscountedTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          const productId = item.product_id || item.id;
          const variantId = item.variant_info?.variant_id || null;
          const lineId = variantId ? `${productId}#${variantId}` : productId;

          const existingItem = state.items.find((i) => i.id === lineId);
          if (existingItem) {
            const nextStock = item.stock_quantity ?? existingItem.stock_quantity ?? null;
            if (nextStock !== null && nextStock <= 0) return state;
            const nextQty = nextStock === null ? existingItem.quantity + 1 : Math.min(existingItem.quantity + 1, nextStock);
            return {
              items: state.items.map((i) =>
                i.id === lineId ? { ...i, ...item, id: lineId, product_id: productId, stock_quantity: nextStock, quantity: nextQty } : i
              ),
            };
          }

          const initialStock = item.stock_quantity ?? null;
          if (initialStock !== null && initialStock <= 0) return state;
          const newItem: CartItem = {
            ...item,
            id: lineId,
            product_id: productId,
            stock_quantity: initialStock,
            quantity: 1,
          } as CartItem;

          return { items: [...state.items, newItem] };
        });
      },

      updateItem: (id, patch) => {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;
          const max = item.stock_quantity ?? null;
          const nextQty = max === null ? quantity : Math.min(quantity, max);
          if (nextQty < 1) {
            return { items: state.items.filter((x) => x.id !== id) };
          }
          return {
            items: state.items.map((x) => (x.id === id ? { ...x, quantity: nextQty } : x)),
          };
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      
      getDiscountedTotal: () => {
        return get().items.reduce((total, item) => {
          const discountedPrice = item.price * (1 - item.discount_percentage / 100);
          return total + discountedPrice * item.quantity;
        }, 0);
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'royal-cart-storage',
    }
  )
);
