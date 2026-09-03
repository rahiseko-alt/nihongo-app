export type UiLanguage = 'en' | 'zh' | 'ko' | 'ja';

export type Label = '得意' | '普通' | '苦手' | '重点' | '未挑戦';

export interface StudyAttempt {
  study_id: string;
  session_id: string;
  kanji: string;
  stroke_count: number;
  correct: boolean;
  error_count: number;
  duration_ms: number;
  hint_used: number;
  ui_language: UiLanguage;
}

export interface KanjiProgressRow {
  kanji: string;
  total_attempts: number;
  correct_count: number;
  accuracy_pct: number;
  label: Label;
  srs_interval_days: number;
  srs_ease_factor: number;
  srs_repetition: number;
  next_review_at: string | null;
  last_attempted_at: string | null;
  updated_at: string;
}

export interface StudyLogRow {
  study_id: string;
  session_id: string;
  kanji: string;
  stroke_count: number;
  correct: 0 | 1;
  error_count: number;
  duration_ms: number;
  hint_used: number;
  ui_language: string;
  created_at: string;
}

export interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface ExportPayload {
  schema_version: number;
  exported_at: string;
  device_id: string;
  kanji_progress: KanjiProgressRow[];
  study_log: StudyLogRow[];
  settings: SettingRow[];
}

export interface RecordStudyResult {
  ok: boolean;
  duplicated: boolean;
  kanji_progress?: KanjiProgressRow;
}

export type ImportMode = 'replace' | 'merge';

export interface SqliteAdapter {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: unknown[]): Promise<void>;
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}
