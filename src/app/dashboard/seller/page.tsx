import Link from "next/link";
import Image from "next/image";
import { Boxes, CircleDollarSign, PackageCheck, Plus, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getSellerProducts } from "@/lib/queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const user = await getCurrentUser();
  const products = user ? await getSellerProducts(user.id) : [];

  const inStock = products.filter((p) => p.stock > 0).length;
  const inventoryValue = products.reduce((sum, p) => sum + (p.discountPrice ?? p.price) * p.stock, 0);
  const featured = products.filter((p) => p.featured).length;

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
        <StatCard label="Products" value={products.length} icon={Boxes} />
        <StatCard label="In stock" value={inStock} icon={PackageCheck} />
        <StatCard label="Inventory value" value={formatCompactCurrency(inventoryValue)} icon={CircleDollarSign} />
        <StatCard label="Featured" value={featured} icon={Star} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My products</h2>
        </div>
        {products.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
            <Boxes className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No products yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first product to start selling.</p>
            <Button asChild variant="gradient" className="mt-5">
              <Link href="/dashboard/seller/products">
                <Plus className="h-4 w-4" /> Add product
              </Link>
            </Button>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
