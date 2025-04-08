/**
 * A simplified AsyncLocalStorage implementation for browser environments.
 * This doesn't have the exact same semantics as Node's AsyncLocalStorage,
 * but provides the core functionality needed for PBJ.
 */
class BrowserAsyncStorage<T> {
  // Use a stack to track nested contexts
  private contextStack: T[] = [];

  /**
   * Get the current store
   */
  getStore(): T | undefined {
    return this.contextStack.length > 0
      ? this.contextStack[this.contextStack.length - 1]
      : undefined;
  }

  /**
   * Run a callback with a specific store context
   */
  run<R>(store: T, callback: () => R): R {
    // Push the new context to the stack
    this.contextStack.push(store);

    try {
      // Run the callback
      return callback();
    } finally {
      // Pop the context from the stack
      this.contextStack.pop();
    }
  }
}

export { BrowserAsyncStorage as AsyncLocalStorage };
