# Auto Registration

`PBinJ` provides automatic registration capabilities for both constructors and factories, making dependency management more convenient and reducing boilerplate code.

## Constructor Auto Registration

### Basic Auto Registration

When a class is used as a dependency without explicit registration, PBinJ will automatically register it:

```typescript
import { pbj, context } from "@pbinj/pbj";

class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

// No explicit registration needed
class UserService {
  constructor(private logger = pbj(LoggerService)) {}

  createUser() {
    this.logger.log("Creating user...");
  }
}

// LoggerService is automatically registered
const userService = context.resolve(UserService);
```

## Factory Auto Registration

### Basic Factory Auto Registration

Factories are automatically registered when used as dependencies:

```typescript
import { pbj, context, pbjKey } from "@pbinj/pbj";

interface DatabaseConnection {
  query(sql: string): Promise<any>;
}

const dbFactory = () => {
  return {
    query: async (sql: string) => {
      // Implementation
    },
  };
};

// Factory is automatically registered
class Repository {
  constructor(private db = pbj(dbFactory)) {}
}
```

### Factory with Dependencies

Auto-registered factories can use other dependencies:

```typescript
import { pbj, context } from "@pbinj/pbj";

class ConfigService {
  constructor(readonly dbUrl = "postgres://localhost:5432") {}
}

const createDatabase = (config = pbj(ConfigService)) => {
  return {
    connect: async () => {
      // Use config.dbUrl
    },
  };
};

// Both ConfigService and createDatabase are auto-registered
class UserRepository {
  constructor(private db = pbj(createDatabase)) {}
}
```

## Conditional Auto Registration

### Environment-based Registration

Auto registration can be combined with conditional logic:

```typescript
import { pbj, context, pbjKey } from "@pbinj/pbj";

interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const cacheKey = pbjKey<Cache>("cache");

const createCache = (config = pbj(ConfigService)) => {
  if (config.environment === "production") {
    return new RedisCache(config.redisUrl);
  }
  return new MemoryCache();
};

// Cache implementation is auto-selected based on environment
class CacheService {
  constructor(private cache = pbj(createCache)) {}
}
```

## Scoped Auto Registration

### 1. Factory Return Types

Be explicit about factory return types:

```typescript
import { pbj, context } from "@pbinj/pbj";

interface Logger {
  log(message: string): void;
}

const createLogger = (): Logger => {
  return {
    log: (message) => console.log(message),
  };
};

// Type-safe auto registration
class Service {
  constructor(private logger = pbj(createLogger)) {}
}
```

### 3. Testing Considerations

Override auto-registered services in tests:

```typescript
import { context } from "@pbinj/pbj";

describe("UserService", () => {
  beforeEach(() => {
    // Override auto-registered dependencies
    context.register(LoggerService, {
      log: vi.fn(),
    });
  });

  it("should create user", () => {
    const userService = context.resolve(UserService);
    // Test with mocked dependencies
  });
});
```

## Limitations

### Circular Dependencies

Auto registration doesn't prevent circular dependencies, but does try to resolve them:

```typescript
// ❌ Bad: Circular dependency with auto registration
class ServiceA {
  constructor(private b = pbj(ServiceB)) {}
}

class ServiceB {
  constructor(private a = pbj(ServiceA)) {}
}

// ✅ Good: Use events or restructure
class ServiceA {
  constructor(private events = pbj(EventBus)) {}
}
```
