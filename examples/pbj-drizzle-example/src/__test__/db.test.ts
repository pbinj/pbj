import { it, describe, expect } from "vitest";
import { users as usersTable } from "../schema";
import { drizzlePBinJKey, register } from "../pbj";
import { pbj } from "@pbinj/pbj/context";
import { eq } from "drizzle-orm";
import { migrate } from "../migrate";

register();

const db = pbj(drizzlePBinJKey);
describe("db", () => {
  it("should work", async () => {
    await migrate();
    const email = `john${Date.now()}@example.com`;
    await db.insert(usersTable).values({
      id: crypto.randomUUID(),
      name: "John",
      email,
    });

    let user = await db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });
    expect(user?.name).toBe("John");

    user = await db
      .update(usersTable)
      .set({
        name: "Bob",
      })
      .where(eq(usersTable.email, email))
      .returning()
      .get();

    expect(user?.name).toBe("Bob");

    await db.delete(usersTable).where(eq(usersTable.email, email));
  });
});
