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
const firstUser = firstUserGetter();
```

## Syntax

```typescript
function pathOf<T extends PBinJKey<TRegistry>, TPath extends string>(
  service: T,
  path: TPath,
  defaultValue?: PathOf<ValueOf<TRegistry, T>, TPath>
) => (ctx?: ValueOf<TRegistry, T>) => PathOf<ValueOf<TRegistry, T>, TPath>
```

## Features

### Dot Notation

Access nested objects using dot notation:

```typescript
interface UserConfig {
  database: {
    connection: {
      host: string;
      port: number;
    };
  };
}

const configKey = pbjKey<UserConfig>("config");
const portGetter = pathOf(configKey, "database.connection.port");
const port = portGetter(); // Type-safe access to port number
```

### Array Indexing

Access array elements using bracket notation:

```typescript
interface AppConfig {
  users: Array<{
    name: string;
    roles: string[];
  }>;
}

const configKey = pbjKey<AppConfig>("config");
const firstUserNameGetter = pathOf(configKey, "users[0].name");
const firstName = firstUserNameGetter();
```

### Default Values

Provide default values for optional properties:

```typescript
const featureGetter = pathOf(configKey, "features.experimental", false);
const isExperimental = featureGetter(); // returns false if path doesn't exist
```

### Custom Context

Use with custom context objects:

```typescript
const nameGetter = pathOf(userKey, "name");

// Use with default context
const name = nameGetter();

// Use with custom context
const customUser = { name: "Alice" };
const customName = nameGetter(customUser);
```

## Common Use Cases

### Configuration Access

```typescript
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

@pbinj

### Environment Variables

```typescript
import { envPBinJKey } from "@pbinj/pbj/env";

// Create type-safe getters for environment variables
const getDatabaseUrl = pathOf(envPBinJKey, "DATABASE_URL");
const getApiKey = pathOf(envPBinJKey, "API_KEY");

class DatabaseService {
  constructor() {
    this.url = getDatabaseUrl();
    this.apiKey = getApiKey();
  }
}
```

### Feature Flags

```typescript
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
   const userKey = pbjKey<User>("user");
   const nameGetter = pathOf(sessionKey, "user.name");

   context.register(userKey, nameGetter);
   ```

2. **Centralize Path Definitions**

   ```typescript
   // paths.ts
   export const configPaths = {
     dbHost: pathOf(configKey, "database.host"),
     dbPort: pathOf(configKey, "database.port"),
     apiKey: pathOf(configKey, "api.key"),
   };
   ```

3. **Handle Optional Values**

   ```typescript
   class UserService {
     private userRoles = pathOf(userKey, "roles", []);

     hasRole(role: string) {
       return this.userRoles().includes(role);
     }
   }
   ```

4. **Composition with Other Features**

   ```typescript
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
</augment_code_snippet>

This documentation covers the `pathOf` helper function in detail, including its syntax, features, common use cases, and best practices for accessing nested properties in a type-safe way.
```
