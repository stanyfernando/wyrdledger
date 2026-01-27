import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Users, FileText, Cloud, Shield, Zap } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">WYRD-LEDGER V 1.0</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Features Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Features
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Product & Inventory Management</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Customer Order Tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Invoice & Receipt Generation</span>
              </li>
              <li className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-muted-foreground" />
                <span>Cloud Sync with Offline Support</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Secure Firebase Authentication</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>Real-time Dashboard Analytics</span>
              </li>
            </ul>
          </div>
          
          {/* Usage Section */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Usage
            </h3>
            <p className="text-sm text-muted-foreground">
              A minimal order management system designed for small businesses. 
              Track orders from payment through delivery, manage inventory, 
              and generate professional documents with ease.
            </p>
          </div>
          
          {/* Credits Section */}
          <div className="pt-4 border-t text-center text-sm">
            <p className="text-muted-foreground">
              Made by{" "}
              <a
                href="https://stanyfernando.github.io/dosmode"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:opacity-70 transition-opacity"
              >
                Stany
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
