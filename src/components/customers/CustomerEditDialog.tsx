import { useState, useEffect, useRef } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { OrderStatus, BankAccount, Currency } from "@/types";

interface CustomerOrder {
  id: string;
  name: string;
  email: string;
  contact?: string;
  address?: string;
  notes?: string;
  productId: string;
  productName?: string;
  size: string;
  color: string;
  status: OrderStatus;
  price?: number;
  shipping?: number;
  currency?: Currency;
  paymentLabel?: string;
  paymentUrl?: string;
  bankAccountId?: string;
}

interface CustomerEditDialogProps {
  customer: CustomerOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: CustomerOrder) => void;
  products?: Array<{ id: string; name: string; colors: string[]; sizes: string[] }>;
}

const statusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "in_production", label: "In Production" },
  { value: "inbound", label: "Inbound" },
  { value: "in_transit", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const BANK_ACCOUNTS_KEY = "wyrd-ledger-bank-accounts";

export function CustomerEditDialog({
  customer,
  open,
  onOpenChange,
  onSave,
  products = [],
}: CustomerEditDialogProps) {
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [productId, setProductId] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState<OrderStatus>("awaiting_payment");
  
  // Payment state
  const [price, setPrice] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [currency, setCurrency] = useState<Currency>("LKR");
  const [paymentLabel, setPaymentLabel] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Load bank accounts
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BANK_ACCOUNTS_KEY);
      if (stored) {
        setBankAccounts(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Track previous currency for comparison
  const prevCurrencyRef = useRef<Currency>(currency);
  const isInitialLoadRef = useRef(true);

  // Initialize form when customer changes
  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setContact(customer.contact || "");
      setAddress(customer.address || "");
      setNotes(customer.notes || "");
      setProductId(customer.productId);
      setSize(customer.size);
      setColor(customer.color);
      setStatus(customer.status);
      setPrice(customer.price || 0);
      setShipping(customer.shipping || 0);
      setCurrency(customer.currency || "LKR");
      setPaymentLabel(customer.paymentLabel || "");
      setPaymentUrl(customer.paymentUrl || "");
      setSelectedBankId(customer.bankAccountId || "");
      // Reset refs on customer load
      prevCurrencyRef.current = customer.currency || "LKR";
      isInitialLoadRef.current = true;
    }
  }, [customer]);

  // Watch currency changes and reset appropriate fields
  useEffect(() => {
    // Skip on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    const prevCurrency = prevCurrencyRef.current;

    if (currency === "LKR" && prevCurrency !== "LKR") {
      // Switched TO LKR - clear international fields, set bank
      setPaymentLabel("");
      setPaymentUrl("");
      if (bankAccounts.length > 0) {
        const defaultBank = bankAccounts.find(b => b.isDefault);
        setSelectedBankId(defaultBank?.id || bankAccounts[0].id);
      }
    } else if (currency !== "LKR" && prevCurrency === "LKR") {
      // Switched FROM LKR - clear bank
      setSelectedBankId("");
    } else if (currency !== "LKR" && prevCurrency !== "LKR" && currency !== prevCurrency) {
      // Switched between USD and GBP - clear payment link
      setPaymentLabel("");
      setPaymentUrl("");
    }

    prevCurrencyRef.current = currency;
  }, [currency, bankAccounts]);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSave = () => {
    if (!customer) return;

    const updatedCustomer: CustomerOrder = {
      ...customer,
      name,
      email,
      contact,
      address,
      notes,
      productId,
      size,
      color,
      status,
      price,
      shipping,
      currency,
      paymentLabel: currency !== "LKR" ? paymentLabel : undefined,
      paymentUrl: currency !== "LKR" ? paymentUrl : undefined,
      bankAccountId: currency === "LKR" ? selectedBankId : undefined,
    };

    onSave(updatedCustomer);
    toast({
      title: "Customer updated",
      description: `${name}'s order has been updated`,
    });
    onOpenChange(false);
  };

  const isValid = name.trim() && email.trim() && productId && size && color;

  const getCurrencySymbol = () => {
    switch (currency) {
      case "LKR": return "LKR ";
      case "USD": return "$";
      case "GBP": return "£";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Customer Order
          </DialogTitle>
          <DialogDescription>
            Update customer details and order information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Details Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Customer Details</h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact">Contact Number</Label>
              <Input
                id="edit-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+94 77 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Delivery Address</Label>
              <Textarea
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street, Colombo 07"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>
          </div>

          {/* Order Details Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Order Details</h4>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product">Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-size">Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedProduct?.sizes || ["S", "M", "L", "XL", "XXL"]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedProduct?.colors || ["Black", "White", "Grey"]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Order Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Section - Only for Awaiting Payment */}
          {status === "awaiting_payment" && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground">Payment Details</h4>
              
              {/* Currency Pills */}
              <div className="space-y-2">
                <Label>Currency</Label>
                <div className="flex gap-2">
                  {(["LKR", "USD", "GBP"] as Currency[]).map((curr) => (
                    <Button
                      key={curr}
                      type="button"
                      variant={currency === curr ? "default" : "outline"}
                      onClick={() => setCurrency(curr)}
                      size="sm"
                      className="flex-1"
                    >
                      {curr}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Price & Shipping */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price ({getCurrencySymbol()})</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-shipping">Shipping ({getCurrencySymbol()})</Label>
                  <Input
                    id="edit-shipping"
                    type="number"
                    min={0}
                    value={shipping}
                    onChange={(e) => setShipping(Number(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Bank Selection for LKR */}
              {currency === "LKR" && bankAccounts.length > 0 && (
                <div className="space-y-2">
                  <Label>Bank Account</Label>
                  <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.nickname} - {bank.bank}
                          {bank.isDefault && " ★"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Payment URL for USD/GBP */}
              {currency !== "LKR" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-paymentLabel">Payment Label</Label>
                    <Input
                      id="edit-paymentLabel"
                      value={paymentLabel}
                      onChange={(e) => setPaymentLabel(e.target.value)}
                      placeholder="e.g., Wise, Payoneer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-paymentUrl">Payment URL</Label>
                    <Input
                      id="edit-paymentUrl"
                      type="url"
                      value={paymentUrl}
                      onChange={(e) => setPaymentUrl(e.target.value)}
                      placeholder="https://wise.com/pay/..."
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
