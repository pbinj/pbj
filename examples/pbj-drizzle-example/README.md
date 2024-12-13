# PBinJ Drizzle Example

This example demonstrates how to integrate [@pbinj/pbj](https://github.com/pbinj/pbj) with [Drizzle ORM](https://orm.drizzle.team/) for SQLite databases. It showcases dependency injection patterns for database access and configuration management.

## Features

- 🗄️ SQLite integration with Drizzle ORM
- 💉 Dependency injection for database connections
- 🔐 Environment-based configuration
- 📝 Full TypeScript support
- 🔄 Migration management
- 🌱 Database seeding

## Quick Start

1. **Install dependencies**

```bash
pnpm install
```

2. **Configure environment**
   Create `.env.local` with:

```env
DATABASE_URL=file:local.db
DATABASE_AUTH_TOKEN=""
```

3. **Setup database**

```bash
pnpm run setup  # Runs migrations and seeds
```

## Usage

### Basic Usage

```typescript
import { pbj } from "@pbinj/pbj";
import { drizzlePBinJKey, register } from "./pbj";

// Register the Drizzle instance
register();

// Inject and use the database
class UserService {
  constructor(private db = pbj(drizzlePBinJKey)) {}

  async getUsers() {
    return await this.db.query.users.findMany();
  }
}
```

### Configuration

The database configuration is managed through the `ClientConfig` class:

```typescript
class ClientConfig {
  constructor(
    private _url = envRequired("DATABASE_URL"),
    public _authToken = envRequired("DATABASE_AUTH_TOKEN"),
  ) {}
}
```

## Scripts

- `pnpm run generate` - Generate Drizzle migrations
- `pnpm run migrate` - Run database migrations
- `pnpm run seed` - Seed the database
- `pnpm run setup` - Full database setup (migrate + seed)
- `pnpm test` - Run tests
- `pnpm run clean` - Clean database files

## Project Structure

```
src/
├── pbj.ts        # PBinJ configuration and setup
├── schema.ts     # Drizzle schema definitions
├── migrate.ts    # Migration utilities
└── seed.ts       # Database seeding
drizzle/
└── migrations/   # Generated migrations
```

## Schema Example

```typescript
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
});
```

## Migration Management

Generate new migrations:

```bash
pnpm run generate
```

Run migrations:

```bash
pnpm run migrate
```

## Testing

Run the test suite:

```bash
pnpm test
```

## Development

For local development:

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables
4. Run setup: `pnpm run setup`

## Dependencies

- [@pbinj/pbj](https://github.com/pbinj/pbj) - DI framework
- [drizzle-orm](https://orm.drizzle.team/) - SQL ORM
- [@libsql/client](https://github.com/libsql/libsql-client-ts) - SQLite client

## Contributing

This is an example project demonstrating [@pbinj/pbj](https://github.com/pbinj/pbj) features. For bugs or suggestions, please open an issue in the main repository.

## License

MIT
