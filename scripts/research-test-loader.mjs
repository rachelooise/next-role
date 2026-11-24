import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

export function makeLoader(mocks = {}, globals = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const resolve = id => {
      if (id in mocks) return mocks[id];
      if (id === 'server-only') return {};
      if (id.startsWith('@/')) {
        const base = id.slice(2);
        return load(fs.existsSync(base + '.tsx') ? base + '.tsx' : base + '.ts');
      }
      return require(id);
    };
    vm.runInNewContext(source, { exports, require: resolve, console: { error() {}, log() {} }, Error, URL, Date, Intl, process, AbortController, AbortSignal, Request, Response, Headers, Buffer, fetch, setTimeout, clearTimeout, ...globals }, { filename: file });
    return exports;
  }
  return load;
}
