# Environment Variables

PBinJ provides built-in support for environment variables through two main functions: `env` and `envRequired`.

## Basic Usage

```typescript
import { env, envRequired } from "@pbinj/pbj/env";

// Optional environment variable with default
const apiUrl = env("API_URL", "http://localhost:3000");

// Required environment variable
const apiKey = envRequired("API_KEY");
```

## The `env` Function

The `env` function retrieves an environment variable with an optional default value.

### Syntax

```typescript
function env<K extends keyof PBinJEnv & string>(
  envKey: K,
  defaultValue?: PBinJEnv[K]
): string | undefined;
```

### Examples

```typescript
// With default value
const port = env("PORT", "3000");

// Without default value
const region = env("AWS_REGION");

// In a class constructor
class ConfigService {
  constructor(
    readonly apiUrl = env("API_URL", "http://localhost:3000"),
    readonly debug = env("DEBUG", "false")
  ) {}
}
```

## The `envRequired` Function

The `envRequired` function retrieves an environment variable and throws an error if it's not set.

### Syntax

```typescript
function envRequired<K extends keyof PBinJEnv & string>(envKey: K): string;
```

### Examples

```typescript
// Will throw if DATABASE_URL is not set
const dbUrl = envRequired("DATABASE_URL");

// In a class constructor
class DatabaseConfig {
  constructor(
    readonly url = envRequired("DATABASE_URL"),
    readonly authToken = envRequired("DATABASE_AUTH_TOKEN")
  ) {}
}
```

## Type Safety

The environment variables are fully typed through the `PBinJEnv` interface:

```typescript
// Extend PBinJEnv to add type safety to your environment variables
declare module "@pbinj/pbj" {
  interface PBinJE@pbinj
    NODE_ENV: "development" | "production" | "test";
    API_KEY: string;
    DATABASE_URL: string;
    PORT: string;
  }
}
```

## Best Practices

1. **Use Required for Critical Variables**

   ```typescript
   // Good - Critical configuration
   const dbConnection = envRequired("DATABASE_URL");

   // Good - Optional feature flag with default
   const enableMetrics = env("ENABLE_METRICS", "false");
   ```

2. **Centralize Configuration**

   ```typescript
   class AppConfig {
     constructor(
       readonly dbUrl = envRequired("DATABASE_URL"),
       readonly apiKey = envRequired("API_KEY"),
       readonly port = env("PORT", "3000"),
       readonly logLevel = env("LOG_LEVEL", "info")
     ) {}
   }
   ```

3. **Type Environment Variables**
   ```typescript@pbinj
   declare module "@pbinj/pbj" {
     interface PBinJEnv {
       DATABASE_URL: string;
       API_KEY: string;
       PORT: string;
       LOG_LEVEL: "debug" | "info" | "warn" | "error";
     }
   }
   ```

## Common Patterns

### Configuration Service

```typescript
class ConfigService {
  readonly database = {
    url: envRequired("DATABASE_URL"),
    maxConnections: Number(env("DB_MAX_CONNECTIONS", "10")),
    timeout: Number(env("DB_TIMEOUT", "5000")),
  };

  readonly api = {
    url: env("API_URL", "http://localhost:3000"),
    key: envRequired("API_KEY"),
    timeout: Number(env("API_TIMEOUT", "30000")),
  };

  readonly features = {
    enableMetrics: env("ENABLE_METRICS", "false") === "true",
    enableCache: env("ENABLE_CACHE", "true") === "true",
  };
}
```

### Environment-Specific Configuration

```typescript
class EnvironmentConfig {
  readonly nodeEnv = env("NODE_ENV", "development");

  get isDevelopment() {
    return this.nodeEnv === "development";
  }

  get isProduction() {
    return this.nodeEnv === "production";
  }

  get isTest() {
    return this.nodeEnv === "test";
  }

  readonly databaseUrl = this.isDevelopment
    ? env("DATABASE_URL", "sqlite://local.db")
    : envRequired("DATABASE_URL");
}
```
