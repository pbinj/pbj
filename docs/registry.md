# Registry and Module Augmentation

The PBinJ registry system uses TypeScript's module augmentation to provide type safety for your dependency injection. This allows you to define the types of your services at compile time and get full type checking and IntelliSense support.

## Basic Registry Augmentation

### Declaring Service Types

To register your service types with PBinJ, augment the `Registry` interface:

```typescript
import { pbjKey } from "@pbinj/pbj";

// Define your service
interface DatabaseService {
  connect(): Promise<void>;
  query(sql: string): Promise<any>;
}

// Create a key
const dbKey = Symbol("DatabaseService");

// Augment the registry
declare module "@pbinj/pbj" {
  interface Registry {
    [dbKey]: DatabaseService;
  }
}
```

## Type Safety Features

### Constructor Registration

```typescript
class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}

declare module "@pbinj/pbj" {
  interface Registry {
    [typeof LoggerService]: InstanceType<typeof LoggerService>;
  }
}

// Type-safe registration
context.register(LoggerService);
```

### Factory Registration

```typescript
interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const cacheKey = pbjKey<CacheService>("cache");

declare module "@pbinj/pbj" {
  interface Registry {
    [cacheKey]: CacheService;
  }
}

// Type-safe factory registration
context.register(cacheKey, (config = pbj(ConfigService)) => {
  return new RedisCacheService(config.redisUrl);
});
```

## Advanced Usage

### Multiple Service Implementations

```typescript
interface AuthProvider {
  authenticate(token: string): Promise<boolean>;
}

const localAuthKey = pbjKey<AuthProvider>("local-auth");
const oauthKey = pbjKey<AuthProvider>("oauth");

declare module "@pbinj/pbj" {
  interface Registry {
    [localAuthKey]: AuthProvider;
    [oauthKey]: AuthProvider;
  }
}
```

### Generic Services

```typescript
interface Repository<T> {
  findById(id: string): Promise<T>;
  save(entity: T): Promise<void>;
}

interface User {
  id: string;
  name: string;
}

const userRepoKey = pbjKey<Repository<User>>("user-repository");

declare module "@pbinj/pbj" {
  interface Registry {
    [userRepoKey]: Repository<User>;
  }
}
```

## Best Practices

### 1. Centralize Registry Declarations

Create a dedicated types file for your registry declarations:

```typescript
// types/registry.ts
import { pbjKey } from "@pbinj/pbj";
import type { UserService, AuthService, LoggerService } from "../services";

export const userServiceKey = pbjKey<UserService>("user");
export const authServiceKey = pbjKey<AuthService>("auth");
export const loggerServiceKey = pbjKey<LoggerService>("logger");

declare module "@pbinj/pbj" {
  interface Registry {
    [userServiceKey]: UserService;
    [authServiceKey]: AuthService;
    [loggerServiceKey]: LoggerService;
  }
}
```

### 2. Use Symbol Service Keys

```typescript
// services/database/types.ts
export const dbServiceSymbol = Symbol("DatabaseService");

declare module "@pbinj/pbj" {
  interface Registry {
    [dbServiceSymbol]: DatabaseService;
  }
}
```

### 3. Group Related Services

```typescript
// features/auth/types.ts
export const authKeys = {
  service: pbjKey<AuthService>("auth-service"),
  provider: pbjKey<AuthProvider>("auth-provider"),
  cache: pbjKey<AuthCache>("auth-cache"),
} as const;

declare module "@pbinj/pbj" {
  interface Registry {
    [authKeys.service]: AuthService;
    [authKeys.provider]: AuthProvider;
    [authKeys.cache]: AuthCache;
  }
}
```

### 4. Document Service Contracts

```typescript
/**
 * Represents a caching service for the application
 * @interface CacheService
 */
interface CacheService {
  /**
   * Retrieves a value from cache
   * @param key - The cache key
   * @returns The cached value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Stores a value in cache
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds
   */
  set(key: string, value: string, ttl?: number): Promise<void>;
}

declare module "@pbinj/pbj" {
  interface Registry {
    [cacheServiceKey]: CacheService;
  }
}
```

## Common Patterns

### Factory with Dependencies

```typescript
interface Config {
  apiUrl: string;
  apiKey: string;
}

interface ApiClient {
  get(path: string): Promise<any>;
  post(path: string, data: any): Promise<any>;
}

const configKey = pbjKey<Config>("config");
const apiClientKey = pbjKey<ApiClient>("api-client");

declare module "@pbinj/pbj" {
  interface Registry {
    [configKey]: Config;
    [apiClientKey]: ApiClient;
  }
}

// Type-safe factory with dependencies
context.register(
  apiClientKey,
  (config = pbj(configKey), logger = pbj(LoggerService)) => {
    return new ApiClientImpl(config, logger);
  }
);
```

### Conditional Registration

```typescript
interface EmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

const emailKey = pbjKey<EmailProvider>("email");

declare module "@pbinj/pbj" {
  interface Registry {
    [emailKey]: EmailProvider;
  }
}

// Register different implementations based on environment
if (process.env.NODE_ENV === "production") {
  context.register(emailKey, () => new AwsEmailProvider());
} else {
  context.register(emailKey, () => new MockEmailProvider());
}
```

### Testing Support

```typescript
// test/mocks/registry.ts
declare module "@pbinj/pbj" {
  interface Registry {
    [dbKey]: jest.Mocked<DatabaseService>;
    [authKey]: jest.Mocked<AuthService>;
  }
}

// test/setup.ts
context.register(dbKey, () => createMock<DatabaseService>());
context.register(authKey, () => createMock<AuthService>());
```

```
</augment_code_snippet>

This documentation covers module augmentation in PBinJ's registry system, including basic usage, type safety features, advanced patterns, and best practices for maintaining a type-safe dependency injection system.
```
