import { browser } from '$app/environment';
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection
} from '@capacitor-community/sqlite';
import type { SqliteAdapter } from './types.js';
import { migrate } from './migrations.js';

const DB_NAME = 'lskf';

let conn: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;
let adapter: SqliteAdapter | null = null;
let initPromise: Promise<SqliteAdapter> | null = null;

async function ensureJeepSqliteRegistered(): Promise<void> {
  if (!browser) return;
  if (!customElements.get('jeep-sqlite')) {
    const mod = await import('jeep-sqlite/loader');
    await mod.defineCustomElements(window);
  }
  if (!document.querySelector('jeep-sqlite')) {
    const el = document.createElement('jeep-sqlite');
    document.body.appendChild(el);
  }
  await customElements.whenDefined('jeep-sqlite');
  await CapacitorSQLite.initWebStore();
}

function wrap(connection: SQLiteDBConnection): SqliteAdapter {
  return {
    async exec(sql) {
      await connection.execute(sql, false);
    },
    async run(sql, params = []) {
      await connection.run(sql, params as never[], false);
    },
    async get(sql, params = []) {
      const res = await connection.query(sql, params as never[]);
      const values = res.values ?? [];
      return values[0] as never;
    },
    async all(sql, params = []) {
      const res = await connection.query(sql, params as never[]);
      return (res.values ?? []) as never[];
    },
    async close() {
      await connection.close();
    }
  };
}

export async function initDb(): Promise<SqliteAdapter> {
  if (adapter) return adapter;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await ensureJeepSqliteRegistered();
    conn = new SQLiteConnection(CapacitorSQLite);
    const isOpen = (await conn.isConnection(DB_NAME, false)).result;
    db = isOpen
      ? await conn.retrieveConnection(DB_NAME, false)
      : await conn.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    await db.open();
    adapter = wrap(db);
    await migrate(adapter);
    return adapter;
  })();
  return initPromise;
}

export function getDb(): SqliteAdapter | null {
  return adapter;
}

export async function closeDb(): Promise<void> {
  if (conn && db) {
    await conn.closeConnection(DB_NAME, false);
    conn = null;
    db = null;
    adapter = null;
    initPromise = null;
  }
}
