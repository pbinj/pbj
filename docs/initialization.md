# PBJ Initialization System Documentation

The PBJ initialization system provides a way to automatically initialize services when they are resolved, ensuring that all dependencies are initialized first. This document explains how to use the initialization system and provides examples for common scenarios.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Initialization Order](#initialization-order)
3. [Inheritance](#inheritance)
4. [Circular Dependencies](#circular-dependencies)
5. [Best Practices](#best-practices)

## Basic Usage

To use the initialization system, you need to:

1. Define a service with an initialization method
2. Register the service with the `withInitialize` method
3. Resolve the service

```typescript
import { pbj, createNewContext } from '@pbinj/pbj';

// Define a service with an initialization method
class MyService {
  public initialized = false;
  
  constructor() {
    // Constructor logic
    console.log('MyService constructor called');
    this.init();
  }
  
  // This method will be called during initialization
  init() {
    console.log('MyService initialized');
    this.initialized = true;
    
    // Perform initialization logic
    // - Set up event listeners
    // - Initialize internal state
    // - Connect to external resources
  }
  
  doSomething() {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }
    
    // Service logic
    return 'Hello from MyService';
  }
}

// Create a context
const ctx = createNewContext();

// Register the service with the initialization method
ctx.register(MyService).withInitialize('init');

// Resolve the service - this will automatically call the init method
const service = ctx.resolve(MyService);

// The service is now initialized and ready to use
console.log(service.doSomething()); // 'Hello from MyService'
```

## Initialization Order

The initialization system ensures that services are initialized in the correct order based on their dependencies. A service will only be initialized after all its dependencies have been initialized.

```typescript
import { pbj, createNewContext, pbjKey } from '@pbinj/pbj';

// Define a key for the database service
const dbKey = pbjKey<Database>('database');

// Database service
class Database {
  public initialized = false;
  
  init() {
    console.log('Database initialized');
    this.initialized = true;
    return 'Database connection established';
  }
  
  query(sql: string) {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }
    return `Query result for: ${sql}`;
  }
}

// Repository service that depends on the database
class UserRepository {
  public initialized = false;
  
  constructor(private db = pbj(dbKey)) {}
  
  init() {
    console.log('UserRepository initialized');
    this.initialized = true;
    
    // This will work because the database is already initialized
    this.db.query('SELECT * FROM users LIMIT 1');
    
    return 'UserRepository ready';
  }
  
  findUser(id: number) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Service that depends on the repository
class UserService {
  public initialized = false;
  
  constructor(private repo = pbj(UserRepository)) {}
  
  init() {
    console.log('UserService initialized');
    this.initialized = true;
    return 'UserService ready';
  }
  
  getUser(id: number) {
    return this.repo.findUser(id);
  }
}

const ctx = createNewContext();

// Register all services with initialization methods
ctx.register(dbKey, Database).withInitialize('init');
ctx.register(UserRepository).withInitialize('init');
ctx.register(UserService).withInitialize('init');

// Resolving UserService will initialize all services in the correct order:
// 1. Database
// 2. UserRepository
// 3. UserService
const userService = ctx.resolve(UserService);

// Output:
// Database initialized
// UserRepository initialized
// UserService initialized
```

## Inheritance

The initialization system works correctly with class inheritance. When a derived class overrides the initialization method, it can call the base class's initialization method using `super`.

```typescript
import { pbj, createNewContext } from '@pbinj/pbj';

// Base service with initialization
class BaseService {
  public initialized = false;
  
  init() {
    console.log('BaseService initialized');
    this.initialized = true;
    return 'Base initialization complete';
  }
  
  baseMethod() {
    return 'Base method called';
  }
}

// Derived service that extends the base service
class DerivedService extends BaseService {
  public derivedInitialized = false;
  
  // Override the init method
  init() {
    // Call the base class init method
    super.init();
    
    console.log('DerivedService initialized');
    this.derivedInitialized = true;
    return 'Derived initialization complete';
  }
  
  derivedMethod() {
    return 'Derived method called';
  }
}

const ctx = createNewContext();

// Register the derived service with initialization
ctx.register(DerivedService).withInitialize('init');

// Resolving the derived service will call its init method,
// which will also call the base class's init method
const service = ctx.resolve(DerivedService);

console.log(service.initialized); // true
console.log(service.derivedInitialized); // true
console.log(service.baseMethod()); // 'Base method called'
console.log(service.derivedMethod()); // 'Derived method called'

// Output:
// BaseService initialized
// DerivedService initialized
```


## Best Practices

### 1. Keep Initialization Methods Simple

Initialization methods should be focused on setting up the service's internal state and should not perform complex operations that could fail.

```typescript
class GoodService {
  public initialized = false;
  
  init() {
    // Simple initialization
    this.initialized = true;
    this.cache = new Map();
    this.eventEmitter = new EventEmitter();
    return 'Initialized';
  }
}

class BadService {
  public initialized = false;
  
  init() {
    // Complex initialization that could fail
    this.initialized = true;
    this.loadAllDataFromDatabase(); // This could fail
    this.connectToExternalService(); // This could fail
    return 'Initialized';
  }
}
```

### 2. Check Initialization State

Always check if a service is initialized before using it, especially if the service is used outside the context of the dependency injection system.

```ts
class UserService {
  public initialized = false;
  
  init() {
    this.initialized = true;
    return 'Initialized';
  }
  
  getUser(id: number) {
    if (!this.initialized) {
      throw new Error('UserService not initialized');
    }
    
    // Service logic
    return { id, name: 'User ' + id };
  }
}
```

### 3. Use Async Initialization When Needed

For services that require asynchronous initialization, you can return a Promise from the initialization method.

```typescript
import {createNewContext, pbj} from '@pbinj/pbj';

class AsyncService {
  public initialized = false;
  
  async init() {
    // Perform async initialization
    await this.connectToDatabase();
    await this.loadConfiguration();
    
    this.initialized = true;
    return 'Initialized';
  }
  
  private async connectToDatabase() {
    // Connect to database
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Connected to database');
  }
  
  private async loadConfiguration() {
    // Load configuration
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Configuration loaded');
  }
}

// Register the service
const ctx = createNewContext();
ctx.register(AsyncService).withInitialize('init');

// Resolve and initialize the service
const service = ctx.resolve(AsyncService);

// The init method returns a Promise, so you can await it if needed
service.init().then(() => {
  console.log('Service is fully initialized');
});
```

### 4. Separate Construction from Initialization

Keep the constructor simple and focused on setting up dependencies, and use the initialization method for more complex setup.

```typescript
import {createNewContext, pbj} from '@pbinj/pbj';

class WellDesignedService {
  private logger: Logger;
  private config: Config;
  
  constructor(
    private db = pbj(DatabaseKey),
    private cache = pbj(CacheKey)
  ) {
    // Simple construction
    this.logger = new Logger();
    this.config = new Config();
  }
  
  init() {
    // Complex initialization
    this.logger.info('Initializing service');
    this.setupEventListeners();
    this.preloadData();
    this.startBackgroundTasks();
    return 'Initialized';
  }
  
  private setupEventListeners() {
    // Set up event listeners
  }
  
  private preloadData() {
    // Preload data
  }
  
  private startBackgroundTasks() {
    // Start background tasks
  }
}
```

## Conclusion

The PBJ initialization system provides a powerful way to manage the initialization of services in your application. By following the patterns and best practices outlined in this document, you can ensure that your services are properly initialized and ready to use when they are resolved.
