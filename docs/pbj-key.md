## Using PBinJKeys

For the most separation of concerns, with type safety and runtime flexibility, use the `pbjKey`.
PBinJKeys are symbols that are used to register and retrieve services, they fake having a type, kinda
like branded types. We can use this type information for convenient tokens.

## Interfaces

Separate your interfaces from your implementation.

```typescript
//filename=/interfaces.ts
import {  pbjKey } from "@pbinj/pbj";

export class User {};
// Define your interfaces
export interface LoggerService {
  log(message: string): void;
}

export interface DatabaseService {
  findUser(id: string): Promise<User>;
}



// Define your keys
export const loggerKey = pbjKey<LoggerService>("@yourservice/logger");
export const dbKey = pbjKey<DatabaseService>("@yourservice/database");

```
## Create Services

```typescript
// filename=/services.ts
import type { LoggerService, DatabaseService } from "/interfaces";
import { User } from "/interfaces";

export class LoggerServiceImpl implements LoggerService {
  log(message: string) {
    console.log(message);
  }
}

export class DatabaseServiceImpl implements DatabaseService {
  async findUser(id: string) {
    // Implementation
    return new User();
  }    
}
```

## Registering Services

Register services with `context.register()`:

```typescript
// filename=./pbj.ts
import { context } from "@pbinj/pbj";
import { LoggerServiceImpl, DatabaseServiceImpl } from "/services";
import { loggerKey, dbKey } from "/interfaces";

context.register(loggerKey, LoggerServiceImpl);
context.register(dbKey, DatabaseServiceImpl);


```
