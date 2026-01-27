import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If Firebase not configured, show setup message
  if (!isConfigured) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="zen-container text-center">
          <div className="logo-rotate mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded border border-border bg-foreground text-background font-bold text-xl">
            W
          </div>
          <h1 className="mb-2 text-xl font-medium">WYRD-LEDGER</h1>
          <p className="mb-6 text-muted-foreground">
            Firebase configuration required
          </p>
          <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-6 text-left">
            <p className="mb-4 text-sm text-muted-foreground">
              Add the following environment variables to your project:
            </p>
            <ul className="space-y-1 text-xs font-mono text-muted-foreground">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
