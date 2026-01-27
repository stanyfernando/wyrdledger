import { appConfig } from "./config";

export interface QueuedOperation {
  id: string;
  type: "save" | "sync";
  collection?: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

// Get queued operations from localStorage
export function getQueuedOperations(): QueuedOperation[] {
  try {
    const stored = localStorage.getItem(appConfig.offlineQueueKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse queued operations:", error);
    return [];
  }
}

// Add operation to queue
export function queueOperation(op: Omit<QueuedOperation, "id" | "timestamp" | "retryCount">) {
  const operations = getQueuedOperations();
  
  // Limit queue size to prevent localStorage overflow
  if (operations.length >= appConfig.maxQueueSize) {
    // Remove oldest operations
    operations.shift();
  }
  
  operations.push({
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retryCount: 0,
  });
  
  try {
    localStorage.setItem(appConfig.offlineQueueKey, JSON.stringify(operations));
  } catch (error) {
    console.error("Failed to queue operation:", error);
  }
}

// Remove operation from queue
export function removeFromQueue(id: string) {
  const operations = getQueuedOperations().filter(op => op.id !== id);
  try {
    localStorage.setItem(appConfig.offlineQueueKey, JSON.stringify(operations));
  } catch (error) {
    console.error("Failed to remove from queue:", error);
  }
}

// Clear entire queue
export function clearQueue() {
  try {
    localStorage.removeItem(appConfig.offlineQueueKey);
  } catch (error) {
    console.error("Failed to clear queue:", error);
  }
}

// Update retry count
export function incrementRetryCount(id: string) {
  const operations = getQueuedOperations().map(op => 
    op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op
  );
  try {
    localStorage.setItem(appConfig.offlineQueueKey, JSON.stringify(operations));
  } catch (error) {
    console.error("Failed to update retry count:", error);
  }
}

// Check if operation should be retried
export function shouldRetry(op: QueuedOperation): boolean {
  return op.retryCount < appConfig.maxRetries;
}
