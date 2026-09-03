import type {
  ExportPayload,
  ImportMode,
  KanjiProgressRow,
  Label,
  RecordStudyResult,
  SettingRow,
  SqliteAdapter,
  StudyAttempt,
  StudyLogRow
} from './types.js';
import { nowIso } from '../utils/uuid.js';

const SRS_INTERVALS = [1, 3, 7, 14, 30] as const;

function nextSrsInterval(prev: number, easeFactor: number): number {
  if (prev === 0) return SRS_INTERVALS[0];
  const idx = SRS_INTERVALS.indexOf(prev as (typeof SRS_INTERVALS)[number]);
  if (idx >= 0 && idx < SRS_INTERVALS.length - 1) return SRS_INTERVALS[idx + 1];
  return Math.max(60, Math.round(prev * easeFactor));
}

function deriveLabel(accuracy: number, attempts: number): Label {
  if (attempts === 0) return '未挑戦';
  if (accuracy >= 100) return '得意';
  if (accuracy >= 80) return '普通';
  if (accuracy >= 50) return '苦手';
  return '重点';
}

export function recalc(
  prev: KanjiProgressRow | undefined,
  kanji: string,
  correct: boolean
): KanjiProgressRow {
  const total = (prev?.total_attempts ?? 0) + 1;
  const correctCount = (prev?.correct_count ?? 0) + (correct ? 1 : 0);
  const accuracy = (correctCount / total) * 100;
  const easePrev = prev?.srs_ease_factor ?? 2.5;
  let easeFactor = easePrev;
  let repetition = prev?.srs_repetition ?? 0;
  let interval = prev?.srs_interval_days ?? 0;

  if (correct) {
    repetition += 1;
    interval = nextSrsInterval(interval, easeFactor);
  } else {
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  const now = nowIso();
  const nextReview = new Date(Date.now() + interval * 86400000).toISOString();

  return {
    kanji,
    total_attempts: total,
    correct_count: correctCount,
    accuracy_pct: Math.round(accuracy * 100) / 100,
    label: deriveLabel(accuracy, total),
    srs_interval_days: interval,
    srs_ease_factor: easeFactor,
    srs_repetition: repetition,
    next_review_at: nextReview,
    last_attempted_at: now,
    updated_at: now
  };
}

export async function recordStudy(
  db: SqliteAdapter,
  attempt: StudyAttempt
): Promise<RecordStudyResult> {
  await db.exec('BEGIN IMMEDIATE');
  try {
    const dup = await db.get<{ one: number }>(
      `SELECT 1 AS one FROM study_log WHERE study_id = ?`,
      [attempt.study_id]
    );
    if (dup) {
      await db.exec('ROLLBACK');
      return { ok: true, duplicated: true };
    }

    const createdAt = nowIso();
    await db.run(
      `INSERT INTO study_log (study_id, session_id, kanji, stroke_count, correct, error_count, duration_ms, hint_used, ui_language, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attempt.study_id,
        attempt.session_id,
        attempt.kanji,
        attempt.stroke_count,
        attempt.correct ? 1 : 0,
        attempt.error_count,
        attempt.duration_ms,
        attempt.hint_used,
        attempt.ui_language,
        createdAt
      ]
    );

    const cur = await db.get<KanjiProgressRow>(
      `SELECT * FROM kanji_progress WHERE kanji = ?`,
      [attempt.kanji]
    );
    const next = recalc(cur, attempt.kanji, attempt.correct);
    await db.run(
      `INSERT INTO kanji_progress (kanji, total_attempts, correct_count, accuracy_pct, label, srs_interval_days, srs_ease_factor, srs_repetition, next_review_at, last_attempted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(kanji) DO UPDATE SET
         total_attempts=excluded.total_attempts,
         correct_count=excluded.correct_count,
         accuracy_pct=excluded.accuracy_pct,
         label=excluded.label,
         srs_interval_days=excluded.srs_interval_days,
         srs_ease_factor=excluded.srs_ease_factor,
         srs_repetition=excluded.srs_repetition,
         next_review_at=excluded.next_review_at,
         last_attempted_at=excluded.last_attempted_at,
         updated_at=excluded.updated_at`,
      [
        next.kanji,
        next.total_attempts,
        next.correct_count,
        next.accuracy_pct,
        next.label,
        next.srs_interval_days,
        next.srs_ease_factor,
        next.srs_repetition,
        next.next_review_at,
        next.last_attempted_at,
        next.updated_at
      ]
    );

    await db.exec('COMMIT');
    return { ok: true, duplicated: false, kanji_progress: next };
  } catch (e) {
    await db.exec('ROLLBACK');
    throw e;
  }
}

export async function getSetting(db: SqliteAdapter, key: string): Promise<string | null> {
  const row = await db.get<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export async function setSetting(db: SqliteAdapter, key: string, value: string): Promise<void> {
  await db.run(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    [key, value, nowIso()]
  );
}

export async function getReviewKanji(db: SqliteAdapter, limit = 20): Promise<string[]> {
  const rows = await db.all<{ kanji: string }>(
    `SELECT kanji FROM kanji_progress
     WHERE next_review_at IS NOT NULL AND next_review_at <= datetime('now')
     ORDER BY next_review_at ASC LIMIT ?`,
    [limit]
  );
  return rows.map((r) => r.kanji);
}

export async function getKanjiProgress(
  db: SqliteAdapter,
  kanji: string
): Promise<KanjiProgressRow | undefined> {
  return db.get<KanjiProgressRow>(`SELECT * FROM kanji_progress WHERE kanji = ?`, [kanji]);
}

export async function exportData(db: SqliteAdapter): Promise<ExportPayload> {
  return {
    schema_version: 1,
    exported_at: nowIso(),
    device_id: (await getSetting(db, 'device_id')) ?? '',
    kanji_progress: await db.all<KanjiProgressRow>(`SELECT * FROM kanji_progress`),
    study_log: await db.all<StudyLogRow>(`SELECT * FROM study_log`),
    settings: await db.all<SettingRow>(`SELECT * FROM settings`)
  };
}

export async function importData(
  db: SqliteAdapter,
  payload: ExportPayload,
  mode: ImportMode
): Promise<{ ok: true }> {
  if (payload.schema_version !== 1) {
    throw new Error(`Unsupported schema_version: ${payload.schema_version}`);
  }
  await db.exec('BEGIN IMMEDIATE');
  try {
    if (mode === 'replace') {
      await db.exec('DELETE FROM study_log');
      await db.exec('DELETE FROM kanji_progress');
      await db.exec('DELETE FROM settings');
    }
    for (const k of payload.kanji_progress) {
      await db.run(
        `INSERT INTO kanji_progress (kanji, total_attempts, correct_count, accuracy_pct, label, srs_interval_days, srs_ease_factor, srs_repetition, next_review_at, last_attempted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(kanji) DO UPDATE SET
           total_attempts=excluded.total_attempts,
           correct_count=excluded.correct_count,
           accuracy_pct=excluded.accuracy_pct,
           label=excluded.label,
           srs_interval_days=excluded.srs_interval_days,
           srs_ease_factor=excluded.srs_ease_factor,
           srs_repetition=excluded.srs_repetition,
           next_review_at=excluded.next_review_at,
           last_attempted_at=excluded.last_attempted_at,
           updated_at=excluded.updated_at`,
        [
          k.kanji,
          k.total_attempts,
          k.correct_count,
          k.accuracy_pct,
          k.label,
          k.srs_interval_days,
          k.srs_ease_factor,
          k.srs_repetition,
          k.next_review_at,
          k.last_attempted_at,
          k.updated_at
        ]
      );
    }
    for (const s of payload.study_log) {
      await db.run(
        `INSERT OR IGNORE INTO study_log (study_id, session_id, kanji, stroke_count, correct, error_count, duration_ms, hint_used, ui_language, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.study_id,
          s.session_id,
          s.kanji,
          s.stroke_count,
          s.correct,
          s.error_count,
          s.duration_ms,
          s.hint_used,
          s.ui_language,
          s.created_at
        ]
      );
    }
    for (const st of payload.settings) {
      await db.run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
        [st.key, st.value, st.updated_at]
      );
    }
    await db.exec('COMMIT');
    return { ok: true };
  } catch (e) {
    await db.exec('ROLLBACK');
    throw e;
  }
}

export async function getAllStudyLogs(db: SqliteAdapter): Promise<StudyLogRow[]> {
  return db.all<StudyLogRow>(`SELECT * FROM study_log ORDER BY created_at DESC`);
}

export async function clearAllStudyData(db: SqliteAdapter): Promise<void> {
  await db.exec('BEGIN IMMEDIATE');
  try {
    await db.exec('DELETE FROM study_log');
    await db.exec('DELETE FROM kanji_progress');
    await db.exec('COMMIT');
  } catch (e) {
    await db.exec('ROLLBACK');
    throw e;
  }
}
