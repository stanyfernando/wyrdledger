import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, RefreshCw, AlertTriangle, RotateCcw, Database, Settings as SettingsIcon, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useSync } from "@/contexts/SyncContext";
import { BankAccount } from "@/types";
import { auth } from "@/lib/firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

const BANK_ACCOUNTS_KEY = "wyrd-ledger-bank-accounts";

// Load bank accounts from localStorage
const loadBankAccounts = (): BankAccount[] => {
  try {
    const stored = localStorage.getItem(BANK_ACCOUNTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save bank accounts to localStorage and trigger background sync
const saveBankAccountsWithSync = async (accounts: BankAccount[], syncFn: () => Promise<void>) => {
  localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
  // Background sync - don't await, let it happen in background
  syncFn().catch(err => console.warn("Background sync failed:", err));
};

export default function Settings() {
  const { toast } = useToast();
  const { sync, restore, lastSynced, status, isConnected, resetAllData } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => loadBankAccounts());
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Bank form state
  const [formNickname, setFormNickname] = useState("");
  const [formHolderName, setFormHolderName] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formBank, setFormBank] = useState("");
  const [formBankCode, setFormBankCode] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formBranchCode, setFormBranchCode] = useState("");
  const [formSwiftCode, setFormSwiftCode] = useState("");

  const openAddAccountDialog = () => {
    setEditingAccount(null);
    setFormNickname("");
    setFormHolderName("");
    setFormAccountNumber("");
    setFormBank("");
    setFormBankCode("");
    setFormBranch("");
    setFormBranchCode("");
    setFormSwiftCode("");
    setIsAccountDialogOpen(true);
  };

  const openEditAccountDialog = (account: BankAccount) => {
    setEditingAccount(account);
    setFormNickname(account.nickname);
    setFormHolderName(account.holderName);
    setFormAccountNumber(account.accountNumber);
    setFormBank(account.bank);
    setFormBankCode(account.bankCode || "");
    setFormBranch(account.branch);
    setFormBranchCode(account.branchCode);
    setFormSwiftCode(account.swiftCode);
    setIsAccountDialogOpen(true);
  };

  const handleSaveAccount = () => {
    const newAccount: BankAccount = {
      id: editingAccount?.id || Date.now().toString(),
      nickname: formNickname,
      holderName: formHolderName,
      accountNumber: formAccountNumber,
      bank: formBank,
      bankCode: formBankCode,
      branch: formBranch,
      branchCode: formBranchCode,
      swiftCode: formSwiftCode,
      isDefault: bankAccounts.length === 0,
    };

    let updatedAccounts: BankAccount[];
    if (editingAccount) {
      updatedAccounts = bankAccounts.map((a) => (a.id === editingAccount.id ? newAccount : a));
    } else {
      updatedAccounts = [...bankAccounts, newAccount];
    }
    
    setBankAccounts(updatedAccounts);
    saveBankAccountsWithSync(updatedAccounts, sync);

    toast({
      title: editingAccount ? "Account updated" : "Account added",
      description: `${formNickname} has been saved`,
    });
    setIsAccountDialogOpen(false);
  };

  const handleDeleteAccount = (account: BankAccount) => {
    const updatedAccounts = bankAccounts.filter((a) => a.id !== account.id);
    setBankAccounts(updatedAccounts);
    saveBankAccountsWithSync(updatedAccounts, sync);
    toast({
      title: "Account deleted",
      description: `${account.nickname} has been removed`,
    });
  };

  const handleSetDefault = (account: BankAccount) => {
    const updatedAccounts = bankAccounts.map((a) => ({
      ...a,
      isDefault: a.id === account.id,
    }));
    setBankAccounts(updatedAccounts);
    saveBankAccountsWithSync(updatedAccounts, sync);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await sync();
      toast({
        title: "Sync complete",
        description: "Data has been synchronized to cloud",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not sync data to cloud. Please try again.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restore();
      toast({
        title: "Data restored",
        description: "Latest data has been pulled from cloud",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Restore failed",
        description: "Could not restore data from cloud. Please try again.",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // First, delete cloud data if connected
      if (isConnected) {
        await resetAllData();
      }
      
      // Then clear all local storage data
      localStorage.removeItem("wyrd-ledger-products");
      localStorage.removeItem("wyrd-ledger-customers");
      localStorage.removeItem("wyrd-ledger-settings");
      localStorage.removeItem(BANK_ACCOUNTS_KEY);
      localStorage.removeItem("wyrd-ledger-offline-queue");
      
      setBankAccounts([]);
      
      toast({
        title: "Data reset complete",
        description: isConnected 
          ? "All local and cloud data has been cleared" 
          : "Local data cleared. Cloud data will be cleared when online.",
        variant: "destructive",
      });
      
      setIsResetDialogOpen(false);
      
      // Reload to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Reset failed:", error);
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: "Failed to clear cloud data. Local data was not cleared.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation must match",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const user = auth?.currentUser;
      if (!user || !user.email) throw new Error("Not authenticated");

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Then update password
      await updatePassword(user, newPassword);

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully",
      });
      setIsPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to change password",
        description: "Check your current password and try again",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-7 w-7" />
        <div>
          <h1 className="text-2xl font-medium">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your app configuration
          </p>
        </div>
      </div>

      {/* Bank Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Bank Details</CardTitle>
          <Button size="sm" onClick={openAddAccountDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No bank accounts added
            </p>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-white/20 p-4 bg-black text-white hover:border-primary/50 transition-colors duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.nickname}</p>
                      {/* Show "Default" pill only if this is the only bank OR if it's set as default */}
                      {bankAccounts.length === 1 ? (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      ) : account.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {account.bank} • {account.accountNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Star icon only shows if there are 2+ bank accounts */}
                    {bankAccounts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${account.isDefault ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                        onClick={() => handleSetDefault(account)}
                        disabled={account.isDefault}
                      >
                        <Star className={`h-4 w-4 ${account.isDefault ? 'fill-yellow-500' : ''}`} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditAccountDialog(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAccount(account)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
              <div>
                <p className="font-medium">Cloud Connection</p>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected to Firebase' : 'Not connected - check your internet'}
                </p>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Online" : "Offline"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Data
              </p>
              <p className="text-sm text-muted-foreground ml-6">
                {lastSynced
                  ? `Last synced: ${lastSynced.toLocaleString()}`
                  : "Not synced yet"}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleSync} disabled={isSyncing || !isConnected}>
                    <RefreshCw className={`mr-2 h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Push local data to cloud</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium flex items-center gap-2">
                  <RotateCcw className={`h-4 w-4 text-muted-foreground ${isRestoring ? 'animate-spin' : ''}`} />
                  Restore Data
                </p>
                <p className="text-sm text-muted-foreground ml-6">
                  Pull the latest saved data from cloud
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleRestore} disabled={isRestoring || !isConnected}>
                      <RotateCcw className={`mr-2 h-5 w-5 ${isRestoring ? 'animate-spin' : ''}`} />
                      {isRestoring ? "Restoring..." : "Restore"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Restore from last cloud backup</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Reset Everything
                </p>
                <p className="text-sm text-muted-foreground ml-6">
                  Clear all data and start fresh
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setIsResetDialogOpen(true)}
                disabled={isResetting}
              >
                {isResetting ? (
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-5 w-5" />
                )}
                {isResetting ? "Resetting..." : "Reset"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit Bank Account" : "Add Bank Account"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={formNickname}
                onChange={(e) => setFormNickname(e.target.value)}
                placeholder="Main Account"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="holderName">Account Holder Name</Label>
              <Input
                id="holderName"
                value={formHolderName}
                onChange={(e) => setFormHolderName(e.target.value)}
                placeholder="WYRD & WEFT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formAccountNumber}
                onChange={(e) => setFormAccountNumber(e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank">Bank Name</Label>
                <Input
                  id="bank"
                  value={formBank}
                  onChange={(e) => setFormBank(e.target.value)}
                  placeholder="Commercial Bank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankCode">Bank Code</Label>
                <Input
                  id="bankCode"
                  value={formBankCode}
                  onChange={(e) => setFormBankCode(e.target.value)}
                  placeholder="7056"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  placeholder="Colombo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchCode">Branch Code</Label>
                <Input
                  id="branchCode"
                  value={formBranchCode}
                  onChange={(e) => setFormBranchCode(e.target.value)}
                  placeholder="001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="swiftCode">Swift Code</Label>
              <Input
                id="swiftCode"
                value={formSwiftCode}
                onChange={(e) => setFormSwiftCode(e.target.value)}
                placeholder="CCEYLKLX"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAccountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAccount}>
              {editingAccount ? "Save Changes" : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your data including customers,
              orders, products, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? "Resetting..." : "Yes, Reset Everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
