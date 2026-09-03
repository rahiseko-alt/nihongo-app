import type { SqliteAdapter } from './types.js';
import { uuid, nowIso } from '../utils/uuid.js';

interface Migration {
  from: number;
  to: number;
  apply: (db: SqliteAdapter) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
  {
    from: 0,
    to: 1,
    apply: async (db) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS kanji_progress (
          kanji              TEXT    PRIMARY KEY,
          total_attempts     INTEGER NOT NULL DEFAULT 0,
          correct_count      INTEGER NOT NULL DEFAULT 0,
          accuracy_pct       REAL    NOT NULL DEFAULT 0,
          label              TEXT    NOT NULL DEFAULT '未挑戦',
          srs_interval_days  INTEGER NOT NULL DEFAULT 0,
          srs_ease_factor    REAL    NOT NULL DEFAULT 2.5,
          srs_repetition     INTEGER NOT NULL DEFAULT 0,
          next_review_at     TEXT,
          last_attempted_at  TEXT,
          updated_at         TEXT    NOT NULL
        );
      `);
      await db.exec(`
        CREATE TABLE IF NOT EXISTS study_log (
          study_id      TEXT    PRIMARY KEY,
          session_id    TEXT    NOT NULL,
          kanji         TEXT    NOT NULL REFERENCES kanji_progress(kanji),
          stroke_count  INTEGER NOT NULL,
          correct       INTEGER NOT NULL,
          error_count   INTEGER NOT NULL DEFAULT 0,
          duration_ms   INTEGER NOT NULL,
          hint_used     INTEGER NOT NULL DEFAULT 0,
          ui_language   TEXT    NOT NULL,
          created_at    TEXT    NOT NULL
        );
      `);
      await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key         TEXT PRIMARY KEY,
          value       TEXT NOT NULL,
          updated_at  TEXT NOT NULL
        );
      `);
      await db.exec(`
        CREATE TABLE IF NOT EXISTS sync_marker (
          marker_id    TEXT PRIMARY KEY,
          entity_type  TEXT NOT NULL,
          entity_id    TEXT NOT NULL,
          operation    TEXT NOT NULL,
          created_at   TEXT NOT NULL,
          synced_at    TEXT
        );
      `);
      await db.exec(
        `CREATE INDEX IF NOT EXISTS idx_kanji_progress_next_review ON kanji_progress(next_review_at) WHERE next_review_at IS NOT NULL`
      );
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_study_log_kanji ON study_log(kanji)`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_study_log_session ON study_log(session_id)`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_study_log_created ON study_log(created_at)`);

      const now = nowIso();
      await db.run(
        `INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
        ['schema_version', '1', now]
      );
      await db.run(
        `INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
        ['device_id', uuid(), now]
      );
      await db.exec(`PRAGMA user_version = 1`);
    }
  }
];

export async function migrate(db: SqliteAdapter): Promise<void> {
  const row = await db.get<{ user_version: number }>(`PRAGMA user_version`);
  const current = row?.user_version ?? 0;
  for (const m of MIGRATIONS) {
    if (m.from === current) {
      await db.exec('BEGIN IMMEDIATE');
      try {
        await m.apply(db);
        await db.exec('COMMIT');
      } catch (e) {
        await db.exec('ROLLBACK');
        throw e;
      }
    }
  }
}
