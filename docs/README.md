# PBinJ

> A lightweight, proxy-based Dependency Injection (DI) framework for Node.js with full TypeScript support.

## Features

- 🪶 Lightweight with zero runtime dependencies (other than `node:async_hooks`)
- 🔄 Proxy-based lazy loading of dependencies
- 📦 Type-safe with full TypeScript support
- 🎯 No decorators required
- 🏗️ Supports constructor injection, factory injection, and primitive injection
- 💾 Built-in caching support

## Installation

Using npm:

```bash
npm install @pbinj/pbj
```

Using yarn:
@pbinj

```bash
yarn add @pbinj/pbj
```

@pbinj
Using pnpm:

````bash
pnpm add @pbinj/pbj
```@pbinj

## Quick Start

```typescript
import { pbj, context } from "@pbinj/pbj";

// Define a service
class DatabaseService {
  connect() {
    console.log("Connected to database");
  }
}

// Register the service
context.register(DatabaseService);

// Use the service
class UserService {
  constructor(private db = pbj(DatabaseService)) {}

  getUsers() {
    this.db.connect();
    // ... fetch users
  }
}

const userService = context.resolve(UserService);
userService.getUsers(); // Outputs: Connected to database
````

## Requirements

- Node.js >= 18
- TypeScript (for type support)

## Documentation

For detailed documentation, examples, and advanced usage, visit our [documentation site](https://spbjjus.github.io/pbj).

## License

MIT
