import { describe, it, expect } from "vitest";
import { env } from "../env";

describe("env", () => {
  it("should return the value of the environment variable", () => {
    process.env.DUMMY_ENV = "test";
    expect(env("DUMMY_ENV") == "test").toBe(true);
  });

  it("should return the default value if the environment variable is not set", () => {
    expect(env("DUMMY_ENV_2", "default") == "default").toBe(true);
  });
});
