import { it, describe, expect } from "vitest";
import { pbj, createNewContext, pbjKey } from "../index.js";

describe("context register with pbjKeys as arguments", () => {
  it("should register a service with pbjKey dependencies", () => {
    const ctx = createNewContext();
    
    // Define keys for our services
    const loggerKey = pbjKey<Logger>("logger");
    const databaseKey = pbjKey<Database>("database");
    const repositoryKey = pbjKey<UserRepository>("userRepository");
    
    // Define our service classes
    class Logger {
      log(message: string) {
        return `LOG: ${message}`;
      }
    }
    
    class Database {
      constructor(private logger = pbj(loggerKey)) {}
      
      query(sql: string) {
        this.logger.log(`Executing query: ${sql}`);
        return `Result for ${sql}`;
      }
    }
    
    class UserRepository {
      constructor(private db = pbj(databaseKey), private logger = pbj(loggerKey)) {}
      
      findUser(id: number) {
        this.logger.log(`Finding user with id ${id}`);
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
      }
    }
    
    // Register services with explicit dependencies
    ctx.register(loggerKey, Logger);
    ctx.register(databaseKey, Database, loggerKey);
    ctx.register(repositoryKey, UserRepository, databaseKey, loggerKey);
    
    // Resolve and test
    const repository = ctx.resolve(repositoryKey);
    const result = repository.findUser(1);
    
    expect(result).toBe("Result for SELECT * FROM users WHERE id = 1");
  });
  
  it("should register a service with mixed dependencies (pbjKeys and instances)", () => {
    const ctx = createNewContext();
    
    // Define a key for our service
    const serviceKey = pbjKey<Service>("service");
    
    // Define our service classes
    class Dependency {
      getValue() {
        return "dependency value";
      }
    }
    
    class Service {
      constructor(private dep: Dependency) {}
      
      getDepValue() {
        return this.dep.getValue();
      }
    }
    
    // Create an instance of Dependency
    const depInstance = new Dependency();
    
    // Register service with the instance as a dependency
    ctx.register(serviceKey, Service, depInstance);
    
    // Resolve and test
    const service = ctx.resolve(serviceKey);
    const result = service.getDepValue();
    
    expect(result).toBe("dependency value");
  });
  
  it("should register a service with factory function and pbjKey dependencies", () => {
    const ctx = createNewContext();
    
    // Define keys for our services
    const configKey = pbjKey<Config>("config");
    const serviceKey = pbjKey<Service>("service");
    
    // Define our service classes
    class Config {
      getApiUrl() {
        return "https://api.example.com";
      }
    }
    
    class Service {
      constructor(private apiUrl: string) {}
      
      callApi() {
        return `Calling ${this.apiUrl}`;
      }
    }
    
    // Register config
    ctx.register(configKey, Config);
    
    // Register service with a factory function that uses the config
    ctx.register(serviceKey, (config: Config) => {
      return new Service(config.getApiUrl());
    }, configKey);
    
    // Resolve and test
    const service = ctx.resolve(serviceKey);
    const result = service.callApi();
    
    expect(result).toBe("Calling https://api.example.com");
  });
  
  it("should handle multiple levels of dependency injection with pbjKeys", () => {
    const ctx = createNewContext();
    
    // Define keys for our services
    const levelOneKey = pbjKey<LevelOne>("levelOne");
    const levelTwoKey = pbjKey<LevelTwo>("levelTwo");
    const levelThreeKey = pbjKey<LevelThree>("levelThree");
    
    // Define our service classes
    class LevelOne {
      getValue() {
        return "level one";
      }
    }
    
    class LevelTwo {
      constructor(private levelOne = pbj(levelOneKey)) {}
      
      getValue() {
        return `level two with ${this.levelOne.getValue()}`;
      }
    }
    
    class LevelThree {
      constructor(private levelTwo = pbj(levelTwoKey)) {}
      
      getValue() {
        return `level three with ${this.levelTwo.getValue()}`;
      }
    }
    
    // Register services with explicit dependencies
    ctx.register(levelOneKey, LevelOne);
    ctx.register(levelTwoKey, LevelTwo, levelOneKey);
    ctx.register(levelThreeKey, LevelThree, levelTwoKey);
    
    // Resolve and test
    const levelThree = ctx.resolve(levelThreeKey);
    const result = levelThree.getValue();
    
    expect(result).toBe("level three with level two with level one");
  });
  
  it("should allow overriding dependencies with pbjKeys", () => {
    const ctx = createNewContext();
    
    // Define keys for our services
    const dependencyKey = pbjKey<Dependency>("dependency");
    const serviceKey = pbjKey<Service>("service");
    
    // Define our service classes
    class Dependency {
      getValue() {
        return "original dependency";
      }
    }
    
    class MockDependency {
      getValue() {
        return "mock dependency";
      }
    }
    
    class Service {
      constructor(private dependency = pbj(dependencyKey)) {}
      
      getDependencyValue() {
        return this.dependency.getValue();
      }
    }
    
    // Register the original dependency
    ctx.register(dependencyKey, Dependency);
    
    // Register the service
    ctx.register(serviceKey, Service, dependencyKey);
    
    // Resolve and test with original dependency
    const service1 = ctx.resolve(serviceKey);
    expect(service1.getDependencyValue()).toBe("original dependency");
    
    // Override the dependency
    ctx.register(dependencyKey, MockDependency);
    
    // Resolve and test with mock dependency
    const service2 = ctx.resolve(serviceKey);
    expect(service2.getDependencyValue()).toBe("mock dependency");
  });

  it('should allow for a key to resolve a key', ()=>{
    const ctx = createNewContext();
    const key1 = pbjKey<string>("a");
    const key2 = pbjKey<string>("b");
    const fn = (a:string,b:string)=>(a +" "+ b);
    ctx.register(key1, "a");
    ctx.register(key2, fn, "b", key1);
    expect(ctx.resolve(fn, key1, key2)).toEqual("a b a");
  })
});
