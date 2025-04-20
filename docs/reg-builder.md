# Registry Builder

The `RegBuilder` class provides a modular, type-safe way to create and compose dependency registries in PBinJ. This approach allows you to define reusable registry modules that can be combined and applied to contexts. It
 is accesed via the builder function.

This is a more advanced pattern that is optional to use.  It is meant for situations
where there are a lot of dependencies and you want to be able to compose them together.


## Basic Usage

```typescript
import { builder, context } from "@pbinj/pbj";

// Create a registry with core services
const coreRegistry = builder()
  .register("logger", console)
  .register("config", { apiUrl: "https://api.example.com" })
  .close();

// Create a context and apply the registry
coreRegistry.apply(context);

// Use the registered services
const logger = context.resolve("logger");
logger.log("Application started");
```

## Type Safety

Registry builders maintain full type safety through TypeScript's type system:

## Composing Registries

One of the key benefits of `RegBuilder` is the ability to compose registries:

```typescript
import { builder } from "@pbinj/pbj";

// Core services registry
const coreRegistry = builder()
  .register("logger", console)
  .register("config", { apiUrl: "https://api.example.com" }).close();

// Database registry that depends on core
const dbRegistry = builder()
  .register("database", { connect: () => console.log("Connected to DB") })
  .uses(coreRegistry).close();

// API registry that depends on both core and database
const apiRegistry = builder()
  .register("api", { fetch: (url: string) => console.log(`Fetching ${url}`) })
  .uses(dbRegistry).close();

// Create a context with all registries
apiRegistry.apply(context);
```

## Factory Registration

Register factories that can use other registered services:

```typescript
import { builder, context } from "@pbinj/pbj";

// Create a registry with dependencies
const registry = builder()
  .register("config", { dbUrl: "postgres://localhost:5432" })
  .register("logger", console);

// Register a factory that uses other services
const dbRegistry = registry.factory("database", 
  (config, logger) => {
    logger.log(`Connecting to ${config.dbUrl}`);
    return { 
      query: (sql: string) => console.log(`Executing: ${sql}`) 
    };
  }, 
  registry.ref("config"), 
  registry.ref("logger")
);

// Use the factory-created service
dbRegistry.close().apply(context);
const db = context.resolve("database");
db.query("SELECT * FROM users");
```

## Service Configuration

Configure services after registration:

```typescript
import { builder } from "@pbinj/pbj";

const registry = builder()
  .register("httpClient", { baseUrl: "https://api.example.com" });

// Configure the service
registry.configure("httpClient")
  .withDescription("HTTP client for API calls")
  .withTags("api", "http");
```

## Modular Application Structure

`builder` enables a modular application structure:

```typescript
// auth/registry.ts
export function createAuthRegistry() {
  return builder()
    .register("authService", { login: (user, pass) => true })
    .register("tokenService", { generate: () => "token" });
}

// users/registry.ts
export function createUsersRegistry(authRegistry: builder) {
  return builder()
    .register("userService", { getUsers: () => ["user1", "user2"] })
    .uses(authRegistry.close());
}

// app.ts
import { createAuthRegistry } from "./auth/registry";
import { createUsersRegistry } from "./users/registry";

const authRegistry = createAuthRegistry();
const usersRegistry = createUsersRegistry(authRegistry);

const appRegistry = builder()
  .register("app", { name: "MyApp", version: "1.0.0" })
  .uses(usersRegistry.close());

const context = pbj.newContext();
appRegistry.close().apply(context);
```

## Testing with Registry Builder

`builder` makes testing easier by allowing you to create isolated test registries:

```typescript
import { builder, context } from "@pbinj/pbj";

describe("UserService", () => {
  it("should get users", () => {
    // Create a test registry with mocks
    const testRegistry = builder()
      .register("database", { query: vi.fn().mockResolvedValue([{ id: 1 }]) })
      .register("logger", { log: vi.fn() })
      .factory("userService", UserService, 
        testRegistry.ref("database"), 
        testRegistry.ref("logger")
      ).close();
    
    // Apply to a test context
    testRegistry.apply(context);
    
    // Test the service
    const userService = context.resolve("userService");
    const users = userService.getUses();
    
    expect(users).toEqual([{ id: 1 }]);
    expect(context.resolve("logger").log).toHaveBeenCalled();
  });
});
```