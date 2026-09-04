import { defineConfig } from 'vitest/config';

// app/ は独自の package.json と vitest 設定を持つ別プロジェクト。
// 対象を src/ に限定しないと、root の vitest が app/tests まで拾って
// SvelteKit の生成物（app/.svelte-kit/tsconfig.json）が無いと落ちる。
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
