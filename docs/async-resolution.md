# Async Resolution

The `resolveAsync` function in PBinJ allows for asynchronous resolution of dependencies.  This allows for services to be resolved asynchronously. 

## Usage

```typescript
import { context, pbjKey } from "@pbinj/pbj";
import "@pbinj/pbj/scope";

const asyncKey = pbjKey<Promise<string>>("async-value");

context.register(asyncKey, async () => {
  // Simulating an async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return "Async Result";
});

const result = await context.resolveAsync(asyncKey);
console.log(result); // Outputs: "Async Result"
```

## Function Signature

```typescript
resolveAsync<TKey extends PBinJKey<TRegistry>>(key: TKey): Promise<ValueOf<TRegistry, TKey>>
```

- `tkey`: The PBinJKey or symbol of the service to resolve.

## Description

The `context.resolveAsync` function is designed to handle the resolution of asynchronous dependencies within the PBinJ context. It's particularly useful when:

1. Resolving services that are registered with async factories.
2. Dealing with dependencies that rely on other async services.
3. Working with scoped contexts that may involve asynchronous operations.


This function ensures that all async operations in the dependency chain are properly awaited before returning the final resolved value.

## Error Handling

If any error occurs during the async resolution process, `resolveAsync` will reject the promise with the appropriate error. This includes both synchronous errors thrown during the resolution process and asynchronous errors from service factories.

## Best Practices

1. Always use `resolveAsync` when dealing with potentially asynchronous dependencies. Async services need to be cacheable.
2. Ensure that async services are properly registered using async factory functions.
3. Handle potential errors by wrapping `resolveAsync` calls in try-catch blocks or using `.catch()` on the returned promise.

## Example with Multiple Async Dependencies

```typescript
import { context, pbjKey } from "@pbinj/pbj";
import "@pbinj/pbj/scope";

const userDataKey = pbjKey<Promise<UserData>>("user-data");
const analyticsKey = pbjKey<Promise<AnalyticsService>>("analytics");

context.register(userDataKey, async () => {
  // Fetch user data asynchronously
  return await fetchUserData();
});

context.register(analyticsKey, async (userData = context.pbj(userDataKey)) => {
  // Initialize analytics service with user data
  return new AnalyticsService(await userData);
});

// Resolve the analytics service
const analytics = await context.resolveAsync(analyticsKey);
```

In this example, `resolveAsync` ensures that both the `userDataKey` and `analyticsKey` services are resolved in the correct order, waiting for each async operation to complete.