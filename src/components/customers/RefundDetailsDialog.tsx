import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RefundDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  currentRefundDetails?: string;
  onSave: (customerId: string, refundDetails: string) => void;
}

export function RefundDetailsDialog({
  open,
  onOpenChange,
  customerId,
  currentRefundDetails,
  onSave,
}: RefundDetailsDialogProps) {
  const [refundDetails, setRefundDetails] = useState(currentRefundDetails || "");

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setRefundDetails(currentRefundDetails || "");
    }
  }, [open, currentRefundDetails]);

  const handleSubmit = () => {
    onSave(customerId, refundDetails);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            <DialogTitle>Refund Details</DialogTitle>
          </div>
          <DialogDescription>
            Order: <span className="font-mono">{customerId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="refundDetails">Enter refund details:</Label>
            <Textarea
              id="refundDetails"
              value={refundDetails}
              onChange={(e) => setRefundDetails(e.target.value)}
              placeholder="Bank Transfer to 1234567890&#10;Refunded on 26/01/2025&#10;Reference: REF-12345"
              className="min-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
