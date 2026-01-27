import { useState, useEffect } from "react";
import { Plus, Trash2, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrderItem, Product } from "@/types";

interface ProductSelectorProps {
  items: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

export function ProductSelector({ items, onItemsChange }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state for adding product
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editProductId, setEditProductId] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
   // Load products from localStorage (matching the key used in Products.tsx)
   const stored = localStorage.getItem("wyrd-ledger-products");
    if (stored) {
      setProducts(JSON.parse(stored));
    }
 }, [dialogOpen]); // Reload when dialog opens

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleAddProduct = () => {
    if (!selectedProduct || !selectedSize || !selectedColor) return;

    const newItem: OrderItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      size: selectedSize,
      color: selectedColor,
      price: 0,
    };

    onItemsChange([...items, newItem]);
    
    // Reset form
    setSelectedProductId("");
    setSelectedSize("");
    setSelectedColor("");
    setDialogOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleOpenEdit = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setEditProductId(item.productId);
    setEditSize(item.size);
    setEditColor(item.color);
    setEditDialogOpen(true);
  };

  const editProduct = products.find(p => p.id === editProductId);

  const handleSaveEdit = () => {
    if (editingIndex === null || !editProductId || !editSize || !editColor) return;
    
    const product = products.find(p => p.id === editProductId);
    if (!product) return;

    const updatedItems = [...items];
    updatedItems[editingIndex] = {
      ...updatedItems[editingIndex],
      productId: editProductId,
      productName: product.name,
      size: editSize,
      color: editColor,
    };
    onItemsChange(updatedItems);
    setEditDialogOpen(false);
    setEditingIndex(null);
  };

  // Check if product variant already exists
  const isVariantAlreadyAdded = (productId: string, size: string, color: string, excludeIndex?: number) => {
    return items.some(
      (item, idx) => 
        (excludeIndex === undefined || idx !== excludeIndex) &&
        item.productId === productId && item.size === size && item.color === color
    );
  };

  const canAdd = selectedProduct && selectedSize && selectedColor && 
    !isVariantAlreadyAdded(selectedProductId, selectedSize, selectedColor);

  return (
    <div className="space-y-4">
      {/* Added Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            const stock = product?.stock ?? 0;
            return (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-3 bg-card transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.size} / {item.color}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stock === 0 ? "Out of Stock" : `${stock} in stock`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State / Add Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all">
              <Package className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="mb-4 text-muted-foreground">
                No products added yet
              </p>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Product
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product to Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No products available.</p>
                <p className="text-sm">Add products in the Products section first.</p>
              </div>
            ) : (
              <>
                {/* Product Selection */}
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={selectedProductId} onValueChange={(v) => {
                    setSelectedProductId(v);
                    setSelectedSize("");
                    setSelectedColor("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem 
                          key={product.id} 
                          value={product.id}
                          disabled={product.stock === 0}
                        >
                          {product.name} {product.stock === 0 ? "(Out of Stock)" : `(${product.stock} in stock)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size Selection */}
                {selectedProduct && (
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.sizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Color Selection */}
                {selectedProduct && (
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.colors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}


                {/* Duplicate Warning */}
                {selectedProductId && selectedSize && selectedColor && 
                  isVariantAlreadyAdded(selectedProductId, selectedSize, selectedColor) && (
                  <p className="text-sm text-destructive">
                    This variant is already added to the order.
                  </p>
                )}

                {/* Add Button */}
                <Button 
                  onClick={handleAddProduct} 
                  disabled={!canAdd}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Order
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={editProductId} onValueChange={(v) => {
                setEditProductId(v);
                setEditSize("");
                setEditColor("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem 
                      key={product.id} 
                      value={product.id}
                      disabled={product.stock === 0}
                    >
                      {product.name} {product.stock === 0 ? "(Out of Stock)" : `(${product.stock} in stock)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size Selection */}
            {editProduct && (
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={editSize} onValueChange={setEditSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {editProduct.sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color Selection */}
            {editProduct && (
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={editColor} onValueChange={setEditColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {editProduct.colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Duplicate Warning */}
            {editProductId && editSize && editColor && 
              isVariantAlreadyAdded(editProductId, editSize, editColor, editingIndex ?? undefined) && (
              <p className="text-sm text-destructive">
                This variant is already added to the order.
              </p>
            )}

            {/* Save Button */}
            <Button 
              onClick={handleSaveEdit} 
              disabled={!editProductId || !editSize || !editColor || isVariantAlreadyAdded(editProductId, editSize, editColor, editingIndex ?? undefined)}
              className="w-full"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
