# Factory Injection

Factory injection in PBinJ allows you to create instances with runtime parameters and complex initialization logic. This pattern is particularly useful when services require configuration or when you need different instances based on runtime conditions.

## Basic Factory Usage

Register a factory function instead of a class:

```typescript
import { pbj, context, pbjKey } from "@pbinj/pbj";

// Define a service with configuration
class DatabaseConnection {
  constructor(
    private host: string,
    private port: number
  ) {}
}

// Register with a factory function
context.register(DatabaseConnection, (config = pbj(ConfigService)) => {
  return new DatabaseConnection(config.dbHost, config.dbPort);
});
```

## Using PBinJKeys with Factories

For better type safety, use `pbjKey` with your factories:

```typescript
interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const cacheKey = pbjKey<Cache>("cache");

// Register different implementations based on environment
context.register(cacheKey, (config = pbj(ConfigService)) => {
  if (config.environment === "production") {
    return new RedisCache(config.redisUrl);
  }
  return new MemoryCache();
});
```

## Factory Dependencies

Factories can depend on other services:

```typescript
class EmailService {
  constructor(
    private apiKey: string,
    private logger: LoggerService
  ) {}
}

context.register(
  EmailService,
  (config = pbj(ConfigService), logger = pbj(LoggerService)) => {
    return new EmailService(config.emailApiKey, logger);
  }
);
```

## Factory Patterns

### Conditional Creation

Create different implementations based on conditions:

```typescript
const loggerKey = pbjKey<Logger>("logger");

context.register(loggerKey, (config = pbj(ConfigService)) => {
  switch (config.environment) {
    case "production":
      return new CloudLogger(config.cloudApiKey);
    case "development":
      return new ConsoleLogger();
    case "test":
      return new TestLogger();
    default:
      return new NoopLogger();
  }
});
```

### Factory with Options

Pass configuration objects to factories:

```typescript
interface HttpClientOptions {
  baseUrl: string;
  timeout: number;
  retries: number;
}

const httpClientKey = pbjKey<HttpClient>("http-client");

context.register(
  httpClientKey,
  (
    config = pbj(ConfigService),
    logger = pbj(LoggerService),
    retries = pbj(RetriesService)
  ) => {
    return new HttpClient({ config, logger, retries }, logger);
  }
);
```

### Factory Composition

Compose multiple factories together:

```typescript
const apiClientKey = pbjKey<ApiClient>("api-client");

context.register(
  apiClientKey,
  (
    http = pbj(httpClientKey),
    auth = pbj(AuthService),
    cache = pbj(cacheKey)
  ) => {
    return new ApiClient({
      httpClient: http,
      authService: auth,
      cache: cache,
    });
  }
);
```

## Best Practices

1. **Use Type Safety**: Always define return types for factories:

   ```typescript
   // Good
   context.register(dbKey, (config: ConfigService): DatabaseConnection => {
     return new DatabaseConnection(config.dbUrl);
   });

   // Bad - Missing return type
   context.register(dbKey, (config) => {
     return new DatabaseConnection(config.dbUrl);
   });
   ```

2. **Default Parameters**: Use default parameters with `pbj()`:

   ```typescript
   // Good
   context.register(
     serviceKey,
     (config = pbj(ConfigService), logger = pbj(LoggerService)) => {
       return new Service(config, logger);
     }
   );
   ```

3. **Error Handling**: Handle factory initialization errors:
   ```typescript
   context.register(dbKey, async (config = pbj(ConfigService)) => {
     try {
       return await DatabaseConnection.create(config.dbUrl);
     } catch (error) {
       logger.error("Failed to create database connection", error);
       throw new ServiceInitializationError(error);
     }
   });
   ```

## Common Use Cases

### Connection Pools

```typescript
const poolKey = pbjKey<Pool>("database-pool");

context.register(poolKey, async (config = pbj(ConfigService)) => {
  const pool = await createPool({
    host: config.dbHost,
    port: config.dbPort,
    max: config.maxConnections,
    idleTimeout: config.idleTimeout,
  });

  // Clean up on application shutdown
  process.on("SIGTERM", () => pool.end());

  return pool;
});
```

### Feature Flags

```typescript
const featureKey = pbjKey<FeatureService>("features");

context.register(featureKey, (config = pbj(ConfigService)) => {
  return new FeatureService({
    enableNewUI: config.environment === "development",
    enableBetaFeatures: config.betaUsers.includes(config.currentUser),
    enableMetrics: config.environment === "production",
  });
});
```
