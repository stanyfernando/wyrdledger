import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStatus, Currency } from "@/types";

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
  trackingLink?: string;
  carrier?: string;
  // Payment information
  bankAccountName?: string;
  paymentUrl?: string;
  paymentLabel?: string;
  // Refund information
  refundDetails?: string;
}

interface CustomerViewDialogProps {
  customer: CustomerOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  awaiting_payment: { label: "Awaiting Payment", className: "status-awaiting" },
  in_production: { label: "In Production", className: "status-production" },
  inbound: { label: "Inbound", className: "status-inbound" },
  in_transit: { label: "Out for Delivery", className: "status-transit" },
  delivered: { label: "Delivered", className: "status-delivered" },
  cancelled: { label: "Cancelled", className: "status-cancelled" },
  refunded: { label: "Refunded", className: "status-refunded" },
};

const getCurrencySymbol = (currency: Currency) => {
  switch (currency) {
    case "LKR": return "LKR ";
    case "USD": return "$";
    case "GBP": return "£";
    default: return "LKR ";
  }
};

export function CustomerViewDialog({
  customer,
  open,
  onOpenChange,
}: CustomerViewDialogProps) {
  if (!customer) return null;

  const subtotal = customer.price || 0;
  const shipping = customer.shipping || 0;
  const total = subtotal + shipping;
  const currency = customer.currency || "LKR";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            Order ID: <span className="font-mono">{customer.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Customer Information</h4>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{customer.email}</span>
              </div>
              {customer.contact && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <span>{customer.contact}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-right max-w-[200px]">{customer.address}</span>
                </div>
              )}
              {customer.notes && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground text-sm">Notes:</span>
                  <p className="text-sm mt-1">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Order Details</h4>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  className={`status-pill ${statusConfig[customer.status].className}`}
                  variant="outline"
                >
                  {statusConfig[customer.status].label}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">{customer.productName || customer.productId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product ID</span>
                <span className="font-mono text-sm">{customer.productId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>{customer.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Color</span>
                <span>{customer.color}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{getCurrencySymbol(currency)}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{getCurrencySymbol(currency)}{shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total</span>
                <span>{getCurrencySymbol(currency)}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Payment Information</h4>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{currency}</span>
              </div>
              {currency === "LKR" && customer.bankAccountName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Account</span>
                  <span>{customer.bankAccountName}</span>
                </div>
              )}
              {(currency === "USD" || currency === "GBP") && customer.paymentUrl && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Link</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => window.open(customer.paymentUrl, "_blank")}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    {customer.paymentLabel || "Open Link"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tracking Info */}
          {(customer.status === "in_transit" || customer.status === "delivered") && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Tracking Information</h4>
                <div className="rounded-lg border p-4">
                  {customer.trackingLink ? (
                    <div className="space-y-2">
                      {customer.carrier && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Carrier</span>
                          <span>{customer.carrier}</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(customer.trackingLink, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Tracking
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No tracking information available
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Refund Info - Only for refunded status */}
          {customer.status === "refunded" && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Refund Information</h4>
                <div className="rounded-lg border p-4">
                  {customer.refundDetails ? (
                    <p className="text-sm whitespace-pre-wrap">{customer.refundDetails}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No refund details recorded
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
