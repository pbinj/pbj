## Using PBinJKeys

For the most separation of concerns, with type safety and runtime flexibility, use the `pbjKey`.
PBinJKeys are symbols that are used to register and retrieve services, they fake having a type, kinda
like branded types. We can use this type information for convenient tokens.

## Interfaces

Separate your interfaces from your implementation.

```ts
//filename=interfaces.ts
import { pbjKey } from "@pbinj/pbj";

// Define your interfaces
interface LoggerService {
  log(message: string): void;
}

interface DatabaseService {
  findUser(id: string): Promise<User>;
}

// Define your keys
export const loggerKey = pbjKey<LoggerService>("@yourservice/logger");
export const dbKey = pbjKey<DatabaseService>("@yourservice/database");
```

## Registering Services

Register services with `context.register()`:

```ts
// filename=services.ts
import { context } from "@pbinj/pbj";
import type { LoggerService, DatabaseService } from "./interfaces";
import { loggerKey, dbKey } from "./services";

context.register(loggerKey, LoggerService);
context.register(dbKey, DatabaseService);
```
