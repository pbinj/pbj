# Caveats and Limitations

When using PBinJ, it's important to understand certain limitations and behaviors that come from its proxy-based implementation. This guide covers common pitfalls and how to avoid them.

## Proxy Behavior

### Property Access

#### No Property Copying

PBinJ uses JavaScript Proxies, which means properties are accessed dynamically. The proxy doesn't keep copies of properties:

### Avoid Destructuring Dependencies

```typescript
class EmailService {
  constructor(private deps = pbj(Dependencies)) {}

  // ❌ Bad: Destructuring breaks proxy
  sendEmail() {
    const { logger, mailer } = this.deps;
    logger.log("Sending email"); // May fail
  }

  // ✅ Good: Keep proxy intact
  sendEmail() {
    this.deps.logger.log("Sending email");
    this.deps.mailer.send();
  }
}
```

### Spread Operator Limitations

The spread operator doesn't work well with proxies:

```typescript
class ConfigService {
  constructor(private config = pbj(AppConfig)) {}

  // ❌ Bad: Spread operator breaks proxy
  getFullConfig() {
    return { ...this.config };
  }

  // ✅ Good: Return specific properties
  getFullConfig() {
    return {
      apiUrl: this.config.apiUrl,
      timeout: this.config.timeout,
    };
  }
}
```

## Dependency Resolution

### Circular Dependencies

PBinJ can handle circular dependencies, but they should be avoided:

```typescript
// ❌ Bad: Circular dependency
class ServiceA {
  constructor(private b = pbj(ServiceB)) {}
}

class ServiceB {
  constructor(private a = pbj(ServiceA)) {}
}

// ✅ Good: Use events or restructure
class ServiceA {
  constructor(private eventBus = pbj(EventBus)) {}
}

class ServiceB {
  constructor(private eventBus = pbj(EventBus)) {}
}
```

### Scope Initialization

Services are initialized lazily, which can lead to unexpected async behavior:

## Type Safety

### Generic Types

Type inference with generics can be tricky:

```ts
// ❌ Bad: Generic type lost in proxy
class Repository<T> {
  constructor(private db = pbj(Database)) {}
}

// ✅ Good: Use specific type key
const userRepoKey = pbjKey<Repository<User>>("userRepo");
context.register(userRepoKey, new Repository<User>());
```

### Optional Dependencies

Be explicit about optional dependencies:

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";

// ❌ Bad: Implicit optional dependency
class Service {
  constructor(private logger = pbj(Logger)) {}
}

// ✅ Good: Explicit optional dependency
class Service {
  constructor(private logger: Logger | undefined = pbj(Logger)) {}
}
```

## Performance Considerations

### Proxy Overhead

Proxies add a small performance overhead:
Proxies keep references to their targets:

## Testing Considerations

### Mocking Proxies

Testing proxied services requires special consideration:

```
// ❌ Bad: Direct mock assignment
service.dependency = mockDependency;

// ✅ Good: Register mock with context
context.register(DependencyKey, mockDependency);
```

### Property Spying

Spying on proxy properties requires proper setup:

```
// ❌ Bad: Direct spy on proxy
const spy = jest.spyOn(service.logger, "log");

// ✅ Good: Register spy through context
const mockLogger = { log: jest.fn() };
context.register(LoggerKey, mockLogger);
```

## Best Practices to Avoid Issues

1. **Keep References**

```
// Always store proxy references
class Service {
  private readonly config = pbj(Config);
  private readonly logger = pbj(Logger);
}
```

2. **Avoid Object Manipulation**

```ts
// Don't manipulate proxy objects directly
const config = pbj(Config);
Object.assign(config, newValues); // ❌ Bad

// Instead, use proper registration
context.register(Config, newValues); // ✅ Good
```

3. **Type Safety**

```ts
// Always declare types in registry
declare module "@pbinj/pbj" {
  interface Registry {
    [ConfigKey]: Config;
    [LoggerKey]: Logger;
  }
}
```

4. **Async Handling**

```ts
// Use async factories for async initialization
context.register(DatabaseKey, async () => {
  const db = await Database.initialize();
  return db;
});
```

## Working with Native JavaScript Features

### Property Enumeration

Some native operations might not work as expected:

```ts
// ❌ Bad: Direct property enumeration
const config = pbj(Config);
Object.keys(config); // May not return expected keys

// ✅ Good: Use specific properties
const config = pbj(Config);
const keys = ["apiUrl", "timeout"];
const values = keys.map((key) => config[key]);
```

## Related Resources

- [JavaScript Proxy Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [TypeScript Generics Guide](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [PBinJ Examples](https://github.com/pbinj/pbj/tree/main/examples)
