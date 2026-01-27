import { useState, useEffect } from "react";
import { Search, Plus, FileText, Truck, Edit, Trash2, Receipt, Users, Eye, RefreshCw } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { OrderStatus, Product } from "@/types";
import { CustomerEditDialog } from "@/components/customers/CustomerEditDialog";
import { CustomerViewDialog } from "@/components/customers/CustomerViewDialog";
import { TrackingLinkDialog } from "@/components/customers/TrackingLinkDialog";
import { RefundDetailsDialog } from "@/components/customers/RefundDetailsDialog";
import { DocumentPreviewDialog } from "@/components/documents/DocumentPreviewDialog";
import { useToast } from "@/hooks/use-toast";
import { useSync } from "@/contexts/SyncContext";

// Customer order type for this page
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
  currency?: "LKR" | "USD" | "GBP";
  trackingLink?: string;
  carrier?: string;
  paymentUrl?: string;
  paymentLabel?: string;
  bankAccountId?: string;
  refundDetails?: string;
}

const CUSTOMERS_STORAGE_KEY = "wyrd-ledger-customers";
const PRODUCTS_STORAGE_KEY = "wyrd-ledger-products";

// Load customers from localStorage
const loadCustomers = (): CustomerOrder[] => {
  try {
    const stored = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Load products from localStorage
const loadProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save customers to localStorage
const saveCustomersToLocal = (customers: CustomerOrder[]) => {
  localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
};

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  awaiting_payment: { label: "Awaiting Payment", className: "status-awaiting" },
  in_production: { label: "In Production", className: "status-production" },
  inbound: { label: "Inbound", className: "status-inbound" },
  in_transit: { label: "Out for Delivery", className: "status-transit" },
  delivered: { label: "Delivered", className: "status-delivered" },
  cancelled: { label: "Cancelled", className: "status-cancelled" },
  refunded: { label: "Refunded", className: "status-refunded" },
};

export default function Customers() {
  const { toast } = useToast();
  const { saveData } = useSync();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customers, setCustomers] = useState<CustomerOrder[]>(() => loadCustomers());
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  
  // Edit dialog state
  const [editingCustomer, setEditingCustomer] = useState<CustomerOrder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // View dialog state
  const [viewingCustomer, setViewingCustomer] = useState<CustomerOrder | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Tracking dialog state
  const [trackingCustomer, setTrackingCustomer] = useState<CustomerOrder | null>(null);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  
  // Document preview state
  const [documentType, setDocumentType] = useState<"invoice" | "production_receipt" | "delivery_receipt" | "credit_note">("invoice");
  const [documentCustomer, setDocumentCustomer] = useState<CustomerOrder | null>(null);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  
  // Refund dialog state
  const [refundCustomer, setRefundCustomer] = useState<CustomerOrder | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);

  // Save to localStorage and sync to cloud whenever customers change
  useEffect(() => {
    saveCustomersToLocal(customers);
    // Auto-sync to cloud
    if (customers.length > 0) {
      saveData("customers", customers as unknown as Record<string, unknown>[]).catch(console.error);
    }
  }, [customers, saveData]);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.id.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (customerId: string, newStatus: OrderStatus) => {
    setCustomers(customers.map(c => 
      c.id === customerId ? { ...c, status: newStatus } : c
    ));
  };

  const handleView = (customer: CustomerOrder) => {
    // Resolve bank account name if LKR
    let bankAccountName: string | undefined;
    if (customer.currency === "LKR" && customer.bankAccountId) {
      const bankAccounts = JSON.parse(localStorage.getItem("wyrd-ledger-bank-accounts") || '[]');
      const bank = bankAccounts.find((b: { id: string; nickname: string }) => b.id === customer.bankAccountId);
      bankAccountName = bank?.nickname;
    }
    
    setViewingCustomer({ ...customer, bankAccountName } as CustomerOrder & { bankAccountName?: string });
    setIsViewDialogOpen(true);
  };

  const handleEdit = (customer: CustomerOrder) => {
    setEditingCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleSaveCustomer = (updatedCustomer: CustomerOrder) => {
    setCustomers(customers.map(c => 
      c.id === updatedCustomer.id ? updatedCustomer : c
    ));
  };

  const handleOpenTracking = (customer: CustomerOrder) => {
    setTrackingCustomer(customer);
    setIsTrackingDialogOpen(true);
  };

  const handleSaveTracking = (customerId: string, trackingLink: string, carrier: string) => {
    setCustomers(customers.map(c => 
      c.id === customerId ? { ...c, trackingLink, carrier } : c
    ));
    toast({
      title: "Tracking saved",
      description: "Tracking information has been updated",
    });
  };

  const handleDelete = (customer: CustomerOrder) => {
    setCustomers(customers.filter(c => c.id !== customer.id));
    toast({
      title: "Customer deleted",
      description: `${customer.name}'s order has been removed`,
    });
  };

  const handleGenerateDocument = (customer: CustomerOrder, type: "invoice" | "production_receipt" | "delivery_receipt" | "credit_note") => {
    setDocumentCustomer(customer);
    setDocumentType(type);
    setIsDocumentDialogOpen(true);
  };

  const handleOpenRefund = (customer: CustomerOrder) => {
    setRefundCustomer(customer);
    setIsRefundDialogOpen(true);
  };

  const handleSaveRefund = (customerId: string, refundDetails: string) => {
    setCustomers(customers.map(c => 
      c.id === customerId ? { ...c, refundDetails } : c
    ));
    toast({
      title: "Refund details saved",
      description: "Refund information has been recorded",
    });
  };

  // Get the appropriate document type based on order status
  const getDocumentAction = (customer: CustomerOrder) => {
    switch (customer.status) {
      case "awaiting_payment":
        return { type: "invoice" as const, icon: FileText, label: "Invoice" };
      case "in_production":
        return { type: "production_receipt" as const, icon: Receipt, label: "Production Receipt" };
      case "inbound":
        return null; // No invoice/receipt for inbound status
      case "in_transit":
      case "delivered":
        return { type: "delivery_receipt" as const, icon: Receipt, label: "Delivery Receipt" };
      case "refunded":
        return { type: "credit_note" as const, icon: Receipt, label: "Credit Note" };
      default:
        return null;
    }
  };

  const getDocumentData = (customer: CustomerOrder) => {
    // Get bank details if LKR and bank selected
    let bankDetails;
    if (customer.currency === "LKR" && customer.bankAccountId) {
      const bankAccounts = JSON.parse(localStorage.getItem("wyrd-ledger-bank-accounts") || '[]');
      const bank = bankAccounts.find((b: { id: string; holderName: string; accountNumber: string; bank: string; bankCode?: string; branch: string; branchCode: string; swiftCode: string }) => b.id === customer.bankAccountId);
      if (bank) {
        bankDetails = {
          holderName: bank.holderName,
          accountNumber: bank.accountNumber,
          bank: bank.bank,
          bankCode: bank.bankCode,
          branch: bank.branch,
          branchCode: bank.branchCode,
          swiftCode: bank.swiftCode,
        };
      }
    }

    return {
      orderId: customer.id,
      date: new Date().toLocaleDateString(),
      customer: {
        name: customer.name,
        email: customer.email,
        contact: customer.contact,
        address: customer.address,
      },
      items: [{
        productId: customer.productId,
        productName: customer.productName || customer.productId,
        size: customer.size,
        color: customer.color,
        price: customer.price || 0,
      }],
      shipping: customer.shipping || 0,
      currency: customer.currency || "LKR" as const,
      trackingNumber: customer.trackingLink,
      carrier: customer.carrier,
      status: customer.status,
      bankDetails,
      paymentUrl: customer.paymentUrl,
      paymentLabel: customer.paymentLabel,
      refundDetails: customer.refundDetails,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-medium">Customers</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your customer orders
            </p>
          </div>
        </div>
        <Link to="/new-order">
          <Button className="transition-all duration-200 hover:scale-105">
            <Plus className="mr-2 h-5 w-5" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 animate-slide-up">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredCustomers.length > 0 ? (
        <Card className="hover:scale-100 hover:shadow-sm hover:translate-y-0 hover:border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-52"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const documentAction = getDocumentAction(customer);
                  const showTrackingButton = customer.status === "in_transit" || customer.status === "delivered";
                  const hasTracking = !!customer.trackingLink;

                  return (
                    <TableRow key={customer.id} className="bg-black text-white hover:bg-white/10 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {customer.id}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{customer.productId}</p>
                          <p className="text-muted-foreground">
                            {customer.size} / {customer.color}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={customer.status}
                          onValueChange={(v) =>
                            handleStatusChange(customer.id, v as OrderStatus)
                          }
                        >
                          <SelectTrigger className="h-8 w-40 border-0 bg-transparent p-0">
                            <Badge
                              className={`status-pill ${statusConfig[customer.status].className}`}
                              variant="outline"
                            >
                              {statusConfig[customer.status].label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(
                              ([key, { label }]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-1">
                            {/* View Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleView(customer)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>

                            {/* Edit Button - Not for delivered, cancelled, refunded */}
                            {customer.status !== "delivered" && customer.status !== "cancelled" && customer.status !== "refunded" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEdit(customer)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                            )}

                            {/* Tracking Button - Only for transit/delivered */}
                            {showTrackingButton && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${hasTracking ? "text-primary" : ""}`}
                                    onClick={() => handleOpenTracking(customer)}
                                  >
                                    <Truck className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {hasTracking ? "Edit Tracking" : "Add Tracking"}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Refund Button - Only for refunded status */}
                            {customer.status === "refunded" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${customer.refundDetails ? "text-primary" : ""}`}
                                    onClick={() => handleOpenRefund(customer)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {customer.refundDetails ? "Edit Refund Details" : "Add Refund Details"}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Document Button - Based on status */}
                            {documentAction && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleGenerateDocument(customer, documentAction.type)}
                                  >
                                    <documentAction.icon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{documentAction.label}</TooltipContent>
                              </Tooltip>
                            )}

                            {/* Delete Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(customer)}
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed animate-scale-in">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No customers found</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Create your first order to add a customer
            </p>
            <Link to="/new-order">
              <Button className="transition-all duration-200 hover:scale-105">
                <Plus className="mr-2 h-5 w-5" />
                Create New Order
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Customer View Dialog */}
      <CustomerViewDialog
        customer={viewingCustomer}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* Customer Edit Dialog */}
      <CustomerEditDialog
        customer={editingCustomer}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveCustomer}
        products={products}
      />

      {/* Tracking Link Dialog */}
      <TrackingLinkDialog
        open={isTrackingDialogOpen}
        onOpenChange={setIsTrackingDialogOpen}
        customerId={trackingCustomer?.id || ""}
        currentTrackingLink={trackingCustomer?.trackingLink}
        currentCarrier={trackingCustomer?.carrier}
        onSave={handleSaveTracking}
      />

      {/* Document Preview Dialog */}
      <DocumentPreviewDialog
        open={isDocumentDialogOpen}
        onOpenChange={setIsDocumentDialogOpen}
        type={documentType}
        data={documentCustomer ? getDocumentData(documentCustomer) : null}
      />

      {/* Refund Details Dialog */}
      <RefundDetailsDialog
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
        customerId={refundCustomer?.id || ""}
        currentRefundDetails={refundCustomer?.refundDetails}
        onSave={handleSaveRefund}
      />
    </div>
  );
}
