// Roda os testes (*.test.ts em src/) sem dependências novas: esbuild (já usado pelo Vite) + node:test.
import { build } from 'esbuild';
import { readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

function findTests(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? findTests(p) : p.endsWith('.test.ts') ? [p] : [];
  });
}

const entries = findTests('src');
if (entries.length === 0) { console.log('Nenhum teste encontrado.'); process.exit(0); }

const out = mkdtempSync(join(tmpdir(), 'gasto-tests-'));
try {
  await build({ entryPoints: entries, outdir: out, bundle: true, platform: 'node', format: 'esm', outExtension: { '.js': '.mjs' }, logLevel: 'error' });
  const files = entries.map((e) => join(out, e.replace(/^src\//, '').replace(/\.ts$/, '.mjs')));
  const r = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit', env: { ...process.env, TZ: 'America/Sao_Paulo' } });
  process.exitCode = r.status ?? 1;
} finally {
  rmSync(out, { recursive: true, force: true });
}
