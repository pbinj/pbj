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
export const dbKey:unique symbol = Symbol() ;

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
import { context } from "@pbinj/pbj";

class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}
const loggerKey:unique symbol = Symbol();

declare module "@pbinj/pbj" {
  interface Registry {
    [loggerKey]: InstanceType<typeof LoggerService>;
  }
}

// Type-safe registration
context.register(LoggerService);
```

### Factory Registration

```typescript
import { pbjKey , context} from "@pbinj/pbj";

interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const cacheKey:unique symbol = pbjKey<CacheService>("cache");

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
import { pbjKey } from "@pbinj/pbj";

interface AuthProvider {
  authenticate(token: string): Promise<boolean>;
}

const localAuthKey:unique symbol = pbjKey<AuthProvider>("local-auth");
const oauthKey:unique symbol = pbjKey<AuthProvider>("oauth");

declare module "@pbinj/pbj" {
  interface Registry {
    [localAuthKey]: AuthProvider;
    [oauthKey]: AuthProvider;
  }
}
```

### Generic Services

```typescript
import { pbjKey } from "@pbinj/pbj";

interface Repository<T> {
  findById(id: string): Promise<T>;
  save(entity: T): Promise<void>;
}

interface User {
  id: string;
  name: string;
}

const userRepoKey:unique symbol = Symbol();

declare module "@pbinj/pbj" {
  interface Registry {
    [userRepoKey]: Repository<User>;
  }
}
```

## Best Practices

### 1. Centralize Registry Declarations

Create a dedicated types file for your registry declarations:

```ts
// types/registry.ts
import { pbjKey } from "@pbinj/pbj";
import type { UserService, AuthService, LoggerService } from "/services";

export const userServiceKey:unique symbol = Symbol();
export const authServiceKey:unique symbol = Symbol();
export const loggerServiceKey:unique symbol = Symbol();

declare module "@pbinj/pbj" {
  interface Registry {
    [userServiceKey]: UserService;
    [authServiceKey]: AuthService;
    [loggerServiceKey]: LoggerService;
  }
}
```

### 2. Use Symbol Service Keys

```ts
// services/database/types.ts
export const dbServiceSymbol:unique symbol = Symbol("DatabaseService");

declare module "@pbinj/pbj" {
  interface Registry {
    [dbServiceSymbol]: DatabaseService;
  }
}
```

### 3. Document Service Contracts

```ts
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
const cacheServiceKey:unique symbol = pbjKey<CacheService>("cache");

declare module "@pbinj/pbj" {
  interface Registry {
    [cacheServiceKey]: CacheService;
  }
}
```

## Common Patterns

### Factory with Dependencies

```typescript
import { context, pbj, pbjKey } from "@pbinj/pbj";


interface Config {
  apiUrl: string;
  apiKey: string;
}

interface ApiClient {
  get(path: string): Promise<any>;
  post(path: string, data: any): Promise<any>;
}
class ApiClientImpl implements ApiClient {
  constructor(private config: Config, private logger: LoggerService) {}
  //...
  async get(path: string) {
    this.logger.log(`GET ${path}`);
    //...
  }
  async post(path: string, data: any) {
    this.logger.log(`POST ${path}`);
    //...
  }
}

const configKey = pbjKey<Config>("config");
const apiClientKey = pbjKey<ApiClient>("api-client");

declare module "@pbinj/pbj" {
  interface Registry {
    [configKey]: Config;
    [apiClientKey]: ApiClient;
  }
}
context.register(configKey, { apiUrl: "https://api.example.com", apiKey: "secret" });

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
import { pbjKey, context } from "@pbinj/pbj";

interface EmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

const emailKey:unique symbol = Symbol();

declare module "@pbinj/pbj" {
  interface Registry {
    [emailKey]: EmailProvider;
  }
}

class AwsEmailProvider implements EmailProvider {

  // ...
  async sendEmail(){};
}
class MockEmailProvider implements EmailProvider {
  // ...
  async sendEmail(){};
}

// Register different implementations based on environment
if (process.env.NODE_ENV === "production") {
  context.register(emailKey, () => new AwsEmailProvider());
} else {
  context.register(emailKey, () => new MockEmailProvider());
}
```

