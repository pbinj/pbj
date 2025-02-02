# Getting Started with PBinJ

## Installation

Install like any other npm package:

```bash
$ npm install @pbinj/pbj
```

```bash
$ pnpm add @pbinj/pbj
```

```bash
$ yarn add @pbinj/pbj
```

## Basic Concepts

PBinJ is built around three core concepts:

- `context` - The container that manages your dependencies
- `pbj()` - The function used to inject dependencies
- `pbjKey` - Type-safe symbols for service registration



### 1. Service Registration

There are several ways to register services with PBinJ:

```typescript
import { pbj, context, pbjKey } from "@pbinj/pbj";
class DatabaseService {
  constructor(private connectionString: string) { }
  //...
}
// Method 1: Direct class registration
class LoggerService {
  log(message: string) {
    console.log(message);
  }
}
context.register(LoggerService);

// Method 2: Using pbjKey (recommended)
const dbServiceKey = pbjKey<DatabaseService>("database");
context.register(dbServiceKey, DatabaseService);

// Method 3: Factory registration
context.register(dbServiceKey, () => {
  return new DatabaseService("connection-string");
});
```

### 2. Dependency Injection

Inject dependencies using the `pbj()` function:

```typescript
import { pbj, pbjKey, context } from "@pbinj/pbj";

class UserService {
  // Constructor injection
  constructor(
    private logger = pbj(LoggerService),
    private db = pbj(dbServiceKey)
  ) {}

  async getUser(id: string) {
    this.logger.log(`Fetching user ${id}`);
    return this.db.findUser(id);
  }
}
```

### 3. Service Resolution

Resolve services using `context.resolve()`:

```typescript
import { context } from "@pbinj/pbj";

class UserService {
  // ...
}
context.register(UserService);
//... elsewhere

const userService = context.resolve(UserService);
```

## Type Safety

PBinJ provides full TypeScript support. Define your registry types for better type inference, or use the `pbjKey`:

```typescript
declare module "@pbinj/pbj" {
  export interface Registry {
    [dbServiceKey]: DatabaseService;
  }
}
```

## Environment Variables

PBinJ includes built-in support for environment variables:

```typescript
import { env, envRequired } from "@pbinj/pbj/env";

class ConfigService {
  // Optional environment variable with default
  readonly apiUrl = env("API_URL", "http://localhost:3000");

  // Required environment variable
  readonly apiKey = envRequired("API_KEY");
}
```

## Async Context

For web applications, PBinJ supports request-scoped dependencies:

```ts
import { pbj, pbjKey, context } from "@pbinj/pbj";
import "@pbinj/pbj/scope";

const sessionKey = pbjKey<Session>("session");

// In your middleware
app.use((req, res, next) => {
  const requestScoped = context.scoped(sessionKey);
  requestScoped(next, getCurrentSession());
});

// In your service
class AuthService {
  constructor(private session = pbj(sessionKey)) {}

  isAuthenticated() {
    return Boolean(this.session?.user);
  }
}
```

## Best Practices

1. Use `pbjKey` for service registration:

   ```ts
   const loggerKey = pbjKey<LoggerService>("logger");
   ```

2. Register services at application startup:

   ```ts
   export function register() {
     context.register(loggerKey, LoggerService);
     context.register(dbKey, DatabaseService);
   }
   ```

3. Use factory functions for configurable services:

   ```ts
   context.register(dbKey, (config = pbj(ConfigService)) => {
     return new DatabaseService(config.connectionString);
   });
   ```

4. Keep services focused and follow single responsibility principle:
   ```ts
   class UserService {
     constructor(
       private db = pbj(dbKey),
       private logger = pbj(loggerKey),
       private auth = pbj(authKey)
     ) {}
   }
   ```

## Next Steps

- Explore the [examples](https://github.com/pbinj/pbj/tree/main/examples) for real-world usage
- Read the [API documentation](https://pbinj.github.io/pbj) for detailed information
- Check out integration examples with popular frameworks:
  - Express
  - Drizzle ORM
  - Auth.js
