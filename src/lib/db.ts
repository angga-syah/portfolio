import postgres from 'postgres';

type Sql = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var _postgres: Sql | undefined;
}

const sql: Sql =
  globalThis._postgres ??
  postgres({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME!,
    username: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // required for transaction-mode pooler (port 6543)
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._postgres = sql;
}

export default sql;
