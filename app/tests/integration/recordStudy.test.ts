import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import type { SqliteAdapter } from '../../src/lib/db/types.js';
import { migrate } from '../../src/lib/db/migrations.js';
import {
  recordStudy,
  exportData,
  importData,
  getKanjiProgress,
  setSetting,
  getSetting
} from '../../src/lib/db/repository.js';
import { uuid } from '../../src/lib/utils/uuid.js';

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

function makeAdapter(): { adapter: SqliteAdapter; raw: Database } {
  const raw = new SQL.Database();
  const adapter: SqliteAdapter = {
    async exec(sql) {
      raw.exec(sql);
    },
    async run(sql, params = []) {
      raw.run(sql, params as never[]);
    },
    async get(sql, params = []) {
      const stmt = raw.prepare(sql);
      stmt.bind(params as never[]);
      const row = stmt.step() ? (stmt.getAsObject() as never) : undefined;
      stmt.free();
      return row;
    },
    async all(sql, params = []) {
      const stmt = raw.prepare(sql);
      stmt.bind(params as never[]);
      const rows: unknown[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows as never[];
    },
    async close() {
      raw.close();
    }
  };
  return { adapter, raw };
}

let adapter: SqliteAdapter;
let raw: Database;
const session = uuid();

beforeEach(async () => {
  if (!SQL) SQL = await initSqlJs();
  ({ adapter, raw } = makeAdapter());
  await migrate(adapter);
});

afterEach(async () => {
  await adapter.close();
});

describe('migrate', () => {
  it('user_version=1 に到達 + 4 テーブル + device_id 自動発行', async () => {
    const res = raw.exec('PRAGMA user_version');
    expect(res[0].values[0][0]).toBe(1);
    const tables = raw.exec(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    );
    const names = tables[0].values.map((r) => r[0]);
    expect(names).toEqual(expect.arrayContaining(['kanji_progress', 'study_log', 'settings', 'sync_marker']));
    const deviceId = await getSetting(adapter, 'device_id');
    expect(deviceId).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

describe('recordStudy', () => {
  function attempt(overrides: Partial<Parameters<typeof recordStudy>[1]> = {}) {
    return {
      study_id: uuid(),
      session_id: session,
      kanji: '飛',
      stroke_count: 9,
      correct: true,
      error_count: 0,
      duration_ms: 4500,
      hint_used: 0,
      ui_language: 'ja' as const,
      ...overrides
    };
  }

  function rowCount(table: string): number {
    const res = raw.exec(`SELECT COUNT(*) FROM ${table}`);
    return res[0].values[0][0] as number;
  }

  it('1 回呼出 → study_log 1 行 + kanji_progress 1 行', async () => {
    const r = await recordStudy(adapter, attempt());
    expect(r.ok).toBe(true);
    expect(r.duplicated).toBe(false);
    expect(rowCount('study_log')).toBe(1);
    const kp = await getKanjiProgress(adapter, '飛');
    expect(kp?.total_attempts).toBe(1);
    expect(kp?.label).toBe('得意');
  });

  it('同一 study_id 二重呼出 → duplicated:true / 二重 INSERT なし', async () => {
    const a = attempt();
    const r1 = await recordStudy(adapter, a);
    const r2 = await recordStudy(adapter, a);
    expect(r1.duplicated).toBe(false);
    expect(r2.duplicated).toBe(true);
    expect(rowCount('study_log')).toBe(1);
    const kp = await getKanjiProgress(adapter, '飛');
    expect(kp?.total_attempts).toBe(1);
  });

  it('10 回試行で kanji_progress が累積更新', async () => {
    for (let i = 0; i < 10; i++) {
      await recordStudy(adapter, attempt({ correct: i % 2 === 0 }));
    }
    const kp = await getKanjiProgress(adapter, '飛');
    expect(kp?.total_attempts).toBe(10);
    expect(kp?.correct_count).toBe(5);
    expect(kp?.accuracy_pct).toBe(50);
    expect(kp?.label).toBe('苦手');
    expect(rowCount('study_log')).toBe(10);
  });
});

describe('export / import', () => {
  it('export → 別 DB に import (replace) で完全復元', async () => {
    for (let i = 0; i < 3; i++) {
      await recordStudy(adapter, {
        study_id: uuid(),
        session_id: session,
        kanji: '愛',
        stroke_count: 13,
        correct: true,
        error_count: 0,
        duration_ms: 8000,
        hint_used: 0,
        ui_language: 'ja'
      });
    }
    await setSetting(adapter, 'ui_language', 'en');
    const payload = await exportData(adapter);
    expect(payload.kanji_progress).toHaveLength(1);
    expect(payload.study_log).toHaveLength(3);

    const dest = makeAdapter();
    await migrate(dest.adapter);
    await importData(dest.adapter, payload, 'replace');
    const destKp = await getKanjiProgress(dest.adapter, '愛');
    expect(destKp?.total_attempts).toBe(3);
    expect(await getSetting(dest.adapter, 'ui_language')).toBe('en');
    await dest.adapter.close();
  });

  it('import (merge) で UUID 重複 study_log は SKIP', async () => {
    await recordStudy(adapter, {
      study_id: uuid(),
      session_id: session,
      kanji: '東',
      stroke_count: 8,
      correct: true,
      error_count: 0,
      duration_ms: 5000,
      hint_used: 0,
      ui_language: 'ja'
    });
    const payload = await exportData(adapter);
    await importData(adapter, payload, 'merge');
    const logRes = raw.exec(`SELECT COUNT(*) FROM study_log`);
    expect(logRes[0].values[0][0]).toBe(1);
    const kpRes = raw.exec(`SELECT COUNT(*) FROM kanji_progress`);
    expect(kpRes[0].values[0][0]).toBe(1);
  });

  it('schema_version mismatch → throw', async () => {
    await expect(
      importData(
        adapter,
        {
          schema_version: 2,
          exported_at: '',
          device_id: '',
          kanji_progress: [],
          study_log: [],
          settings: []
        },
        'replace'
      )
    ).rejects.toThrow(/Unsupported schema_version/);
  });
});

describe('settings KV', () => {
  it('setSetting → getSetting で値が取れる + UPSERT で更新', async () => {
    await setSetting(adapter, 'difficulty', 'n5');
    expect(await getSetting(adapter, 'difficulty')).toBe('n5');
    await setSetting(adapter, 'difficulty', 'n4');
    expect(await getSetting(adapter, 'difficulty')).toBe('n4');
  });

  it('未定義 key は null を返す', async () => {
    expect(await getSetting(adapter, 'nonexistent')).toBeNull();
  });
});
