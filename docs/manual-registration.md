# Manual Registration

While PBinJ supports auto-registration, manual registration provides more control over how services are created and managed. This guide covers various manual registration patterns and best practices.

## Basic Registration

### Class Registration

```typescript
import { pbj, context } from "@pbinj/pbj";

class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

// Register the class directly
context.register(LoggerService);

// Or register with a specific instance
//context.register(LoggerService, ()=>new LoggerService());

// Use the service
class UserService {
  constructor(private logger:LoggerService)) {
    this.logger.log("UserService initialized");
  }
}
const userService = context.resolve(UserService, pbj(LoggerService));
```

### Factory Registration

```typescript
import { pbj, context, pbjKey } from "@pbinj/pbj";

// Define a factory function
const createDatabase = () => ({
  connect: async () => {
    // Database connection logic
  },
});

// Register using a factory
context.register(createDatabase);

// Or with a specific key
const dbKey = pbjKey<ReturnType<typeof createDatabase>>("database");
context.register(dbKey, createDatabase);
```

## Advanced Registration

### Conditional Registration

```typescript
import { pbj, context } from "@pbinj/pbj";
import { env } from "@pbinj/pbj/env";
}
// Environment-based registration
context.register(CacheService, (nodeEnv = env("NODE_ENV")) =>
nodeEnv == "production" ? new RedisCacheService() :  new InMemoryCacheService());

// Feature flag registration
const featureFlag = process.env.FEATURE_ENABLED === "true";
if (featureFlag) {
  context.register(FeatureService, new EnhancedFeatureService());
}
```

### Registration with Dependencies

```typescript
import { pbj, context } from "@pbinj/pbj";

class ConfigService {
  constructor(readonly dbUrl = process.env.DATABASE_URL) {}
}

class DatabaseService {
  constructor(private config: ConfigService) {}
}

// Register with explicit dependencies
context.register(
  DatabaseService,
  (config = pbj(ConfigService)) => new DatabaseService(config)
);
```

## Type-Safe Registration

### Using PBinJKey

```typescript
import { pbj, pbjKey } from "@pbinj/pbj";

interface MetricsService {
  track(event: string): void;
}

const metricsKey = pbjKey<MetricsService>("metrics");

// Type-safe registration
context.register(metricsKey, {
  track: (event) => console.log(event),
});

// Usage
class AnalyticsService {
  constructor(private metrics = pbj(metricsKey)) {
    this.metrics.track("AnalyticsService.init");
  }
}
```

### Module Augmentation

```typescript
import { pbj, pbjKey } from "@pbinj/pbj";

const configKey = pbjKey<Config>("config");

// Extend Registry type
declare module "@pbinj/pbj" {
  interface Registry {
    [configKey]: Config;
  }
}

// Now registration is type-safe
context.register(configKey, {
  apiUrl: "https://api.example.com",
});
```

## Registration Options

### Singleton vs Factory

```typescript
import { pbj, context } from "@pbinj/pbj";

// Singleton (default)
context.register(UserService);

// New instance per resolution
context.register(UserService);

// Cached factory (singleton after first resolution)
context
  .register(UserService)
  .withCachable()
  .withOptional()
  .withDescription("This is the user service")
  .withName("UserService");
```

### Tags and Metadata

```typescript
import { pbj, context } from "@pbinj/pbj";

// Register with tags
context.register(UserService).withTags("service", "user");

// Register with metadata
context.register(UserService).withMetadata({ version: "1.0.0" });
```

## Best Practices

1. **Explicit Dependencies**: Prefer explicit registration for core services to make dependencies clear.

   ```typescript
   context.register(CoreService, pbj(LoggerService), pbj(ConfigService));
   ```

2. **Configuration Management**: Use manual registration for configuration objects.

   ```typescript
   context.register(ConfigKey, {
     apiUrl: process.env.API_URL,
     timeout: parseInt(process.env.TIMEOUT ?? "5000"),
   });
   ```

3. **Testing**: Use manual registration to swap implementations in tests.

   ```typescript
   // In tests
   context.register(DatabaseService, new MockDatabaseService());
   ```

4. **Lifecycle Management**: Use registration hooks for cleanup.
   ```typescript
   context.register(DatabaseService).onDispose(async (service) => {
     await service.disconnect();
   });
   ```

## Common Patterns

### Plugin Registration

```typescript
import { pbj, context, pbjKey } from "@pbinj/pbj";

const pluginKey = pbjKey<Plugin[]>("plugins");

context.register(AuthPlugin).withTag(pluginKey);
context.register(LoggingPlugin).withTag(pluginKey);
context.register(MetricsPlugin).withTag(pluginKey);

// Access all plugins
class PluginManager {
  constructor(private plugins = context.listOf(pluginKey)) {
    this.plugins.forEach((plugin) => plugin.initialize());
  }
}
```

### Feature Toggles

```typescript
import { pbj, context, pbjKey } from "@pbinj/pbj";

interface FeatureFlag {
  newUI: boolean;
  beta: boolean;
}
const featureKey = pbjKey<FeatureFlag>("features");

// Register feature flags
context.register(featureKey, {
  newUI: process.env.ENABLE_NEW_UI === "true",
  beta: process.env.ENABLE_BETA === "true",
});
```
