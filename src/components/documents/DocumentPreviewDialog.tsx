import { useRef } from "react";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { ReceiptTemplate } from "./ReceiptTemplate";
import { CreditNoteTemplate } from "./CreditNoteTemplate";
import { Currency } from "@/types";

interface OrderItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  price: number;
}

interface DocumentData {
  orderId: string;
  date: string;
  customer: {
    name: string;
    email: string;
    contact?: string;
    address?: string;
  };
  items: OrderItem[];
  shipping: number;
  currency: Currency;
  bankDetails?: {
    holderName: string;
    accountNumber: string;
    bank: string;
    branch: string;
    branchCode: string;
    swiftCode: string;
  };
  paymentUrl?: string;
  paymentLabel?: string;
  trackingNumber?: string;
  carrier?: string;
  refundDetails?: string;
}

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "invoice" | "production_receipt" | "delivery_receipt" | "credit_note";
  data: DocumentData | null;
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  type,
  data,
}: DocumentPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Clone the content to avoid modifying the original
    const printContent = content.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${type === "invoice" ? "Invoice" : "Receipt"} - ${data.orderId}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              font-family: Arial, sans-serif;
            }
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              html, body {
                width: 210mm;
                min-height: 297mm;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    // Small delay to ensure content is rendered
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getTitle = () => {
    switch (type) {
      case "invoice": return "Invoice Preview";
      case "production_receipt": return "Production Receipt Preview";
      case "delivery_receipt": return "Delivery Receipt Preview";
      case "credit_note": return "Credit Note Preview";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogDescription>
              Order: {data.orderId}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Document Preview - A4 aspect ratio container */}
        <div className="flex-1 overflow-auto bg-muted/50 p-4 rounded-lg">
          <div 
            className="mx-auto shadow-lg"
            style={{
              width: "210mm",
              maxWidth: "100%",
              transform: "scale(var(--preview-scale, 1))",
              transformOrigin: "top center",
            }}
          >
            <div ref={printRef}>
              {type === "invoice" ? (
                <InvoiceTemplate data={data} />
              ) : type === "credit_note" ? (
                <CreditNoteTemplate data={data} />
              ) : (
                <ReceiptTemplate
                  data={{
                    ...data,
                    type: type === "production_receipt" ? "production" : "delivery",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
