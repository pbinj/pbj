# The pathOf Helper

The `pathOf` helper is a utility function that creates a type-safe getter for accessing nested properties in your PBinJ services. It supports dot notation and array indexing for complex object paths. It returns a proxy, to the underlying value, as such should always be called to retrieve the value.

## Basic Usage

```typescript
import { pathOf, pbjKey } from "@pbinj/pbj";

const configKey = pbjKey<Config>("config");

// Access nested property
const dbHostGetter = pathOf(configKey, "database.host");
const host = dbHostGetter(); // returns the host value

// Access array elements
const firstUserGetter = pathOf(configKey, "users[0]");
```

## Features

### Dot Notation

Access nested objects using dot notation:

```typescript
import { pathOf, pbjKey } from "@pbinj/pbj";

interface UserConfig {
  database: {
    connection: {
      host: string;
      port: number;
    };
  };
}

const configKey = pbjKey<UserConfig>("config");
//This is a proxy
const portGetter = pathOf(configKey, "database.connection.port");
```

### Array Indexing

Access array elements using bracket notation:

```typescript
import { pathOf, pbjKey } from "@pbinj/pbj";

interface AppConfig {
  users: Array<{
    name: string;
    roles: string[];
  }>;
}

const configKey = pbjKey<AppConfig>("config");
const firstUserNameGetter = pathOf(configKey, "users[0].name");
```

### Default Values

Provide default values for optional properties:

```typescript
import { pathOf, pbjKey } from "@pbinj/pbj";
interface Config {
  features: {
    experimental: boolean;
  };
}

const configKey = pbjKey<Config>("config");
const featureGetter = pathOf(configKey, "features.experimental", false);
```

### Custom Context

Use with custom context objects:

```typescript
import { pathOf, pbjKey } from "@pbinj/pbj";
interface User {
  name: string;
}

const userKey = pbjKey<User>("user");
const nameGetter = pathOf(userKey, "name");
```

## Common Use Cases

### Configuration Access

```typescript
import { pathOf, pbjKey } from "@pbinj/pbj";

const configKey = pbjKey<{
  api: {
    endpoints: {
      users: string;
      auth: string;
    };
    timeout: number;
  };
}>("config");

class ApiService {
  private usersEndpoint = pathOf(configKey, "api.endpoints.users")();
  private timeout = pathOf(configKey, "api.timeout", 5000)();

  async fetchUsers() {
    // Use the resolved values
    const response = await fetch(this.usersEndpoint, {
      timeout: this.timeout,
    });
    return response.json();
  }
}
```

### Environment Variables

```typescript
import { pathOf } from "@pbinj/pbj";
import { envPBinJKey } from "@pbinj/pbj/env";

// Create type-safe getters for environment variables
const getDatabaseUrl = pathOf(envPBinJKey, "DATABASE_URL");
const getApiKey = pathOf(envPBinJKey, "API_KEY");

class DatabaseService {
  constructor(
    private url = pathOf(envPBinJKey, "DATABASE_URL"),
    private apiKey = (ApiKey = pathOf(envPBinJKey, "API_KEY")),
  ) {}
}
```

### Feature Flags

```typescript
import { pbjKey, pathOf } from "@pbinj/pbj";

interface Features {
  flags: {
    newUI: boolean;
    beta: {
      enabled: boolean;
      users: string[];
    };
  };
}

const featuresKey = pbjKey<Features>("features");

class UiService {
  private isNewUiEnabled = pathOf(featuresKey, "flags.newUI", false);
  private isBetaUser = pathOf(featuresKey, "flags.beta.users");

  showNewFeature(userId: string) {
    return this.isNewUiEnabled() && this.isBetaUser()?.includes(userId);
  }
}
```

## Type Safety

The `pathOf` helper provides full type safety for your paths:

```typescript
import { pathOf, pbjKey } from "@pbinj/pbj";

interface Config {
  database: {
    host: string;
    port: number;
  };
}

const configKey = pbjKey<Config>("config");

// ✅ Valid paths
const hostGetter = pathOf(configKey, "database.host");
const portGetter = pathOf(configKey, "database.port");

// ❌ Type error: invalid path
const invalidGetter = pathOf(configKey, "database.invalid");
```

## Best Practices

1. **Use with Factory Registration**

   ```typescript
   import { pathOf, pbjKey } from "@pbinj/pbj";

   const userKey = pbjKey<User>("user");
   const nameGetter = pathOf(sessionKey, "user.name");

   context.register(userKey, nameGetter);
   ```

2. **Centralize Path Definitions**

   ```typescript
   import { pathOf, pbjKey } from "@pbinj/pbj";

   // paths.ts
   export const configPaths = {
     dbHost: pathOf(configKey, "database.host"),
     dbPort: pathOf(configKey, "database.port"),
     apiKey: pathOf(configKey, "api.key"),
   };
   ```

3. **Handle Optional Values**

   ```typescript
   import { pathOf, pbjKey } from "@pbinj/pbj";

   class UserService {
     private userRoles = pathOf(userKey, "roles", []);

     hasRole(role: string) {
       return this.userRoles().includes(role);
     }
   }
   ```

4. **Composition with Other Features**

   ```typescript
   import { pathOf, pbjKey } from "@pbinj/pbj";

   // Combine with async context
   const sessionUser = pathOf(sessionKey, "user");

   app.use((req, res, next) => {
     const requestScoped = context.scoped(sessionKey);
     requestScoped(next, { user: req.user });
   });

   class AuthService {
     private currentUser = sessionUser;

     isAuthenticated() {
       return Boolean(this.currentUser());
     }
   }
   ```

```

```
