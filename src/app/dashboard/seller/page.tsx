import Link from "next/link";
import Image from "next/image";
import { Boxes, DollarSign, Plus, ShoppingCart, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_PARTS } from "@/lib/sample-data";
import { formatCurrency } from "@/lib/utils";

export default function SellerDashboardPage() {
  const products = SAMPLE_PARTS.slice(0, 5);
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Seller Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your store, products and orders.</p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/dashboard/seller/products">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products" value={124} icon={Boxes} />
        <StatCard label="Orders" value={58} icon={ShoppingCart} trend="+9 this week" />
        <StatCard label="Revenue" value={formatCurrency(84500)} icon={DollarSign} trend="+40% MoM" />
        <StatCard label="Conversion" value="4.2%" icon={TrendingUp} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top products</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/seller/products">Manage all</Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-muted">
                          <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" />
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.discountPrice ?? p.price)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.stock}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.stock > 0 ? "success" : "destructive"}>
                        {p.stock > 0 ? "In stock" : "Out"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
