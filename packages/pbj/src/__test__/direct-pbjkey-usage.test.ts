import { it, describe, expect, beforeEach, afterEach } from "vitest";
import {  pbjKey, context } from "../index.js";
import { runBeforeEachTest, runAfterEachTest, isPBJProxyEqualalityTester } from "../test.js";
beforeEach(runBeforeEachTest);
afterEach(runAfterEachTest);
expect.addEqualityTesters([isPBJProxyEqualalityTester]);

describe("Direct pbjKey usage in context.register", () => {
  it("should accept pbjKey directly as constructor arguments", () => {
    // Create keys for configuration values
    const configKey = pbjKey<string>("direct-config");
    context.register(configKey, "direct-value");
    
    // Create a service that takes a string parameter
    class ConfiguredService {
      constructor(public config: string) {}
      
      getConfig() {
        return `Config: ${this.config}`;
      }
    }
    
    // Register the service with direct pbjKey (not wrapped in pbj())
    const s = context.register(ConfiguredService, configKey);
    
    // Resolve and verify
    const service = context.resolve(ConfiguredService);
    expect(service.config).toEqual("direct-value");
    expect(service.getConfig()).toEqual("Config: direct-value");
  });
  
  it("should handle multiple direct pbjKeys in register", () => {
    // Create keys for multiple values
    const nameKey = pbjKey<string>("service-name");
    const versionKey = pbjKey<number>("service-version");
    const enabledKey = pbjKey<boolean>("service-enabled");
    
    // Register the values
    context.register(nameKey, "AuthService");
    context.register(versionKey, 2);
    context.register(enabledKey, true);
    
    // Create a service that takes multiple parameters
    class MultiConfigService {
      constructor(
        public name: string,
        public version: number,
        public enabled: boolean
      ) {}
      
      getServiceInfo() {
        return {
          name: this.name,
          version: this.version,
          enabled: this.enabled
        };
      }
    }
    
    // Register with multiple direct pbjKeys
    context.register(MultiConfigService, nameKey, versionKey, enabledKey);
    
    // Resolve and verify
    const service = context.resolve(MultiConfigService);
    expect(service.name).toEqual("AuthService");
    expect(service.version).toEqual(2);
    expect(service.enabled).toEqual(true);
    
    const info = service.getServiceInfo();
    expect(info).toEqual({
      name: "AuthService",
      version: 2,
      enabled: true
    });
  });
  
  it("should mix direct pbjKeys with literal values", () => {
    // Create a key for one value
    const apiUrlKey = pbjKey<string>("api-url");
    context.register(apiUrlKey, "https://api.example.com");
    
    // Create a service with mixed parameter types
    class ApiClient {
      constructor(
        public baseUrl: string,
        public timeout: number,
        public retries: number
      ) {}
      
      getConfig() {
        return {
          baseUrl: this.baseUrl,
          timeout: this.timeout,
          retries: this.retries
        };
      }
    }
    
    // Register with a mix of pbjKey and literal values
    context.register(ApiClient, apiUrlKey, 5000, 3);
    
    // Resolve and verify
    const client = context.resolve(ApiClient);
    expect(client.baseUrl).toEqual("https://api.example.com");
    expect(client.timeout).toEqual(5000);
    expect(client.retries).toEqual(3);
    
    const config = client.getConfig();
    expect(config).toEqual({
      baseUrl: "https://api.example.com",
      timeout: 5000,
      retries: 3
    });
  });
  
  it("should handle factory functions with direct pbjKeys", () => {
    // Create keys for factory inputs
    const userIdKey = pbjKey<number>("user-id");
    const roleKey = pbjKey<string>("user-role");
    
    // Register values
    context.register(userIdKey, 1001);
    context.register(roleKey, "admin");
    
    // Create a factory function
    const userTokenKey = pbjKey<string>("user-token");
    const tokenFactory = (id: number, role: string) => {
      return `token-${id}-${role}`;
    };

    // Register factory with direct pbjKeys
    context.register(userTokenKey, tokenFactory, userIdKey, roleKey);
    
    // Resolve and verify
    const token = context.resolve(userTokenKey);
    expect(token).toEqual("token-1001-admin");
    
    // Update a dependency
    context.register(userTokenKey, "token-1001-user");
    
    // Resolve again and verify update
    const updatedToken = context.resolve(userTokenKey);
    expect(updatedToken+'').toEqual("token-1001-user");
  });
  
  it("should handle complex dependency chains with direct pbjKeys", () => {
    // Create keys for configuration
    const dbHostKey = pbjKey<string>("db-host");
    const dbPortKey = pbjKey<number>("db-port");
    const dbConnStringKey = pbjKey<string>("db-connection");
    
    // Register base values
    context.register(dbHostKey, "localhost");
    context.register(dbPortKey, 5432);
    
    // Create a factory that depends on other keys
    const connectionFactory = (host: string, port: number) => {
      return `postgresql://${host}:${port}/mydb`;
    };
    
    // Register the connection string factory with direct pbjKeys
    context.register(dbConnStringKey, connectionFactory, dbHostKey, dbPortKey);
    
    // Create a service that uses the connection string
    class DatabaseService {
      constructor(public connectionString: string) {}
      
      connect() {
        return `Connected to ${this.connectionString}`;
      }
    }
    
    // Register the service with the connection string key
    context.register(DatabaseService, dbConnStringKey);
    
    // Resolve and verify
    const db = context.resolve(DatabaseService);
    expect(db.connectionString).toEqual("postgresql://localhost:5432/mydb");
    expect(db.connect()).toEqual("Connected to postgresql://localhost:5432/mydb");
    
    // Update a base dependency
    context.register(dbHostKey, "db.example.com");
    
    // Resolve again and verify changes propagated
    const updatedDb = context.resolve(DatabaseService);
    expect(updatedDb.connectionString).toEqual("postgresql://db.example.com:5432/mydb");
  });
  
  it("should handle initialization with direct pbjKeys", () => {
    // Create keys for dependencies
    const configKey = pbjKey<{apiKey: string}>("api-config");
    context.register(configKey, {apiKey: "secret-key-123"});
    
    // Create a service with initialization
    class ApiService {
      private config: {apiKey: string};
      public initialized = false;
      
      constructor(config: {apiKey: string}) {
        this.config = config;
      }
      
      init() {
        // Simulate initialization with the config
        this.initialized = true;
        return `Initialized API with key: ${this.config.apiKey}`;
      }
      
      makeRequest() {
        if (!this.initialized) {
          throw new Error("Service not initialized");
        }
        return `Making request with API key: ${this.config.apiKey}`;
      }
    }
    
    // Register with direct pbjKey and initialization
    context.register(ApiService, configKey).withInitialize("init");
    
    // Resolve and verify initialization
    const api = context.resolve(ApiService);
    expect(api.initialized).toEqual(true);
    expect(api.makeRequest()).toEqual("Making request with API key: secret-key-123");
    
    // Update the config
    context.register(configKey, {apiKey: "new-secret-key"});
    
    // Resolve again and verify the new instance is initialized with updated config
    const updatedApi = context.resolve(ApiService);
    expect(updatedApi.initialized).toEqual(true);
    expect(updatedApi.makeRequest()).toEqual("Making request with API key: new-secret-key");
  });
  
  it("should handle direct pbjKeys with inheritance", () => {
    // Create keys for base and derived classes
    const baseConfigKey = pbjKey<string>("base-config");
    context.register(baseConfigKey, "base-value");
    
    // Base class with a dependency
    class BaseService {
      constructor(public baseConfig: string) {}
      
      getBaseConfig() {
        return this.baseConfig;
      }
    }
    
    // Derived class with additional dependencies
    class DerivedService extends BaseService {
      constructor(
        baseConfig: string,
        public extraConfig: number
      ) {
        super(baseConfig);
      }
      
      getFullConfig() {
        return {
          base: this.baseConfig,
          extra: this.extraConfig
        };
      }
    }
    
    // Register with direct pbjKey
    context.register(BaseService, baseConfigKey);
    context.register(DerivedService, baseConfigKey, 42);
    
    // Resolve and verify
    const baseService = context.resolve(BaseService);
    expect(baseService.getBaseConfig()).toEqual("base-value");
    
    const derivedService = context.resolve(DerivedService);
    expect(derivedService.getBaseConfig()).toEqual("base-value");
    expect(derivedService.getFullConfig()).toEqual({
      base: "base-value",
      extra: 42
    });
  });
  
  it("should handle circular references with direct pbjKeys", () => {
    // Create keys for circular references

    // Create services with circular dependencies
    class ServiceA {
      constructor(public b:ServiceB ) {}
      
      getInfo() {
        return {
          name: "ServiceA",
          hasB: !!this.b
        };
      }
    }
    
    class ServiceB {
      constructor(public a:ServiceA) {}
      
      getInfo() {
        return {
          name: "ServiceB",
          hasA: !!this.a
        };
      }
    }
    const serviceAKey = pbjKey<ServiceA>("service-a");
    const serviceBKey= pbjKey<ServiceB> ("service-b");

    // Register with circular references using direct pbjKeys
    context.register(serviceAKey, ServiceA, serviceBKey);
    context.register(serviceBKey, ServiceB, serviceAKey);
    
    // Resolve and verify
    const serviceA = context.resolve(serviceAKey);
    const serviceB = context.resolve(serviceBKey);

    expect(serviceA.getInfo()).toEqual({
      name: "ServiceA",
      hasB: true
    });
    
    expect(serviceB.getInfo()).toEqual({
      name: "ServiceB",
      hasA: true
    });
  });
});