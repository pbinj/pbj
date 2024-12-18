# Caching in PBinJ

PBinJ provides flexible caching capabilities through the `withCacheable` method and manual cache control. This guide explains how to effectively use caching in your services. This is meant to cache your service infrastructure not to be an "application" cache. As it does not support caching policies such as LRU or Memcached. Most services should be designed in such a way that caching can be used. If any service depends on a non-cacheable service, it to will become not cacheable. You can however of course use a cache service registered in PBinJ to cache your application data.

## Basic Caching Control

### Enable/Disable Caching

```typescript
import { context } from "@pbinj/pbj";

class UserService {
  async getUser(id: string) {
    // Expensive operation
    return await db.users.findById(id);
  }
}

// Disable caching
context.register(UserService).withCacheable(false);

// Enable caching (default is true)
context.register(UserService).withCacheable(true);
```
