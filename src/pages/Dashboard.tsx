import { useState, useEffect, useCallback } from "react";
import { Package, Users, Clock, Plus, TrendingUp, ArrowRight, LayoutDashboard, RefreshCw, AlertTriangle, XCircle, Plane, Truck, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSync } from "@/contexts/SyncContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product } from "@/types";

const LOW_STOCK_THRESHOLD = 5;

export default function Dashboard() {
  const { fetchData, isConnected } = useSync();
  const [stats, setStats] = useState({
    awaitingPayment: 0,
    inProduction: 0,
    inbound: 0,
    inTransit: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stockSortOrder, setStockSortOrder] = useState<'asc' | 'desc' | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Always read from localStorage first (source of truth after local writes)
      const localCustomers = localStorage.getItem("wyrd-ledger-customers");
      const localProducts = localStorage.getItem("wyrd-ledger-products");
      
      let customers: { status: string }[] = localCustomers ? JSON.parse(localCustomers) : [];
      let loadedProducts: Product[] = localProducts ? JSON.parse(localProducts) : [];
      
      // If connected and localStorage is empty, try cloud as fallback
      if (isConnected && (customers.length === 0 || loadedProducts.length === 0)) {
        if (customers.length === 0) {
          const cloudCustomers = await fetchData("customers");
          if (cloudCustomers) {
            customers = cloudCustomers as { status: string }[];
          }
        }
        if (loadedProducts.length === 0) {
          const cloudProducts = await fetchData("products");
          if (cloudProducts) {
            loadedProducts = cloudProducts as unknown as Product[];
          }
        }
      }
      
      setProducts(loadedProducts);
      
      setStats({
        awaitingPayment: customers.filter((c) => c.status === 'awaiting_payment').length,
        inProduction: customers.filter((c) => c.status === 'in_production').length,
        inbound: customers.filter((c) => c.status === 'inbound').length,
        inTransit: customers.filter((c) => c.status === 'in_transit').length,
        totalProducts: loadedProducts.length,
        totalCustomers: customers.length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, isConnected]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Refresh when the dashboard tab becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStats();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadStats]);

  const sortedProducts = [...products].sort((a, b) => {
    if (stockSortOrder === 'asc') return a.stock - b.stock;
    if (stockSortOrder === 'desc') return b.stock - a.stock;
    return 0;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-medium">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of your orders and inventory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadStats}
            disabled={isLoading}
            className="transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="/new-order">
            <Button className="transition-all duration-200 hover:scale-105">
              <Plus className="mr-2 h-5 w-5" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Order Status Cards - 4 columns */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="animate-slide-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: "0ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Payment
            </CardTitle>
            <Clock className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.awaitingPayment}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Orders pending payment
            </p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: "50ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Production
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inProduction}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Orders being prepared
            </p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: "75ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inbound
            </CardTitle>
            <Plane className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inbound}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Stock arrival from supplier
            </p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: "100ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out for Delivery
            </CardTitle>
            <Truck className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inTransit}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Orders sent for delivery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-slide-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: "150ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <Link
              to="/products"
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Manage products
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: "200ms" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <Link
              to="/customers"
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View customers
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Available Stocks Card */}
      <Card className="animate-slide-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: "250ms" }}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Available Stocks
          </CardTitle>
          <Package className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet</p>
          ) : (
            <ScrollArea className="h-72">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>
                      <button
                        onClick={() => setStockSortOrder(prev => 
                          prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
                        )}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Available Stocks
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Track Cargo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.map((product) => (
                    <TableRow 
                      key={product.id}
                      className="transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg hover:z-10 hover:bg-muted/50 cursor-default"
                    >
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {product.id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.stock === 0 && (
                            <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          )}
                          {product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD && (
                            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                          )}
                          <span className={`font-mono text-sm ${
                            product.stock === 0 
                              ? "text-destructive" 
                              : product.stock < LOW_STOCK_THRESHOLD 
                                ? "text-warning" 
                                : "text-muted-foreground"
                          }`}>
                            {product.stock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.cargoTrackingLink ? (
                          <a 
                            href={product.cargoTrackingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Track Cargo
                          </a>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
          <Link
            to="/products"
            className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage products
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

    </div>
  );
}
