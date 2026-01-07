import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

function formatPrice(value: number | string | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString('en-IN');
}

export default function DealGrid({ section }: { section: any }) {
  const content = typeof section.content === 'string' ? (() => { try { return JSON.parse(section.content); } catch { return {}; } })() : section.content || {};
  const layoutConfig = typeof section.layout_config === 'string' 
    ? (() => { try { return JSON.parse(section.layout_config); } catch { return { columns: 5, rows: 2 }; } })() 
    : (section.layout_config || { columns: 5, rows: 2 });
  
  const columns = layoutConfig.columns || 5;
  const rows = layoutConfig.rows || 2;
  const totalProducts = columns * rows;
  
  const ids: string[] = Array.isArray(content?.product_ids) ? content.product_ids : [];

  const { data: products, isLoading } = useQuery({
    queryKey: ['deal-grid', ids.join(',')],
    queryFn: async () => {
      if (ids.length === 0) return [];
      try {
        let resp;
        if (ids.length === 1) {
          resp = await supabase.from('products').select('*').eq('id', ids[0]).eq('is_active', true).limit(20);
        } else {
          resp = await supabase.from('products').select('*').in('id', ids).eq('is_active', true).limit(20);
        }
        const { data, error } = resp as any;
        if (error) {
          console.error('DealGrid: error fetching products', error);
          return [];
        }
        const map = new Map((data || []).map((d: any) => [d.id, d]));
        return ids.map(id => map.get(id)).filter(Boolean);
      } catch (err) {
        console.error('DealGrid: unexpected error', err);
        return [];
      }
    },
  });

  useEffect(() => {
    console.debug('DealGrid: products=', products);
  }, [products]);

  if (isLoading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-6">
        <h3 className="font-display text-xl font-semibold mb-4">{section?.title || 'Deals'}</h3>
        <div className="flex gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-32 flex-shrink-0 space-y-2">
              <Skeleton className="w-full h-32 rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold">{section?.title || 'Deals'}</h3>
        <button className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700">
          →
        </button>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {products.slice(0, totalProducts).map((p: any) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="bg-white rounded-lg overflow-hidden border border-border/50 shadow-sm"
          >
            <div className="w-full h-40 bg-muted flex items-center justify-center p-3">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-xs text-muted-foreground">No Image</div>
              )}
            </div>
            <div className="p-2">
              <div className="text-xs font-medium line-clamp-2 mb-1">{p.name}</div>
              <div className="text-xs text-muted-foreground">₹{formatPrice(p.price)}</div>
              <div className="text-xs text-green-600 font-semibold mt-1">
                {Number(p.discount_percentage || 0) > 0 ? `Min. ${p.discount_percentage}% Off` : 'Special offer'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
