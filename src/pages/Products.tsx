import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Package, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSync } from "@/contexts/SyncContext";
import { Product } from "@/types";

// Local storage key for products
const PRODUCTS_STORAGE_KEY = "wyrd-ledger-products";

// Load products from localStorage
const loadProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save products to localStorage
const saveProductsToLocal = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};

export default function Products() {
  const { toast } = useToast();
  const { saveData, status } = useSync();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formId, setFormId] = useState("");
  const [formColors, setFormColors] = useState("");
  const [formSizes, setFormSizes] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCargoCarrier, setFormCargoCarrier] = useState("");
  const [formCargoLink, setFormCargoLink] = useState("");

  // Save to localStorage and sync to cloud whenever products change
  useEffect(() => {
    saveProductsToLocal(products);
    // Auto-sync to cloud
    if (products.length > 0) {
      saveData("products", products as unknown as Record<string, unknown>[]).catch(console.error);
    }
  }, [products, saveData]);

  const [sortBy, setSortBy] = useState<"name" | "stock-asc" | "stock-desc">("name");

  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.id.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "stock-asc":
          return a.stock - b.stock;
        case "stock-desc":
          return b.stock - a.stock;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormName("");
    setFormId("");
    setFormColors("");
    setFormSizes("");
    setFormStock("");
    setFormCargoCarrier("");
    setFormCargoLink("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormId(product.id);
    setFormColors(product.colors.join(", "));
    setFormSizes(product.sizes.join(", "));
    setFormStock(product.stock.toString());
    setFormCargoCarrier(product.cargoCarrier || "");
    setFormCargoLink(product.cargoTrackingLink || "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formId.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Product name and ID are required",
      });
      return;
    }

    // Check for duplicate ID (only for new products or changed IDs)
    const isDuplicate = products.some(
      (p) => p.id === formId && (!editingProduct || editingProduct.id !== formId)
    );
    
    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Duplicate ID",
        description: "A product with this ID already exists",
      });
      return;
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      id: formId,
      name: formName,
      colors: formColors.split(",").map((c) => c.trim()).filter(Boolean),
      sizes: formSizes.split(",").map((s) => s.trim()).filter(Boolean),
      stock: parseInt(formStock) || 0,
      cargoCarrier: formCargoCarrier.trim() || undefined,
      cargoTrackingLink: formCargoLink.trim() || undefined,
      createdAt: editingProduct?.createdAt || now,
      updatedAt: now,
    };

    if (editingProduct) {
      setProducts(products.map((p) => (p.id === editingProduct.id ? newProduct : p)));
    } else {
      setProducts([...products, newProduct]);
    }

    toast({
      title: editingProduct ? "Product updated" : "Product added",
      description: `${formName} has been saved`,
    });
    setIsDialogOpen(false);
  };

  const handleDelete = (product: Product) => {
    setProducts(products.filter((p) => p.id !== product.id));
    toast({
      title: "Product deleted",
      description: `${product.name} has been removed`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-medium">Products</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your inventory
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="transition-all duration-200 hover:scale-105">
          <Plus className="mr-2 h-5 w-5" />
          Add Product
        </Button>
      </div>

      {/* Search and Sort */}
      <div className="flex gap-4 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-48">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="stock-asc">Stock: Low to High</SelectItem>
            <SelectItem value="stock-desc">Stock: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredProducts.length > 0 ? (
        <Card className="hover:scale-100 hover:shadow-sm hover:translate-y-0 hover:border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Colors</TableHead>
                  <TableHead>Sizes</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="bg-black text-white hover:bg-white/10 transition-colors">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.colors.map((color) => (
                          <Badge key={color} variant="outline" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.map((size) => (
                          <Badge key={size} variant="secondary" className="text-xs">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.stock === 0 ? (
                        <Badge className="status-pill status-out-of-stock">
                          Out of Stock
                        </Badge>
                      ) : (
                        <span className="font-medium">{product.stock}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(product)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed animate-scale-in">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No products found</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Add your first product to get started
            </p>
            <Button onClick={openAddDialog} className="transition-all duration-200 hover:scale-105">
              <Plus className="mr-2 h-5 w-5" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? "Update product details and inventory" 
                : "Add a new product to your inventory"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ethereal Hoodie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="WW-001"
                disabled={!!editingProduct}
                className={editingProduct ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
              />
              {editingProduct && (
                <p className="text-xs text-muted-foreground">
                  Product ID cannot be changed after creation
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="colors">Colors (comma-separated)</Label>
              <Input
                id="colors"
                value={formColors}
                onChange={(e) => setFormColors(e.target.value)}
                placeholder="Black, White, Grey"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sizes">Sizes (comma-separated)</Label>
              <Input
                id="sizes"
                value={formSizes}
                onChange={(e) => setFormSizes(e.target.value)}
                placeholder="S, M, L, XL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
              />
            </div>

            {/* Cargo Tracking Section */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-muted-foreground text-sm">Cargo Tracking (Optional)</Label>
              <div className="grid gap-4 md:grid-cols-2 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="cargoCarrier">Carrier</Label>
                  <Input
                    id="cargoCarrier"
                    value={formCargoCarrier}
                    onChange={(e) => setFormCargoCarrier(e.target.value)}
                    placeholder="e.g., Maersk, DHL Freight"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargoLink">Tracking Link</Label>
                  <Input
                    id="cargoLink"
                    value={formCargoLink}
                    onChange={(e) => setFormCargoLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingProduct ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
