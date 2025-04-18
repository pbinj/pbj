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
  constructor(private logger: LoggerService) {
    logger.log("UserService initialized");
  }
}

context.register(UserService).withArgs(pbj(LoggerService));
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
class CacheService {}
class RedisCacheService extends CacheService {}
class InMemoryCacheService extends CacheService {}

// Environment-based registration
context.register(CacheService, (nodeEnv = env("NODE_ENV")) =>
  nodeEnv == "production"
    ? new RedisCacheService()
    : new InMemoryCacheService(),
);

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
  (config = pbj(ConfigService)) => new DatabaseService(config),
);
```

## Type-Safe Registration

### Using PBinJKey

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";

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
import { pbj, pbjKey, context } from "@pbinj/pbj";

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

class UserService {}

// Singleton (default)
context.register(UserService);

// New instance per resolution
context.register(UserService);

// Cached factory (singleton after first resolution)
context
  .register(UserService)
  .withCacheable()
  .withOptional()
  .withDescription("This is the user service")
  .withName("UserService");
```

### Tags and Metadata

```typescript
import { pbj, context } from "@pbinj/pbj";
class UserService {}
// Register with tags
context.register(UserService).withTags("service", "user");
```

1. **Testing**: Use manual registration to swap implementations in tests.

   ```typescript
   import { context } from "@pbinj/pbj";
   class DatabaseService {}
   class MockDatabaseService extends DatabaseService {}

   // In tests
   context.register(DatabaseService).withService(MockDatabaseService);
   ```

## Common Patterns

### Plugin Registration

```typescript
import { pbj, context, pbjKey } from "@pbinj/pbj";

interface Plugin {
  initialize(): void;
}

class AuthPlugin implements Plugin {
  initialize() {
    /* auth setup */
  }
}
class LoggingPlugin implements Plugin {
  initialize() {
    /* logging setup */
  }
}
class MetricsPlugin implements Plugin {
  initialize() {
    /* metrics setup */
  }
}

const pluginKey = pbjKey<Plugin[]>("plugins");

context.register(AuthPlugin).withTags(pluginKey);
context.register(LoggingPlugin).withTags(pluginKey);
context.register(MetricsPlugin).withTags(pluginKey);

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
