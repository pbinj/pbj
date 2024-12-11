# Ideas

## Allow async parameters.

Currently async parameters are not supported. The only reasonable way
I can think to support them is before invoking the factory, set a flag to `throwIfUnresolved` each `pbj` would then throw if they are unresolved. When the pbj resolves, then the next pbj would fire, etc. This would allow us to capture the parameters, without invoking the body of the function.

The idea would go like.

- Pros:
  - All arguments would be captured.
  - We could support async parameters.
  - We could support async factories.
  - We could support async constructors.
- Cons:
  - Complexity
  - Would resolve async parameters serially.
  - Would require a lot of changes to the codebase.

```typescript
const parentService = ServiceDescription.#invoke;
try {
  ServiceDescription.#invoke = parentService;
  const result = service.invoke();
  if (result instanceof Promise && result.isPending) {
    throw new PBinJInvokeError(service, result);
  }
} catch (pbjInvokeError) {
  if (pbjInvokeError instanceof PBinJInvokeError) {
    //do something
    pbjInvokeError.then(() => {
      parentService.invoke();
    });
  } else {
    throw pbjInvokeError;
  }
}
```
