# Tags in PBinJ

Tags provide a way to group and retrieve related services. They're particularly useful for plugin systems, feature modules, and collecting related services.

## Basic Usage

```typescript
import { context, pbjKey } from "@pbinj/pbj";

// Define a tag key
const pluginKey = pbjKey<Plugin>("plugin");

// Register services with tags
context.register(AuthPlugin).withTags("plugin");
context.register(LoggingPlugin).withTags("plugin");
context.register(MetricsPlugin).withTags("plugin");

// Retrieve all tagged services
const plugins = context.listOf("plugin");
```

## Multiple Tags

```typescript
// Register with multiple tags
context.register(UserService).withTags("service", "user", "core");

// Services can be retrieved by any of their tags
const services = context.listOf("service");
const userServices = context.listOf("user");
```

## Type-Safe Tags

```typescript
interface Handler {
  handle(request: Request): Response;
}

// Create a typed tag key
const handlerKey = pbjKey<Handler>("handler");

// Register with type-safe tag
context.register(AuthHandler).withTags(handlerKey);

context.register(LoggingHandler).withTags(handlerKey);

// Type-safe retrieval
const handlers: Handler[] = context.listOf(handlerKey);
```

## Common Use Cases

### Plugin System

```typescript
interface Plugin {
  name: string;
  initialize(): void;
}

const pluginKey = pbjKey<Plugin>("plugin");

class PluginManager {
  constructor(private plugins = context.listOf(pluginKey)) {
    // Initialize all plugins
    plugins.forEach((plugin) => plugin.initialize());
  }
}
```

### Feature Modules

```typescript
interface Feature {
  enabled: boolean;
  setup(): void;
}

const featureKey = pbjKey<Feature>("feature");

// Register features
context.register(DarkModeFeature).withTags(featureKey);
context.register(NotificationsFeature).withTags(featureKey);

// Setup enabled features
const features = context.listOf(featureKey);
features
  .filter((feature) => feature.enabled)
  .forEach((feature) => feature.setup());
```

### HTTP Handlers

```typescript
interface RouteHandler {
  path: string;
  method: string;
  handle(req: Request): Response;
}

const routeKey = pbjKey<RouteHandler>("route");

// Register routes
context.register(UserHandler).withTags(routeKey);
context.register(AuthHandler).withTags(routeKey);

// Setup routes
const routes = context.listOf(routeKey);
routes.forEach((route) => {
  app.use(route.path, route.handle);
});
```

## Best Practices

1. **Use Type-Safe Keys**: Prefer `pbjKey<T>` over string literals
2. **Consistent Naming**: Use clear, consistent tag names
3. **Documentation**: Document tag purposes and expected interfaces
4. **Validation**: Validate tagged services meet required interfaces

## Tips

- Tags are not hierarchical - use separate tags for hierarchical relationships
- Services can have multiple tags
- Tags are global - use unique names to avoid conflicts
- Use `listOf()` to retrieve all services with a specific tag