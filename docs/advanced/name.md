# Service Names in PBinJ

Service names provide a way to identify and debug services in your application. PBinJ automatically derives names from various sources, but also allows explicit naming through the `withName` method. However sometimes PBinJ can't figure out the name. In general it uses the symbol name or the class name. However unnamed annoymous functions are not named, so they will appear in the system as `<anonymous>`. In this case you can use a `withName` to name them. `<anonymous>` services

## Default Naming

PBinJ automatically derives service names from, symbol, pbjKey, class names, and function names:

```typescript
import { context, pbjKey } from "@pbinj/pbj";

// 1. From pbjKey
const loggerKey = pbjKey<LoggerService>("logger");
context.register(loggerKey); // name: "logger"

// 2. From class name
class UserService {}
context.register(UserService); // name: "UserService"

// 3. From function name
const myFactory = () => new Service();
context.register(myFactory); // name: "myFactory"

// 4. From symbol description
const serviceSymbol = Symbol("myService");
context.register(serviceSymbol); // name: "myService"

// 5. Anonymous functions
context.register(() => "value"); // name: "<anonymous>"
```

## Explicit Naming

Use `withName` to override the default name:

```typescript
// Override automatic naming
context.register(UserService).withName("CustomUserService");

// Name anonymous services
context.register(() => new Service()).withName("DynamicService");

// Name symbol-based services
context.register(serviceSymbol).withName("BetterServiceName");
```

## Names with Tags

Names are particularly useful when working with tagged services:
In general tags are a prefered way to group services.

```typescript
const pluginKey = pbjKey<Plugin>("plugin");

context.register(AuthPlugin).withName("Authentication").withTags(pluginKey);

context.register(LogPlugin).withName("Logging").withTags(pluginKey);

// Listen for specific services
context.onServiceAdded((...services) => {
  if (services.some((service) => service.hasTag(pluginKey))) {
    console.log(`Plugin registered: ${service.name}`);
  }
});
```

## Debugging with Names

Names are valuable for debugging and logging:

```typescript
class ServiceManager {
  constructor() {
    context.onServiceAdded((service) => {
      console.log(
        `Service ${service.name} was ${service.invalid ? "invalidated" : "registered"}`
      );
    });
  }
}

// Example output:
// Service Authentication was registered
// Service Logging was registered
// Service UserService was invalidated
```

## Best Practices

1. **Consistent Naming**: Use consistent naming conventions:

```typescript
// Good
context.register(authService).withName("AuthService");
context.register(dbService).withName("DatabaseService");

// Avoid
context.register(authService).withName("auth");
context.register(dbService).withName("DatabaseServiceImpl");
```

2. **Meaningful Names**: Choose descriptive names:

```typescript
// Good
context.register(factory).withName("UserRepositoryFactory");

// Avoid
context.register(factory).withName("f1");
```

## Tips

- Names should be unique within your application
- Use names to improve error messages and logging
- Names are useful for debugging dependency injection issues
- Consider adding version or environment information to names when needed
- Prefer tags over names for grouping services and locating services.
