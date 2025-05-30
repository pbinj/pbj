# ListOf

The `listOf` function is a powerful feature in PBinJ that allows you to retrieve all instances of a specific service type or tagged with a specific key. It supports inheritance and factory patterns, making it ideal for plugin systems or collecting related services. `listOf` is a proxy, and will automatically update when a dependency changes.

## Basic Usage

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";
class BaseService {}
class MyService extends BaseService {}

context.register(MyService);

// Using Class type
const services = context.listOf(BaseService);
```

## Features

### Tag-based Collection

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";

interface LoggerService {
  log(message: string): void;
}

const loggerKey = pbjKey<LoggerService>("logger");

// Register multiple services with the same tag
class ConsoleLogger {
  log(message: string) {
    console.log(message);
  }
}

class FileLogger {
  log(message: string) {
    /* log to file */
  }
}

const ctx = context;
ctx.register(ConsoleLogger).withTags(loggerKey);
ctx.register(FileLogger).withTags(loggerKey);

// Get all loggers
const loggers: LoggerService[] = ctx.listOf(loggerKey);
loggers.forEach((logger) => logger.log("Hello"));
```

### Inheritance-based Collection

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";

class BasePlugin {
  abstract execute(): void;
}

class PluginA extends BasePlugin {
  execute() {
    console.log("Plugin A");
  }
}

class PluginB extends BasePlugin {
  execute() {
    console.log("Plugin B");
  }
}

context.register(PluginA);
context.register(PluginB);

// Get all plugins that inherit from BasePlugin
context.listOf(BasePlugin).forEach((plugin) => plugin.execute());
```

### Factory-based Collection

```typescript
import { pbj, pbjKey, context as ctx } from "@pbinj/pbj";

interface Handler {
  handle(data: any): void;
}

const handlerFactory = () => ({
  handle: (data: any) => console.log(data),
});

ctx.register(pbjKey("handler-a"), handlerFactory);
ctx.register(pbjKey("handler-b"), handlerFactory);
ctx.register(handlerFactory);

// Get all instances created by the factory
const handlers = ctx.listOf(handlerFactory);
handlers.forEach((handler) => handler.handle("test"));
```

## Type Safety

The `listOf` function maintains type safety through the registry:

```typescript
import { pbj, pbjKey, context as ctx } from "@pbinj/pbj";

interface Plugin {
  name: string;
  execute(): void;
}

const pluginKey = pbjKey<Plugin>("plugin");

// Type-safe registration
ctx
  .register(pluginKey, {
    name: "test",
    execute: () => console.log("executing"),
  })
  .withTags(pluginKey);

// Type-safe retrieval
const plugins: Plugin[] = ctx.listOf(pluginKey);
```

## Common Use Cases

### Plugin System

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";

interface Plugin {
  name: string;
  initialize(): void;
}

const pluginKey = pbjKey<Plugin>("plugin");

class PluginManager {
  constructor(private pluigns = context.listOf(pluginKey)) {}

  initializePlugins() {
    for (const plugin of this.plugins) {
      plugin.initialize();
    }
  }
}
```

### Event Handlers

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";

interface EventHandler {
  event: string;
  handle(data: any): void;
}

const handlerKey = pbjKey<EventHandler>("event-handler");

class EventBus {
  constructor(private handlers = context.listOf(handlerKey)) {}

  emit(event: string, data: any) {
    this.handlers
      .filter((h) => h.event === event)
      .forEach((h) => h.handle(data));
  }
}
```

### Middleware Chain

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";

interface Middleware {
  order: number;
  process(data: any, next: () => void): void;
}

const middlewareKey = pbjKey<Middleware>("middleware");

class MiddlewareChain {
  constructor(private ctx = context) {}

  execute(data: any) {
    const middleware = this.ctx
      .listOf(middlewareKey)
      .sort((a, b) => a.order - b.order);

    let index = 0;
    const next = () => {
      if (index < middleware.length) {
        middleware[index++].process(data, next);
      }
    };

    next();
  }
}
```

## Best Practices

1. **Use Tags for Flexible Grouping**

   ```typescript
   import { pbjKey, context } from "@pbinj/pbj";

   interface HttpHandler {}

   const httpHandlerKey = pbjKey<HttpHandler>("http-handler");
   const adminHandlerKey = pbjKey<HttpHandler>("admin-handler");

   class UserHandler implements HttpHandler {
     // implementation
   }

   // Register with multiple tags
   ctx.register(UserHandler).withTags(httpHandlerKey, adminHandlerKey);
   ```

2. **Combine with Factory Pattern**

   ```typescript
   import { pbjKey, context } from "@pbinj/pbj";

   interface Validator {
     type: string;
     validate(data: any): boolean;
   }

   const validatorKey = pbjKey<Validator>("validator");

   const createValidator = (type: string) => ({
     type,
     validate() {
       //...
       return true;
     },
   });

   ctx
     .register(pbjKey("email"), () => createValidator("email"))
     .withTags(validatorKey);
   ctx
     .register(pbjKey("phone"), () => createValidator("phone"))
     .withTags(validatorKey);
   ```

3. **Order Management**

   ```typescript
   import { pbjKey, context } from "@pbinj/pbj";

   interface OrderedPlugin {
     order: number;
     execute(): void;
   }

   const pluginKey = pbjKey<OrderedPlugin>("plugin");

   class PluginOrchestrator {
     constructor(
       private ctx = context,
       private plugins = ctx.listOf(pluginKey),
     ) {}

     executeInOrder() {
       this.plugins
         .toSorted(({ order: a }, { order: b }) => a - b)
         .forEach((p) => p.execute());
     }
   }
   ```

4. **Dynamic Registration**

   ```typescript
   import { pbjKey, context } from "@pbinj/pbj";

   interface Feature {}

   const featureKey = pbjKey<Feature>("feature");

   class FeatureRegistry {
     constructor(
       private ctx = context,
       public features = ctx.listOf(featureKey),
     ) {}
     registerFeature(feature: Feature) {
       return this.ctx.register(feature).withTags(featureKey);
     }
   }
   ```
