import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch,
  onSnapshot,
  Timestamp,
  deleteDoc 
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { SyncStatus } from "@/types";
import { toast } from "@/hooks/use-toast";
import { 
  queueOperation, 
  getQueuedOperations, 
  removeFromQueue,
  incrementRetryCount,
  shouldRetry,
  QueuedOperation 
} from "@/lib/offlineQueue";

interface SyncContextType {
  status: SyncStatus;
  lastSynced: Date | null;
  sync: () => Promise<void>;
  restore: () => Promise<void>;
  saveData: (collection: string, data: Record<string, unknown>[]) => Promise<void>;
  fetchData: (collectionName: string) => Promise<Record<string, unknown>[] | null>;
  isConnected: boolean;
  pendingOperations: number;
  processQueue: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  products: "wyrd-ledger-products",
  customers: "wyrd-ledger-customers",
  settings: "wyrd-ledger-settings",
  bankAccounts: "wyrd-ledger-bank-accounts",
};

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("offline");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const isProcessingQueue = useRef(false);

  // Update pending count on mount
  useEffect(() => {
    setPendingOperations(getQueuedOperations().length);
  }, []);

  // Check connection status on mount and when user changes
  useEffect(() => {
    if (!isFirebaseConfigured() || !db || !user) {
      setStatus("offline");
      setIsConnected(false);
      return;
    }

    // Set up a simple connection check by listening to a dummy doc
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      () => {
        setIsConnected(true);
        setStatus("synced");
      },
      (error) => {
        console.error("Connection error:", error);
        setIsConnected(false);
        setStatus("offline");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Internal save function that doesn't queue (used by processQueue)
  const saveDataInternal = useCallback(async (collectionName: string, data: Record<string, unknown>[]) => {
    if (!db || !user) {
      throw new Error("Cannot save: No database connection or user");
    }

    const batch = writeBatch(db);
    const userDataRef = doc(db, "users", user.uid, "data", collectionName);
    
    batch.set(userDataRef, {
      items: data,
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
    setLastSynced(new Date());
    setStatus("synced");
  }, [user]);

  // Save data to a specific collection in Firestore
  const saveData = useCallback(async (collectionName: string, data: Record<string, unknown>[]) => {
    if (!db || !user) {
      console.warn("Cannot save: No database connection or user");
      // Queue the operation for later
      queueOperation({ type: "save", collection: collectionName, data });
      setPendingOperations(prev => prev + 1);
      toast({
        variant: "destructive",
        title: "Offline - changes queued",
        description: "Your changes are saved locally and will sync when connection returns.",
      });
      return;
    }

    setStatus("syncing");
    
    try {
      await saveDataInternal(collectionName, data);
    } catch (error) {
      console.error(`Error saving ${collectionName}:`, error);
      
      // Queue the operation for later
      queueOperation({ type: "save", collection: collectionName, data });
      setPendingOperations(prev => prev + 1);
      
      // Show user-friendly error
      toast({
        variant: "destructive",
        title: "Save failed - queued for later",
        description: "Your changes are saved locally and will sync when connection returns.",
      });
      
      setStatus("offline");
    }
  }, [user, saveDataInternal]);

  // Process queued operations
  const processQueue = useCallback(async () => {
    if (!db || !user || isProcessingQueue.current) return;
    
    const operations = getQueuedOperations();
    if (operations.length === 0) return;
    
    isProcessingQueue.current = true;
    let successCount = 0;
    
    for (const op of operations) {
      if (!shouldRetry(op)) {
        // Remove operations that have exceeded max retries
        removeFromQueue(op.id);
        continue;
      }
      
      try {
        if (op.type === "save" && op.collection) {
          await saveDataInternal(op.collection, op.data as Record<string, unknown>[]);
          removeFromQueue(op.id);
          successCount++;
        }
      } catch (error) {
        console.error("Failed to process queued operation:", error);
        incrementRetryCount(op.id);
      }
    }
    
    const remaining = getQueuedOperations().length;
    setPendingOperations(remaining);
    isProcessingQueue.current = false;
    
    if (successCount > 0) {
      toast({
        title: "Sync complete",
        description: `${successCount} pending change(s) synced to cloud.`,
      });
    }
  }, [db, user, saveDataInternal]);

  // Process queue when connection is restored
  useEffect(() => {
    if (isConnected && pendingOperations > 0) {
      processQueue();
    }
  }, [isConnected, pendingOperations, processQueue]);

  // Sync all local data to Firestore
  const sync = useCallback(async () => {
    if (!db || !user) {
      setStatus("offline");
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "No connection to cloud. Please try again later.",
      });
      return;
    }

    setStatus("syncing");

    try {
      const batch = writeBatch(db);
      
      // Sync all local storage data to Firestore
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          const parsed = JSON.parse(localData);
          const userDataRef = doc(db, "users", user.uid, "data", key);
          batch.set(userDataRef, {
            items: Array.isArray(parsed) ? parsed : [parsed],
            updatedAt: Timestamp.now(),
          });
        }
      }

      await batch.commit();
      setLastSynced(new Date());
      setStatus("synced");
      
      toast({
        title: "Sync complete",
        description: "All data synced to cloud successfully.",
      });
    } catch (error) {
      console.error("Sync error:", error);
      setStatus("offline");
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Failed to sync data. Please check your connection.",
      });
    }
  }, [user]);

  // Restore data from Firestore to localStorage
  const restore = useCallback(async () => {
    if (!db || !user) {
      setStatus("offline");
      throw new Error("Not connected to cloud");
    }

    setStatus("syncing");

    try {
      const dataCollectionRef = collection(db, "users", user.uid, "data");
      const snapshot = await getDocs(dataCollectionRef);
      
      snapshot.forEach((docSnapshot) => {
        const key = docSnapshot.id as keyof typeof STORAGE_KEYS;
        const storageKey = STORAGE_KEYS[key];
        if (storageKey) {
          const data = docSnapshot.data();
          if (data.items) {
            localStorage.setItem(storageKey, JSON.stringify(data.items));
          }
        }
      });

      setLastSynced(new Date());
      setStatus("synced");
      
      toast({
        title: "Restore complete",
        description: "Data restored from cloud. Refreshing...",
      });
      
      // Trigger a page reload to reflect restored data
      window.location.reload();
    } catch (error) {
      console.error("Restore error:", error);
      setStatus("offline");
      toast({
        variant: "destructive",
        title: "Restore failed",
        description: "Failed to restore data. Please check your connection.",
      });
      throw error;
    }
  }, [user]);

  // Fetch data from a specific collection in Firestore
  const fetchData = useCallback(async (collectionName: string): Promise<Record<string, unknown>[] | null> => {
    if (!db || !user) {
      console.warn("Cannot fetch: No database connection or user");
      return null;
    }

    try {
      const snapshot = await getDocs(collection(db, "users", user.uid, "data"));
      
      for (const docSnapshot of snapshot.docs) {
        if (docSnapshot.id === collectionName) {
          const data = docSnapshot.data();
          return data.items as Record<string, unknown>[] || null;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      toast({
        variant: "destructive",
        title: "Fetch failed",
        description: `Failed to load ${collectionName}. Using local data.`,
      });
      return null;
    }
  }, [user]);

  // Reset all data from Firebase
  const resetAllData = useCallback(async () => {
    if (!db || !user) {
      throw new Error("Cannot reset: No database connection or user");
    }

    setStatus("syncing");

    try {
      // Get all documents in the user's data collection
      const dataCollectionRef = collection(db, "users", user.uid, "data");
      const snapshot = await getDocs(dataCollectionRef);
      
      // Delete each document
      const deletePromises = snapshot.docs.map((docSnapshot) => 
        deleteDoc(doc(db, "users", user.uid, "data", docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      
      setStatus("synced");
      setLastSynced(null);
    } catch (error) {
      console.error("Reset error:", error);
      setStatus("offline");
      throw error;
    }
  }, [user]);

  return (
    <SyncContext.Provider value={{ 
      status, 
      lastSynced, 
      sync, 
      restore, 
      saveData, 
      fetchData, 
      isConnected,
      pendingOperations,
      processQueue,
      resetAllData
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
