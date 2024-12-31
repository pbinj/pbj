# Constructor Injection

Constructor injection is the primary method of dependency injection in PBinJ. It provides a clean, type-safe way to declare and use dependencies.

## Basic Usage

The most basic form of constructor injection uses the `pbj()` function in constructor parameters:

```typescript
import { pbj } from "@pbinj/pbj";

class UserService {
  constructor(
    private logger = pbj(LoggerService),
    private database = pbj(DatabaseService)
  ) {}
}
```

## Type Safety

PBinJ provides full type safety for constructor injection. TypeScript will infer the correct types from your services:

```typescript
import { pbj } from "@pbinj/pbj";

class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}

class UserService {
  constructor(private logger = pbj(LoggerService)) {
    // TypeScript knows logger has a log() method
    this.logger.log("UserService initialized");
  }
}
```

## Optional Dependencies

Dependencies are optional by default. You can handle cases where a dependency might not be available:

```typescript
import { pbj } from "@pbinj/pbj";

class AnalyticsService {
  constructor(
    private logger = pbj(LoggerService),
    private metrics = pbj(MetricsService)
  ) {}

  trackEvent(name: string) {
    this.logger.log(`Tracking: ${name}`);
    // Safely handle optional dependency
    this.metrics?.record(name);
  }
}
```

To make a dependency required, you can use the `service.withOptional(false)` modifier:
@pbinj

```typescript
import { context } from "@pbinj/pbj";
class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}
//This will throw an error if LoggerService is not registered
context.register(LoggerService).withOptional(false);
```

## Factory Dependencies

You can inject factory functions that create instances with additional parameters:

```typescript
import { pbj, context } from "@pbinj/pbj";

class ConfigService {
  constructor(readonly dbConnectionString = "postgres://localhost:5432") {}
}

class DatabaseConnection {
  constructor(private connectionString: string) {}
}

// Register with a factory
context.register(DatabaseConnection, (config = pbj(ConfigService)) => {
  return new DatabaseConnection(config.dbConnectionString);
});

class UserRepository {
  constructor(private db = pbj(DatabaseConnection)) {}
}
```

## Multiple Implementations

Use `pbjKey` to manage multiple implementations of the same interface:

```typescript

import { pbj, pbjKey } from "@pbinj/pbj";

interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const memoryCache = pbjKey<Cache>("memory-cache");
const redisCache@pbinjy<Cache>("redis-cache");

declare module "@pbinj/pbj" {
  interface Registry {
    [memoryCache]: Cache;
    [redisCache]: Cache;
  }
}

class CacheService {
  constructor(
    private primary = pbj(redisCache),
    private fallback = pbj(memoryCache)
  ) {}

  async get(key: string): Promise<string | null> {
    return (await this.primary.get(key)) ?? (await this.fallback.get(key));
  }
}
```

## Best Practices

1. **Interface Keys**: Use `pbjKey` for interfaces and abstract classes:

   ```typescript
   interface ILogger {
     log(message: string): void;
   }

   const loggerKey = pbjKey<ILogger>("logger");
   ```


## Common Patterns

### Configuration Injection

```typescript
import { env, envRequired } from "@pbinj/pbj/env";
import { pbj } from "@pbinj/pbj";

class ConfigService {
  constructor(
    readonly apiUrl = env("API_URL", "http://localhost:3000"),
    readonly apiKey = envRequired("API_KEY")
  ) {}
}

class ApiClient {
  constructor(private config = pbj(ConfigService)) {}

  async request(path: string) {
    return fetch(`${this.config.apiUrl}${path}`, {
      headers: { Authorization: this.config.apiKey },
    });
  }
}
```

### Service Composition

```typescript
import { pbj } from "@pbinj/pbj";

class UserController {
  constructor(
    private users = pbj(UserService),
    private auth = pbj(AuthService)
  ) {}

  async getUser(id: string) {
    if (!this.auth.isAuthenticated()) {
      throw new Error("Unauthorized");
    }
    return this.users.getUser(id);
  }
}
```

@pbinj

## Testing

Constructor injection makes testing easier by allowing you to mock dependencies:

```typescript
import { context } from "@pbinj/pbj";
import {describe, it} from 'vitest';

describe("UserService", () => {
  it("should create user", async () => {
    // Mock dependencies
    const mockLogger = { log: vi.fn() };
    const mockDb = { saveUser: vi.fn() };

    // Register mocks
    context.register(loggerKey, mockLogger);
    context.register(dbKey, mockDb);

    // Test the service
    const userService = context.resolve(UserService);
    await userService.createUser({ name: "Test" });

    expect(mockLogger.log).toHaveBeenCalled();
    expect(mockDb.saveUser).toHaveBeenCalled();
  });
});

```