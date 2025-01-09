# Tags in PBinJ

Tags provide a way to group and retrieve related services. They're particularly useful for plugin systems, feature modules, and collecting related services.

## Basic Usage

```typescript
import { context, pbjKey } from "@pbinj/pbj";
interface Plugin {
  initialize?(): void;
}
class AuthPlugin implements Plugin {
 
}
class LoggingPlugin implements Plugin {
 
}
class MetricsPlugin implements Plugin {
 
}
// Define a tag key
const pluginKey = pbjKey<Plugin>("plugin");

// Register services with tags
context.register(AuthPlugin).withTags(pluginKey);
context.register(LoggingPlugin).withTags(pluginKey);
context.register(MetricsPlugin).withTags(pluginKey);

// Retrieve all tagged services
const plugins = context.listOf(pluginKey);
```

## Multiple Tags

```typescript

import { pbjKey, context } from "@pbinj/pbj";
class UserService {
  id(){
    return 1;
  }
  //...
}
const userServiceKey = pbjKey<UserService>("user-service");
const idableKey = pbjKey<{id:number}>("core");

// Register with multiple tags
context.register(UserService).withTags(userServiceKey, idableKey);

// Services can be retrieved by any of their tags
const services = context.listOf(idableKey);
const userServices = context.listOf(userServiceKey);
```

## Type-Safe Tags

```typescript
import { pbjKey, context } from "@pbinj/pbj";

interface Handler {
  handle(request: Request): Response;
}
class AuthHandler implements Handler {
  handle(request: Request) {
    // Handle auth requests
    return null as any;
  }
}
class LoggingHandler implements Handler {
  handle(request: Request) {
    // Handle logging requests
    return null as any;
  }
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
import { pbjKey, context } from "@pbinj/pbj";

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
import { pbjKey, context } from "@pbinj/pbj";

interface Feature {
  enabled: boolean;
  setup(): void;
}
class DarkModeFeature implements Feature {
  enabled = true;
  setup() {
    // Enable dark mode
  }
}
class NotificationsFeature implements Feature {
  enabled = false;
  setup() {
    // Setup notifications
  }
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
import { pbjKey, context } from "@pbinj/pbj";

interface RouteHandler {
  path: string;
  method: string;
  handle(req: Request): Response;
}
class UserHandler implements RouteHandler {
  path = "/users";
  method = "GET";
  handle(req: Request) {
    // Handle user requests
    return null as any;
  }
}
class AuthHandler implements RouteHandler {
  path = "/auth";
  method = "POST";
  handle(req: Request) {
    // Handle auth requests
    return null as any;
  }
}

const routeKey = pbjKey<RouteHandler>("route");

// Register routes
context.register(UserHandler).withTags(routeKey);
context.register(AuthHandler).withTags(routeKey);

// Setup routes
const routes = context.listOf(routeKey);
routes.forEach((route) => {
 // app.use(route.path, route.handle);
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
