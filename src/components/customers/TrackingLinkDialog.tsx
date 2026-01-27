import { useState, useEffect } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TrackingLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  currentTrackingLink?: string;
  currentCarrier?: string;
  onSave: (customerId: string, trackingLink: string, carrier: string) => void;
}

export function TrackingLinkDialog({
  open,
  onOpenChange,
  customerId,
  currentTrackingLink = "",
  currentCarrier = "",
  onSave,
}: TrackingLinkDialogProps) {
  const [trackingLink, setTrackingLink] = useState(currentTrackingLink);
  const [carrier, setCarrier] = useState(currentCarrier);

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setTrackingLink(currentTrackingLink);
      setCarrier(currentCarrier);
    }
  }, [open, currentTrackingLink, currentCarrier]);

  const handleSave = () => {
    if (trackingLink.trim()) {
      onSave(customerId, trackingLink.trim(), carrier.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Tracking Information
          </DialogTitle>
          <DialogDescription>
            Add tracking details for order <span className="font-mono">{customerId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier / Courier (Optional)</Label>
            <Input
              id="carrier"
              placeholder="e.g., DHL, FedEx, Aramex"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingLink">Tracking Link *</Label>
            <Input
              id="trackingLink"
              placeholder="https://..."
              value={trackingLink}
              onChange={(e) => setTrackingLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste the full tracking URL from the carrier's website
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!trackingLink.trim()}>
            Save Tracking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
