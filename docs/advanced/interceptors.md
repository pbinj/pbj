# Service Interceptors in PBinJ

Service interceptors allow you to add cross-cutting behavior to your services, such as logging, metrics, or error handling. This guide explains how to use the `withInterceptors` method on `ServiceDescriptor`.

## Basic Usage

```typescript
import { context } from "@pbinj/pbj";

class UserService {
  getUser(id: string) {
    return { id, name: "John" };
  }
}

context.register(UserService).withInterceptors((invoke) => {
  console.log("Before service invocation");
  const result = invoke();
  console.log("After service invocation");
  return result;
});
```

## Interceptor Function Type

```ts
type InterceptFn<T> = (invoke: () => T) => T;
```

The interceptor function receives:

- `invoke`: A function that calls the next interceptor or the service
- Returns the same type as the service method

## Common Patterns

### Error Handling

```typescript
import { context } from "@pbinj/pbj";

class UserService {
  getUser(id: string) {
    throw new Error("Failed to fetch user");
  }
}

context.register(UserService).withInterceptors((invoke) => {
  try {
    return invoke();
  } catch (error) {
    console.error("Service failed:", error);
    throw error;
  }
});
```

### Performance Monitoring

```typescript
import { context } from "@pbinj/pbj";
class UserService {
  getUser(id: string) {
    // ...
  }
}

context.register(UserService).withInterceptors((invoke) => {
  const start = performance.now();
  try {
    return invoke();
  } finally {
    const duration = performance.now() - start;
    console.log(`Service took ${duration}ms`);
  }
});
```

### Multiple Interceptors

```typescript
import { context } from "@pbinj/pbj";
class UserService {
  getUser(id: string) {
    // ...
  }
}

context.register(UserService).withInterceptors(
  // First interceptor (executes first)
  (invoke) => {
    console.log("Starting");
    const result = invoke();
    console.log("Completed");
    return result;
  },
  // Second interceptor (executes second)
  (invoke) => {
    const start = performance.now();
    const result = invoke();
    console.log(`Duration: ${performance.now() - start}ms`);
    return result;
  }
);
```

## Best Practices

1. **Keep Interceptors Focused**: Each interceptor should have a single responsibility.

```ts
// Good - Single responsibility
const loggingInterceptor = (invoke) => {
  console.log("Starting");
  const result = invoke();
  console.log("Completed");
  return result;
};

const metricsInterceptor = (invoke) => {
  const start = performance.now();
  const result = invoke();
  recordMetric(performance.now() - start);
  return result;
};

context
  .register(UserService)
  .withInterceptors(loggingInterceptor, metricsInterceptor);
```

2. **Error Handling**: Always consider error cases in interceptors.

```ts
const errorHandlingInterceptor = (invoke) => {
  try {
    return invoke();
  } catch (error) {
    // Handle or transform error
    throw new ServiceError(error);
  }
};
```

3. **Resource Cleanup**: Use try/finally for cleanup operations.

```ts
const resourceInterceptor = (invoke) => {
  const resource = acquireResource();
  try {
    return invoke();
  } finally {
    resource.release();
  }
};
```

## Integration Examples

### With Metrics (Prometheus)

```ts
import { Counter } from "prom-client";

const requestCounter = new Counter({
  name: "service_requests_total",
  help: "Total service requests",
});

context.register(UserService).withInterceptors((invoke) => {
  requestCounter.inc();
  return invoke();
});
```

### With Logging (Winston)

```ts
import { logger } from "./logger";

context.register(UserService).withInterceptors((invoke) => {
  logger.info("Service invocation started");
  try {
    const result = invoke();
    logger.info("Service completed successfully");
    return result;
  } catch (error) {
    logger.error("Service failed", { error });
    throw error;
  }
});
```

## Caveats

1. Interceptors are executed in the order they are added
2. Each interceptor must call `invoke()` to continue the chain
3. Return values should be preserved through the chain
