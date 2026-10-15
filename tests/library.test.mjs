import test from 'node:test';
import assert from 'node:assert/strict';
import { init } from '../index.mjs';
import { createRequire } from 'node:module';
import fs from 'node:fs';
test('SSR ESM import is safe and does not init',()=>assert.equal(init(),null));
test('CommonJS exposes the same init',()=>{const require=createRequire(import.meta.url);assert.equal(require('../letemcookie.js').init,init);});
test('package exports only library assets and approved MIT license',()=>{const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));assert.equal(pkg.license,'MIT');assert.equal(pkg.name,'letemcookie');assert.equal(pkg.files.includes('extension'),false);assert.equal(pkg.files.includes('LICENSE'),true);});
