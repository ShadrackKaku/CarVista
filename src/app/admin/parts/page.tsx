import Link from "next/link";
import Image from "next/image";
import { getParts } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPartsPage() {
  const parts = await getParts();
  return (
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {parts.map((p) => (
                <tr key={p.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-muted">
                        <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.store.name}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(p.discountPrice ?? p.price)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.stock > 0 ? "success" : "destructive"}>{p.stock}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/app/marketplace/parts/${p.slug}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
