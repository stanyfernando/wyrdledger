import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, signIn, isConfigured, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm animate-scale-in">
        {/* Login Card Container */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-lg transition-all duration-300">
          {/* Logo */}
          <div className="mb-8 text-center">
            <img 
              src="https://i.imgur.com/3tWFJXW.png" 
              alt="WYRD & WEFT" 
              className="logo-rotate mx-auto mb-4 h-14 w-14 dark:invert"
            />
            <h1 className="text-xl font-medium tracking-wide">WYRD-LEDGER</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order Management Tool
            </p>
          </div>

          {/* Firebase Not Configured */}
          {!isConfigured && (
            <div className="rounded-lg border border-dashed border-border bg-muted/50 p-6 text-center animate-fade-in">
              <Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Firebase configuration required
              </p>
              <p className="text-xs text-muted-foreground">
                Check environment variables
              </p>
            </div>
          )}

          {/* Login Form */}
          {isConfigured && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wyrdweft.com"
                  required
                  disabled={isLoading}
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
              </div>

              <Button
                type="submit"
                className="w-full transition-all duration-200 hover:scale-[1.02]"
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
