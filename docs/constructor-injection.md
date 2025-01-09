# Constructor Injection

Constructor injection is the primary method of dependency injection in PBinJ. It provides a clean, type-safe way to declare and use dependencies.

## Basic Usage

The most basic form of constructor injection uses the `pbj()` function in constructor parameters:

```typescript
//filename=/user-service.ts,title=User Service
import { pbj } from "@pbinj/pbj";
import { LoggerService, DatabaseService } from "/services";
export class User {
  constructor(public name: string) {}
}
export class UserService {
  constructor(
    private logger = pbj(LoggerService),
    private database = pbj(DatabaseService)
  ) {}

  async createUser(user: User) {
    this.logger.log(`Creating user: ${user.name}`);
    this.database.saveUser(user);
    return user;
  }
}
```

## Type Safety

PBinJ provides full type safety for constructor injection. TypeScript will infer the correct types from your services:

```typescript
//filename=/services.ts
import { pbj } from "@pbinj/pbj";

export class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}

export class UserService {
  constructor(private logger = pbj(LoggerService)) {
    // TypeScript knows logger has a log() method
    this.logger.log("UserService initialized");
  }
}
export class AuthService {
  constructor(private logger = pbj(LoggerService)) {
    // TypeScript knows logger has a log() method
    this.logger.log("AuthService initialized");
  }
}
export class DatabaseService {
  constructor(private logger = pbj(LoggerService)) {
    // TypeScript knows logger has a log() method
    this.logger.log("DatabaseService initialized");
  }
  query(sql: string): Promise<any> {
    // Implementation
    return null;
  }
}
```

## Optional Dependencies

Dependencies are optional by default. You can handle cases where a dependency might not be available:

```typescript
import { pbj } from "@pbinj/pbj";
class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}
class MetricsService {
  record(event: string): void {
    // Implementation
  }
}

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
import { pbj, context, pbjKey } from "@pbinj/pbj";

class ConfigService {
  constructor(public dbConnectionString = "postgres://localhost:5432") {}
}

class DatabaseConnection {
  constructor(private connectionString: string) {}
}
const databaseConnectionKey = pbjKey<DatabaseConnection>("database-connection");

// Register with a factory
context.register(databaseConnectionKey, (config = pbj(ConfigService)) => {
  return new DatabaseConnection(config.dbConnectionString);
});

class UserRepository {
  constructor(private db = pbj(DatabaseConnection)) {}
}
```

## Multiple Implementations

Use `pbjKey` to manage multiple implementations of the same interface:

```typescript
//filename=/cache.ts
import { pbj, pbjKey, context } from "@pbinj/pbj";

export interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
class MemoryCache implements Cache { /*...*/ async get(){ return null} async set(){}};

class RedisCache extends MemoryCache {/**... */}

export const memoryCache = pbjKey<Cache>("memory-cache");
export const redisCache = pbjKey<Cache>("redis-cache");

class CacheService {
  constructor(
    private primary = pbj(redisCache),
    private fallback = pbj(memoryCache)
  ) {}

  async get(key: string): Promise<string | null> {
    return (await this.primary.get(key)) ?? (await this.fallback.get(key));
  }
  async set(key: string, value: string): Promise<void> {
    await this.primary.set(key, value);
    await this.fallback.set(key, value);
  }
}
context.register(memoryCache, MemoryCache);
context.register(redisCache, RedisCache);
```

## Best Practices

1. **Interface Keys**: Use `pbjKey` for interfaces and abstract classes:

```typescript
   //filename=/interfaces.ts
   import { pbjKey } from "@pbinj/pbj";

   export interface IDatabase {
     query(sql: string): Promise<any>;
   }

   export interface ILogger {
     log(message: string): void;
   }

   export const loggerKey = pbjKey<ILogger>("logger");
   export const dbKey = pbjKey<IDatabase>("database");
   ```


## Common Patterns

### Configuration Injection

```typescript
//filename=/config.ts
import { env, envRequired } from "@pbinj/pbj/env";
import { pbj } from "@pbinj/pbj";

export class ConfigService {
  constructor(
    public readonly apiUrl = env("API_URL", "http://localhost:3000"),
    public readonly apiKey = envRequired("API_KEY")
  ) {}
}

export class ApiClient {
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
//filename=/user-controller.ts
import { pbj } from "@pbinj/pbj";
import { UserService, AuthService } from "/services";

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
//filename=/user-service.test.ts
import { describe, it, vi, expect } from 'vitest';
import { context } from "@pbinj/pbj";
import { UserService } from '/user-service';
import { type ILogger, loggerKey, dbKey } from '/interfaces';

describe("UserService", () => {
  it("should create user", async () => {
    // Mock dependencies
    const mockLogger = { log: vi.fn() };
    const mockDb = { query: vi.fn() };

    // Register mocks
    context.register(loggerKey, mockLogger);
    context.register(dbKey, mockDb);

    // Test the service
    const userService = context.resolve(UserService);
    await userService.createUser({ name: "Test" });

    expect(mockLogger.log).toHaveBeenCalled();
    expect(mockDb.query).toHaveBeenCalled();
  });
});

```