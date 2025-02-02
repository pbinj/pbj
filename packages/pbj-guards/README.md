# @pbinj/pbj-guards

Type-safe runtime validation guards for [PBinJ](https://github.com/pbinj/pbj) applications.

[![npm version](https://badge.fury.io/js/@pbinj%2Fpbj-guards.svg)](https://www.npmjs.com/package/@pbinj/pbj-guards)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🛡️ Runtime type validation
- 📝 TypeScript type inference
- 🔍 Detailed validation errors
- 🎯 Schema-based validation
- 🔄 Composable guards
- 🪶 Zero runtime dependencies

## Installation

```bash
npm install @pbinj/pbj-guards
```

```bash
pnpm add @pbinj/pbj-guards
```

```bash
yarn add @pbinj/pbj-guards
```

## Basic Usage

```typescript
import { isString, isNumber, isBoolean, shape, array } from "@pbinj/pbj-guards";

// Basic type guards
const str = "hello";
isString(str); // true

// Object shape validation
const userGuard = shape({
  id: isNumber,
  name: isString,
  isActive: isBoolean,
});

const user = {
  id: 1,
  name: "John",
  isActive: true,
};

if (userGuard(user)) {
  // user is typed as { id: number; name: string; isActive: boolean }
  console.log(user.name);
}
```

## Advanced Features

### Array Validation

```typescript
import { array, isString } from "@pbinj/pbj-guards";

const stringArrayGuard = array(isString);

const values = ["a", "b", "c"];
if (stringArrayGuard(values)) {
  // values is typed as string[]
  values.map((v) => v.toUpperCase());
}
```

### Schema Composition

```typescript
import { shape, array, isString, isNumber, required } from "@pbinj/pbj-guards";

const addressGuard = shape({
  street: required(isString),
  city: required(isString),
  zipCode: isString,
});

const userGuard = shape({
  id: required(isNumber),
  name: required(isString),
  addresses: array(addressGuard),
});

type User = GuardType<typeof userGuard>;
// User is now typed as {
//   id: number;
//   name: string;
//   addresses?: Array<{
//     street: string;
//     city: string;
//     zipCode?: string;
//   }>;
// }
```

### Integration with PBinJ

```typescript
import { context, pbjKey } from "@pbinj/pbj";
import { shape, isString, required } from "@pbinj/pbj-guards";

const configGuard = shape({
  apiKey: required(isString),
  baseUrl: required(isString),
});

const configKey = pbjKey<Config>("config");

context.register(configKey, () => {
  const config = loadConfig();
  if (!configGuard(config)) {
    throw new Error("Invalid configuration");
  }
  return config;
});
```

## Available Guards

- `isString` - Validates strings
- `isNumber` - Validates numbers
- `isBoolean` - Validates booleans
- `isInteger` - Validates integer numbers
- `isNullish` - Validates null or undefined values
- `isRequired` - Validates non-null values
- `array` - Creates array validators
- `shape` - Creates object shape validators
- `allOf` - Combines multiple guards
- `oneOf` - Matches one of several guards
- `$ref` - Creates recursive type references

## Type Inference

The library provides full TypeScript type inference:

```typescript
import { shape, isString, isNumber, GuardType } from "@pbinj/pbj-guards";

const personGuard = shape({
  name: isString,
  age: isNumber,
});

type Person = GuardType<typeof personGuard>;
// Person = { name?: string; age?: number }
```

## JSON Schema Compatibility

### Converting Guards to JSON Schema

The library provides built-in support for converting guards to JSON Schema (Draft 2020-12):

```typescript
import { toSchema, shape, isString, isNumber, array } from "@pbinj/pbj-guards";

const userGuard = shape({
  name: isString,
  age: isNumber,
  tags: array(isString),
});

const schema = toSchema(userGuard);
// Outputs:
// {
//   "$schema": "https://json-schema.org/draft/2020-12/schema",
//   "type": "object",
//   "properties": {
//     "name": { "type": "string" },
//     "age": { "type": "number" },
//     "tags": {
//       "type": "array",
//       "items": { "type": "string" }
//     }
//   }
// }
```

### OpenAPI 3.1.0 Compatibility

Guards can be used to generate OpenAPI 3.1.0 compatible schemas:

```typescript
import { toSchema, shape, isString, isNumber } from "@pbinj/pbj-guards";

const userGuard = shape(
  {
    id: isNumber,
    email: isString,
  },
  {
    description: "A user in the system",
    title: "User",
  }
);

const schema = toSchema(userGuard, {
  // OpenAPI-specific metadata
  deprecated: false,
  example: {
    id: 1,
    email: "user@example.com",
  },
});
```

### Advanced Schema Configuration

You can customize the generated schema with additional JSON Schema keywords:

```typescript
import { array, isString, toSchema } from "@pbinj/pbj-guards";

const tagsGuard = array(isString, {
  minItems: 1,
  maxItems: 10,
  uniqueItems: true,
});

const schema = toSchema(tagsGuard);
// Outputs:
// {
//   "$schema": "https://json-schema.org/draft/2020-12/schema",
//   "type": "array",
//   "items": { "type": "string" },
//   "minItems": 1,
//   "maxItems": 10,
//   "uniqueItems": true
// }
```

### Custom Formats and Patterns

Support for string formats and patterns:

```typescript
import { isString, shape, toSchema } from "@pbinj/pbj-guards";

const userGuard = shape({
  email: isString({ format: "email" }),
  phone: isString({ pattern: "^\\+[1-9]\\d{1,14}$" }),
  website: isString({ format: "uri" }),
});

const schema = toSchema(userGuard);
```

### Schema References and Definitions

Support for schema references and definitions:

```typescript
import { shape, isString, isNumber, $ref, toSchema } from "@pbinj/pbj-guards";

const addressGuard = shape({
  street: isString,
  city: isString,
  country: isString,
});

const userGuard = shape({
  id: isNumber,
  name: isString,
  address: $ref("Address", addressGuard),
});

const schema = toSchema(userGuard);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
