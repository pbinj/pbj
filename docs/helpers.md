# PBinJ Helpers

The `helpers.ts` file in PBinJ provides utility functions that enhance the functionality and ease of use of the dependency injection system. These helpers are designed to make working with PBinJ more convenient and type-safe.

## Table of Contents

- [transform](#transform)
- [pathOf](#pathof)

## transform

The `transform` function allows you to apply a transformation to a resolved service.

### Syntax

```typescript
function transform<R, T extends PBinJKey<TRegistry>, TRegistry extends RegistryType = Registry>(
  service: T,
  transformer: (v: ValueOf<TRegistry, T>) => R
): R
```

### Parameters

- `service`: A PBinJKey representing the service to transform.
- `transformer`: A function that takes the resolved service as input and returns a transformed value.

### Returns

The result of applying the transformer function to the resolved service.

### Example

```typescript
import { transform, pbjKey } from '@pbinj/pbj';

const userService = pbjKey<UserService>('userService');

const userName = transform(userService, (service) => service.getCurrentUser().name);
```

## pathOf

The `pathOf` function creates a type-safe getter for accessing nested properties in your PBinJ services.


### Parameters

- `service`: A PBinJKey representing the service to access.
- `path`: A string representing the path to the nested property.
- `defaultValue` (optional): A default value to return if the path is not found.

### Returns

A function that, when called, returns the value at the specified path in the service.

### Example

```typescript
import { pathOf, pbjKey } from '@pbinj/pbj';

interface Config {
  database: {
    host: string;
    port: number;
  };
  users: string[];
}

const configKey = pbjKey<Config>('config');

class DatabaseService {
  constructor(
    private host = pathOf(configKey, 'database.host'),
    private port = pathOf(configKey, 'database.port')
  ) {}
}

```

### Features

- Supports dot notation for nested objects.
- Supports array indexing.
- Type-safe: The return type is inferred based on the path.
- Can provide a default value.
- Can be used with a custom context.

### Usage Tips

1. Always call the returned function to get the actual value.
2. Use with `transform` for more complex operations.
3. Useful for accessing configuration values or any deeply nested structures in your services.

Remember that `pathOf` returns a proxy to the underlying value, so it should always be called to retrieve the actual value.