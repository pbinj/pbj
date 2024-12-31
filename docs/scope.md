# Scoped Context

PBinJ provides powerful scope context support using Node.js's AsyncLocalStorage, making it ideal for web applications where you need to maintain request-scoped dependencies.

## Setup

First, import the async extension:

```typescript
import "@pbinj/pbj/scope";
```

This import is required to enable scope context support. It extends the base context with async capabilities.

## Basic Usage

### Creating Scoped Dependencies

```typescript
import { context, pbj, pbjKey } from "@pbinj/pbj";
import "@pbinj/pbj/scope";

interface Session {}
// Define a key for your scoped value
const sessionKey = pbjKey<Session>("session");

// Create a scoped handler
const requestScoped = context.scoped(sessionKey);

// Use in your service
class AuthService {
  constructor(private session = pbj(sessionKey)) {}

  isAuthenticated() {
    return Boolean(this.session?.user);
  }
}
```

## Express Integration Example

Let's look at a real-world example using Express and Auth.js. You can find the complete example at [pbj-express-authjs-example](https://github.com/spbjjus/pbj/tree/main/examples/pbj-express-authjs-example).

### Session Management

```ts
import { context, pbj, pbjKey } from "@pbinj/pbj";
import "@pbinj/pbj/scope";
//import { sessionPBinJKey } from "./pbj";
import { getSession } from "@authjs/express";

const sessionPBinJKey = pbjKey<typeof getSession>("session");


// Create scoped handler for session
const requestScoped = context.scoped(sessionPBinJKey);

// Middleware to handle session
app.use("/*", async (req, res, next) => {
  const session = await getSession(req, pbj(ExpressAuthConfigClass));
  if (!session?.user) {
    return res.redirect("/auth/signin");
  }

  requestScoped(next, session);
});
```

### Nested Scopes

```ts
import { context, pbj, pbjKey } from "@pbinj/pbj";
import "@pbinj/pbj/scope";

const userKey = pbjKey<User>("user");
const tenantKey = pbjKey<Tenant>("tenant");

const userScope = context.scoped(userKey);
const tenantScope = context.scoped(tenantKey);

app.use(async (req, res, next) => {
  const user = await getUser(req);
  userScope(async () => {
    const tenant = await getTenant(user);
    tenantScope(next, tenant);
  }, user);
});
```
