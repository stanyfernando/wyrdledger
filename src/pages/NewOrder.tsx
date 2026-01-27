import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, User, Package, CreditCard, ClipboardCheck, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Currency, OrderItem, BankAccount } from "@/types";
import { ProductSelector } from "@/components/orders/ProductSelector";
import { useSync } from "@/contexts/SyncContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CUSTOMERS_STORAGE_KEY = "wyrd-ledger-customers";
const BANK_ACCOUNTS_KEY = "wyrd-ledger-bank-accounts";

const steps = [
  { id: 1, title: "Customer Details", icon: User },
  { id: 2, title: "Products", icon: Package },
  { id: 3, title: "Payment", icon: CreditCard },
  { id: 4, title: "Review", icon: ClipboardCheck },
];

const SESSION_FORM_KEY = "wyrd-ledger-new-order-form";

interface FormState {
  currentStep: number;
  customerName: string;
  customerEmail: string;
  customerContact: string;
  customerAddress: string;
  customerNotes: string;
  items: OrderItem[];
  currency: Currency;
  orderPrice: number;
  shipping: number;
  paymentLabel: string;
  paymentUrl: string;
  selectedBankId: string;
}

const getInitialFormState = (): FormState => {
  try {
    const saved = sessionStorage.getItem(SESSION_FORM_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return {
    currentStep: 1,
    customerName: "",
    customerEmail: "",
    customerContact: "",
    customerAddress: "",
    customerNotes: "",
    items: [],
    currency: "LKR",
    orderPrice: 0,
    shipping: 0,
    paymentLabel: "",
    paymentUrl: "",
    selectedBankId: "",
  };
};

export default function NewOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveData } = useSync();
  
  // Initialize from session storage
  const initialState = getInitialFormState();
  
  const [currentStep, setCurrentStep] = useState(initialState.currentStep);
  const [customerName, setCustomerName] = useState(initialState.customerName);
  const [customerEmail, setCustomerEmail] = useState(initialState.customerEmail);
  const [customerContact, setCustomerContact] = useState(initialState.customerContact);
  const [customerAddress, setCustomerAddress] = useState(initialState.customerAddress);
  const [customerNotes, setCustomerNotes] = useState(initialState.customerNotes);
  const [items, setItems] = useState<OrderItem[]>(initialState.items);
  const [currency, setCurrency] = useState<Currency>(initialState.currency);
  const [orderPrice, setOrderPrice] = useState(initialState.orderPrice);
  const [shipping, setShipping] = useState(initialState.shipping);
  const [paymentLabel, setPaymentLabel] = useState(initialState.paymentLabel);
  const [paymentUrl, setPaymentUrl] = useState(initialState.paymentUrl);
  const [selectedBankId, setSelectedBankId] = useState(initialState.selectedBankId);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Load bank accounts from localStorage and auto-select default
  useEffect(() => {
    const loadBankAccounts = () => {
      try {
        const stored = localStorage.getItem(BANK_ACCOUNTS_KEY);
        if (stored) {
          const accounts: BankAccount[] = JSON.parse(stored);
          setBankAccounts(accounts);
          
          // Auto-select: if only one bank OR if a default exists, pre-select it
          if (accounts.length === 1) {
            setSelectedBankId(accounts[0].id);
          } else if (accounts.length > 1 && !selectedBankId) {
            const defaultBank = accounts.find(a => a.isDefault);
            if (defaultBank) {
              setSelectedBankId(defaultBank.id);
            }
          }
        }
      } catch {
        console.error("Failed to load bank accounts");
      }
    };
    loadBankAccounts();
  }, []);

  // Save form state to sessionStorage whenever it changes
  const saveFormState = useCallback(() => {
    const formState: FormState = {
      currentStep,
      customerName,
      customerEmail,
      customerContact,
      customerAddress,
      customerNotes,
      items,
      currency,
      orderPrice,
      shipping,
      paymentLabel,
      paymentUrl,
      selectedBankId,
    };
    sessionStorage.setItem(SESSION_FORM_KEY, JSON.stringify(formState));
  }, [currentStep, customerName, customerEmail, customerContact, customerAddress, customerNotes, items, currency, orderPrice, shipping, paymentLabel, paymentUrl, selectedBankId]);

  // Auto-save on any state change
  useEffect(() => {
    saveFormState();
  }, [saveFormState]);

  // Clear session on successful submit
  const clearFormSession = () => {
    sessionStorage.removeItem(SESSION_FORM_KEY);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          customerName.trim() &&
          customerEmail.trim() &&
          customerContact.trim() &&
          customerAddress.trim()
        );
      case 2:
        return items.length > 0;
      case 3:
        // Require bank selection for LKR, payment URL for USD/GBP
        if (currency === "LKR") {
          return bankAccounts.length === 0 || selectedBankId.trim() !== "";
        }
        return paymentLabel.trim() && paymentUrl.trim();
      case 4:
        // Validate payment details before final submission
        if (currency === "LKR") {
          return bankAccounts.length === 0 || selectedBankId.trim() !== "";
        }
        return paymentLabel.trim() && paymentUrl.trim();
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const LOW_STOCK_THRESHOLD = 5;

  const handleSubmit = () => {
    // Generate customer ID: WW_[YY]_[MM]-[NNN]
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Load existing customers to get next order number
    const existingCustomers = JSON.parse(localStorage.getItem(CUSTOMERS_STORAGE_KEY) || '[]');
    const orderNum = (existingCustomers.length + 1).toString().padStart(3, '0');
    const customerId = `WW_${yy}_${mm}-${orderNum}`;

    // Create customer order for first item (or all items in future multi-product support)
    const firstItem = items[0];
    const newCustomer = {
      id: customerId,
      name: customerName,
      email: customerEmail,
      contact: customerContact,
      address: customerAddress,
      notes: customerNotes,
      productId: firstItem?.productId || '',
      productName: firstItem?.productName || '',
      size: firstItem?.size || '',
      color: firstItem?.color || '',
      status: 'awaiting_payment' as const,
      price: orderPrice,
      shipping: shipping,
      currency: currency,
      paymentLabel: currency !== 'LKR' ? paymentLabel : undefined,
      paymentUrl: currency !== 'LKR' ? paymentUrl : undefined,
      bankAccountId: currency === 'LKR' ? selectedBankId : undefined,
    };

    // Save customer to localStorage
    const updatedCustomers = [...existingCustomers, newCustomer];
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(updatedCustomers));
    
    // Background sync customers to cloud
    saveData("customers", updatedCustomers as unknown as Record<string, unknown>[]).catch(console.error);

    // Decrement stock for each unique product in the order
    const uniqueProductIds = [...new Set(items.map(item => item.productId))];
    const products = JSON.parse(localStorage.getItem("wyrd-ledger-products") || "[]");
    const lowStockProducts: string[] = [];
    const outOfStockProducts: string[] = [];

    uniqueProductIds.forEach(productId => {
      const product = products.find((p: { id: string; stock: number; name: string }) => p.id === productId);
      if (product && product.stock > 0) {
        product.stock -= 1;
        if (product.stock === 0) {
          outOfStockProducts.push(product.name);
        } else if (product.stock < LOW_STOCK_THRESHOLD) {
          lowStockProducts.push(`${product.name} (${product.stock} remaining)`);
        }
      }
    });

    // Save updated products to localStorage and sync to cloud
    localStorage.setItem("wyrd-ledger-products", JSON.stringify(products));
    saveData("products", products as unknown as Record<string, unknown>[]).catch(console.error);

    // Show stock notifications
    outOfStockProducts.forEach(name => {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: `${name} is now out of stock!`,
      });
    });
    lowStockProducts.forEach(info => {
      toast({
        title: "Low Stock Warning",
        description: `${info} is running low!`,
      });
    });

    // Clear session form state on successful submit
    clearFormSession();
    
    toast({
      title: "Order created",
      description: `Order ${customerId} has been saved successfully`,
    });
    navigate("/customers");
  };

  const getCurrencySymbol = () => {
    switch (currency) {
      case "LKR":
        return "LKR ";
      case "USD":
        return "$";
      case "GBP":
        return "£";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <FilePlus className="h-7 w-7" />
        <div>
          <h1 className="text-2xl font-medium">New Order</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new customer order
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between animate-slide-up">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground scale-105"
                    : isCurrent
                    ? "border-primary bg-transparent text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`ml-2 text-sm transition-colors ${
                  currentStep >= step.id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-px w-12 transition-all duration-300 ${
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="hover:scale-100 hover:shadow-sm hover:translate-y-0 hover:border-border">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Customer Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="+94 77 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea
                  id="address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Main Street, Colombo 07, Sri Lanka"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Products */}
          {currentStep === 2 && (
            <ProductSelector
              items={items}
              onItemsChange={setItems}
            />
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="space-y-4">
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
                      className="flex-1"
                    >
                      {curr === "LKR" && "LKR"}
                      {curr === "USD" && "$ USD"}
                      {curr === "GBP" && "£ GBP"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Order Price & Shipping */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderPrice">
                    Price ({getCurrencySymbol()})
                  </Label>
                  <Input
                    id="orderPrice"
                    type="number"
                    min={0}
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping">
                    Shipping ({getCurrencySymbol()})
                  </Label>
                  <Input
                    id="shipping"
                    type="number"
                    min={0}
                    value={shipping}
                    onChange={(e) => setShipping(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>


              {currency === "LKR" && (
                <div className="rounded-lg border border-dashed p-4 space-y-4">
                  <p className="text-sm text-muted-foreground text-center">Bank account for payment</p>
                  {bankAccounts.length === 0 ? (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">No bank accounts found</p>
                      <Button 
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/settings")}
                      >
                        Add Bank Account
                      </Button>
                    </div>
                  ) : bankAccounts.length === 1 ? (
                    // Single bank - show it directly without dropdown
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="font-medium">{bankAccounts[0].nickname}</p>
                      <p className="text-sm text-muted-foreground">
                        {bankAccounts[0].bank} • ****{bankAccounts[0].accountNumber.slice(-4)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        <button type="button" className="underline hover:text-foreground" onClick={() => navigate("/settings")}>
                          Add another bank
                        </button>
                      </p>
                    </div>
                  ) : (
                    // Multiple banks - show dropdown with default pre-selected
                    <div className="space-y-2">
                      <Label htmlFor="bankSelect">Select Bank Account</Label>
                      <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                        <SelectTrigger id="bankSelect">
                          <SelectValue placeholder="Choose a bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((bank) => (
                            <SelectItem key={bank.id} value={bank.id}>
                              {bank.nickname} - {bank.bank} ({bank.accountNumber.slice(-4)})
                              {bank.isDefault && " ★"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Or <button type="button" className="underline hover:text-foreground" onClick={() => navigate("/settings")}>add a new bank</button>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {currency !== "LKR" && (
                <div className="rounded-lg border border-dashed p-4 space-y-4">
                  <p className="text-sm text-muted-foreground text-center">Payment request details</p>
                  <div className="space-y-2">
                    <Label htmlFor="paymentLabel">Payment Label</Label>
                    <Input
                      id="paymentLabel"
                      value={paymentLabel}
                      onChange={(e) => setPaymentLabel(e.target.value)}
                      placeholder="e.g., Wise, Payoneer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentUrl">Payment URL</Label>
                    <Input
                      id="paymentUrl"
                      type="url"
                      value={paymentUrl}
                      onChange={(e) => setPaymentUrl(e.target.value)}
                      placeholder="https://wise.com/pay/..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (() => {
            // Generate preview customer ID
            const getPreviewCustomerId = () => {
              const now = new Date();
              const yy = now.getFullYear().toString().slice(-2);
              const mm = (now.getMonth() + 1).toString().padStart(2, '0');
              const existingCustomers = JSON.parse(localStorage.getItem(CUSTOMERS_STORAGE_KEY) || '[]');
              const orderNum = (existingCustomers.length + 1).toString().padStart(3, '0');
              return `WW_${yy}_${mm}-${orderNum}`;
            };
            
            return (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Customer
                </h4>
                <div className="mb-3 inline-block rounded-md bg-primary px-3 py-1 text-sm font-mono text-primary-foreground">
                  {getPreviewCustomerId()}
                </div>
                <p className="font-medium">{customerName}</p>
                <p className="text-sm text-muted-foreground">{customerEmail}</p>
                <p className="text-sm text-muted-foreground">
                  {customerContact}
                </p>
                <p className="mt-2 text-sm">{customerAddress}</p>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Products
                </h4>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No products added
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0"
                      >
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-muted-foreground">
                          Size: {item.size} • Color: {item.color}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Payment
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span>Currency</span>
                  <span>{currency}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Price</span>
                  <span>
                    {getCurrencySymbol()}
                    {orderPrice}
                  </span>
                </div>
                {shipping > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                      {getCurrencySymbol()}
                      {shipping}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-medium border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>
                    {getCurrencySymbol()}
                    {orderPrice + shipping}
                  </span>
                </div>
              </div>
            </div>
          );})()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between animate-fade-in">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            onClick={handleBack}
            className="transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="transition-all duration-200 hover:scale-105">
            Next
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="transition-all duration-200 hover:scale-105">
            <Check className="mr-2 h-5 w-5" />
            Create Order
          </Button>
        )}
      </div>
    </div>
  );
}
