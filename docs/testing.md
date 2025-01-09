# Testing with PBinJ

This guide covers testing strategies using PBinJ's dependency injection system, including mocking dependencies, creating isolated test contexts, and common testing patterns.

## Basic Testing Setup

### Creating Test Contexts

Use `createNewContext()` to create isolated contexts for each test:

```ts
import { createNewContext, pbj, pbjKey } from "@pbinj/pbj";
import { describe, beforeEach, it} from 'vitest';
class DatabaseService {
  constructor() {
    // Database setup
  }
}

class UserService {
  constructor(private db = pbj(DatabaseService)) {}
}

describe("UserService", () => {
  let context: Context;

  beforeEach(() => {
    context = createNewContext();
  });

  it("should create user", () => {
    const userService = context.resolve(UserService);
    // Test implementation
  });
});
```

### Mocking Dependencies

#### Method 1: Direct Mock Registration

```ts
import { context, pbj, pbjKey } from "@pbinj/pbj";
import { describe, it, expect, vi } from 'vitest';

interface Logger {
  log(message: string): void;
}

const loggerKey = pbjKey<Logger>("logger");

describe("UserService", () => {
  it("should log user creation", () => {
    // Create mock
    const mockLogger = {
      log: vi.fn(),
    };

    // Register mock
    context.register(loggerKey, mockLogger);

    // Test implementation
    const userService = context.resolve(UserService);
    await userService.createUser({ name: "Test" });

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining("User created")
    );
  });
});
```

## Advanced Testing Patterns

### Testing Async Contexts
```typescript
//filename=/auth.ts
import { pbj, pbjKey } from "@pbinj/pbj";

export const sessionKey = pbjKey<Session>("session");

export class User {

}
export class Session {
  user: User | null;
};
export class AuthService {
  constructor(private session = pbj(sessionKey)) {}

  isAuthenticated() {
    return Boolean(this.session?.user);
  }
}


```

```typescript
//filname=/auth.test.ts
import { context, pbj, pbjKey } from "@pbinj/pbj";
import { describe, it, expect } from 'vitest';
import "@pbinj/pbj/scope";
import { Session, AuthService, sessionKey } from "/auth";


describe("AuthService", () => {
  it("should handle session-scoped dependencies", async () => {
    const scopeHandler = context.scoped(sessionKey);
    const mockSession = { user: { id: "1", name: "Test" } };

    await scopeHandler(async () => {
      const authService = context.resolve(AuthService);
      expect(authService.isAuthenticated()).toBe(true);
    }, mockSession);
  });
});
```

### Testing Factory Injections

```typescript
//filename=/data-service.ts

import { context, pbj, pbjKey } from "@pbinj/pbj";

export interface ApiClient {
  fetch(url: string): Promise<any>;
}

export class ConfigService {
  constructor(public apiUrl =  "http://localhost:3000") {
  }
}

export class DataService{
  constructor(private apiClient = pbj(apiClientKey)){}
  getData(){
    return this.apiClient.fetch("/data");
  }
}

export const apiClientKey = pbjKey<ApiClient>("api-client");
```

Then test it like this:

```typescript
//filename=/data-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { apiClientKey, ApiClient, ConfigService, DataService } from "/data-service";
import { context, pbj } from "@pbinj/pbj";

describe("DataService", () => {
  it("should use configured API client", async () => {
    const mockApiClient = {
      fetch: vi.fn().mockResolvedValue({ data: "test" }),
    };

    context.register(apiClientKey, (config = pbj(ConfigService)) => {
      return mockApiClient;
    });

    const dataService = context.resolve(DataService);
    await dataService.getData();

    expect(mockApiClient.fetch).toHaveBeenCalled();
  });
});
```

### Testing Lists of Services

```typescript
import { context, pbj, pbjKey } from "@pbinj/pbj";
import { describe, it, expect, vi } from 'vitest';

interface Plugin {
  execute(): void;
}

const pluginKey = pbjKey<Plugin>("plugin");

describe("PluginManager", () => {
  it("should execute all plugins", () => {
    const mockPlugin1 = { execute: vi.fn() };
    const mockPlugin2 = { execute: vi.fn() };

    context.register(pbjKey("plugin-1"), mockPlugin1);
    context.register(pbjKey("plugin-2"), mockPlugin2);

    const plugins = context.listOf(pluginKey);
    plugins.forEach((plugin) => plugin.execute());

    expect(mockPlugin1.execute).toHaveBeenCalled();
    expect(mockPlugin2.execute).toHaveBeenCalled();
  });
});
```

## Best Practices

### 1. Create Test Helpers

```ts
import {  pbj, pbjKey, createNewContext } from "@pbinj/pbj";
import { vi } from 'vitest';
import {createMockLogger, createTestConfig} from "/database-mocks";
import {loggerKey, configKey} from "/keys";

// test/helpers.ts
export function createTestContext() {
  const context = createNewContext();

  // Register common mocks
  context.register(loggerKey, createMockLogger());
  context.register(configKey, createTestConfig());

  return context;
}

export function createMockLogger() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };
}
```


### 2. Organize Test Mocks

```typescript
import { vi } from 'vitest';

// filename=/database-mocks.ts
export function createMockDatabase() {
  return {
    query: vi.fn(),
    transaction: vi.fn(),
    close: vi.fn(),
  };
}

// test/mocks/auth.ts
export function createMockAuthProvider() {
  return {
    authenticate: vi.fn(),
    validateToken: vi.fn(),
  };
}
```

## Real-World Example

Here's a complete example testing a user registration flow:

```ts
import { createNewContext, pbj, pbjKey } from "@pbinj/pbj";
import { UserService } from "../services/user";
import { EmailService } from "../services/email";
import { DatabaseService } from "../services/database";
import { vi } from 'vitest';

describe("User Registration", () => {
  let context: Context;
  let mockDb: vi.Mocked<DatabaseService>;
  let mockEmail: vi.Mocked<EmailService>;

  beforeEach(() => {
    context = createNewContext();

    // Create mocks
    mockDb = {
      saveUser: vi.fn(),
      findUserByEmail: vi.fn(),
    };

    mockEmail = {
      sendWelcomeEmail: vi.fn(),
    };

    // Register mocks
    context.register(dbKey, mockDb);
    context.register(emailKey, mockEmail);
  });

  it("should register new user", async () => {
    mockDb.findUserByEmail.mockResolvedValue(null);
    mockDb.saveUser.mockResolvedValue({ id: "1", email: "test@example.com" });

    const userService = context.resolve(UserService);

    await userService.register({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockDb.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
      })
    );

    expect(mockEmail.sendWelcomeEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should throw on duplicate email", async () => {
    mockDb.findUserByEmail.mockResolvedValue({ id: "1" });

    const userService = context.resolve(UserService);

    await expect(
      userService.register({
        email: "existing@example.com",
        password: "password123",
      })
    ).rejects.toThrow("Email already exists");

    expect(mockDb.saveUser).not.toHaveBeenCalled();
    expect(mockEmail.sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
```

## Integration Testing

For integration tests where you want to use real services:

```ts
import { DrizzleAdapter } from "../adapters/drizzle";
import { migrate } from "../db/migrate";

describe("Integration: UserService", () => {
  beforeAll(async () => {
    // Setup test database
    await migrate();
  });

  it("should persist user in database", async () => {
    const context = createNewContext();

    // Use real database adapter
    context.register(dbKey, DrizzleAdapter);

    // Mock only email service
    context.register(emailKey, {
      sendWelcomeEmail: vi.fn(),
    });

    const userService = context.resolve(UserService);
    const user = await userService.register({
      email: "test@example.com",
      password: "password123",
    });

    // Verify user was persisted
    const savedUser = await context
      .resolve(DrizzleAdapter)
      .findUserByEmail("test@example.com");

    expect(savedUser).toBeDefined();
    expect(savedUser.email).toBe("test@example.com");
  });
});
```

## Related Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Example Projects](https://github.com/pbinj/pbj/tree/main/examples)
