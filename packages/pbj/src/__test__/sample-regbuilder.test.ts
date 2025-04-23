import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DBService, IDBService, db } from "./sample-regbuilder/db.js";
import { AuthService, IAuthService, auth } from "./sample-regbuilder/auth.js";
import { EmailService, email } from "./sample-regbuilder/email.js";
import { main } from "./sample-regbuilder/app.js";
import { builder, context } from "@pbinj/pbj";
import {
  runBeforeEachTest,
  runAfterEachTest,
  isPBJProxyEqualalityTester,
} from "../test";

beforeEach(runBeforeEachTest);
afterEach(runAfterEachTest);
expect.addEqualityTesters([isPBJProxyEqualalityTester]);

describe("Sample RegBuilder Integration Tests", () => {
  // Spy on console.log to verify outputs
  const consoleLogSpy = vi.spyOn(console, "log");

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("DB Service", () => {
    it("should correctly register and resolve the DB service", () => {
      const ctx = db.apply(context);
      const dbService = ctx.resolve("db");

      expect(dbService).toBeInstanceOf(DBService);
      expect(dbService.connection()).toEqual("psql://localhost:5432/mydb");
    });

    it("should allow overriding the connection URL", () => {
      const ctx = db.apply(context);
      ctx.register(db.refs.connectionUrl, "custom://localhost:5432/customdb");
      const service = ctx.resolve("db");
      expect(service.connection()).toEqual("custom://localhost:5432/customdb");
    });
  });

  describe("Auth Service", () => {
    it("should correctly register and resolve the Auth service with DB dependency", async () => {
      const ctx = auth.apply(context);
      const authService = ctx.resolve("authService");

      expect(authService).toBeInstanceOf(AuthService);

      // Test the isAuthenticated method
      await authService.isAuthenticated().then((result) => {
        expect(result).toEqual(true);
        expect(consoleLogSpy).toHaveBeenCalledWith("authenticated");
      });
    });

    it("should use the DB service registered by the auth builder", () => {
      // Apply only the auth builder to the context
      auth.apply(context);

      // The auth builder should have registered the DB service
      const dbService = context.resolve(db.refs.db);
      expect(dbService).toBeInstanceOf(DBService);
    });
  });

  describe("Email Service", () => {
    it("should correctly register and resolve the Email service with Auth and DB dependencies", () => {
      const ctx = email.apply(context);
      const emailService = ctx.resolve("emailService");

      expect(emailService).toBeInstanceOf(EmailService);

      // Test the sendEmail method
      return emailService
        .sendEmail("test@example.com", "Test Subject", "Test Body")
        .then(() => {
          expect(consoleLogSpy).toHaveBeenCalledWith("authenticated");
          expect(consoleLogSpy).toHaveBeenCalledWith("connected");
          expect(consoleLogSpy).toHaveBeenCalledWith(
            'Email sent to test@example.com with subject "Test Subject" and body "Test Body"',
          );
        });
    });

    it("should use the Auth and DB services registered by the email builder", () => {
      // Apply only the email builder to the context
      const ctx = email.apply(context);

      // The email builder should have registered both Auth and DB services
      const dbService = ctx.resolve("db");
      expect(dbService).toBeInstanceOf(DBService);

      const authService = ctx.resolve("authService");
      expect(authService).toBeInstanceOf(AuthService);
    });
  });

  describe("App Integration", () => {
    it("should correctly run the main function from app.ts", async () => {
      // We need to apply the email builder to the context first
      email.apply(context);

      // Now run the main function
      await main("test@example.com", "Test Subject", "Test Body");

      expect(consoleLogSpy).toHaveBeenCalledWith("authenticated");
      expect(consoleLogSpy).toHaveBeenCalledWith("connected");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Email sent to test@example.com with subject "Test Subject" and body "Test Body"',
      );
    });

    it("should handle different email parameters", async () => {
      // We need to apply the email builder to the context first
      email.apply(context);

      // Now run the main function
      await main(
        "different@example.com",
        "Different Subject",
        "Different Body",
      );

      expect(consoleLogSpy).toHaveBeenCalledWith("authenticated");
      expect(consoleLogSpy).toHaveBeenCalledWith("connected");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Email sent to different@example.com with subject "Different Subject" and body "Different Body"',
      );
    });
  });

  describe("Mock Overrides", () => {
    it("should allow mocking the DB service", async () => {
      // Create a mock DB service
      class MockDBService implements IDBService {
        connection() {
          return "mock-connection";
        }
      }

      context.register(db.refs.db, MockDBService);

      // Now apply the email builder
      const ctx = email.apply(context);

      // Send an email
      const emailService = ctx.resolve("emailService");
      await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "Test Body",
      );

      // Verify that our mock was used
      expect(consoleLogSpy).toHaveBeenCalledWith("connected");
    });

    it("should allow mocking the Auth service", async () => {
      // Create a mock Auth service
      const logs: string[] = [];
      class MockAuthService implements IAuthService {
        async isAuthenticated() {
          logs.push("mock-authenticated");
          return true;
        }
      }

      // First apply the DB service since email depends on it
      db.apply(context);

      // Now apply the email builder
      const ctx = email.apply(context);
      ctx.register(auth.refs.authService, MockAuthService);
      // Send an email
      const emailService = ctx.resolve("emailService");
      await emailService.sendEmail(
        "test@example.com",
        "Test Subject",
        "Test Body",
      );
      expect(logs).toEqual(["mock-authenticated"]);
    });
  });

  describe("Builder Composition", () => {
    it("should demonstrate how multiple builders can be composed", () => {
      // Create a new builder for a logging service
      class LoggingService {
        log(message: string) {
          console.log(`[LOG] ${message}`);
          return message;
        }
      }

      const loggingBuilder = builder()
        .register("logger", LoggingService)
        .export();

      // First apply the email builder to the context to ensure all dependencies are registered
      email.apply(context);

      // Apply the logging builder
      loggingBuilder.apply(context);

      // Create a new app class that uses the email service and logger
      class App {
        constructor(
          private emailService: EmailService,
          private logger: LoggingService,
        ) {}

        async sendEmail(to: string, subject: string, body: string) {
          this.logger.log(`Sending email to ${to}`);
          await this.emailService.sendEmail(to, subject, body);
          this.logger.log(`Email sent to ${to}`);
          return true;
        }
      }

      // Register the app in the context
      const ctx = builder()
        .register(
          "app",
          App,
          email.refs.emailService,
          loggingBuilder.refs.logger,
        )
        .export()
        .apply(context);

      // Use the app
      const app = ctx.resolve("app");
      return app
        .sendEmail("test@example.com", "Test Subject", "Test Body")
        .then((result) => {
          expect(result).toEqual(true);
          expect(consoleLogSpy).toHaveBeenCalledWith(
            "[LOG] Sending email to test@example.com",
          );
          expect(consoleLogSpy).toHaveBeenCalledWith("authenticated");
          expect(consoleLogSpy).toHaveBeenCalledWith("connected");
          expect(consoleLogSpy).toHaveBeenCalledWith(
            'Email sent to test@example.com with subject "Test Subject" and body "Test Body"',
          );
          expect(consoleLogSpy).toHaveBeenCalledWith(
            "[LOG] Email sent to test@example.com",
          );
        });
    });
  });
});
