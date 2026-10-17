import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL('../'+path, import.meta.url),'utf8');
test('machine-readable docs are current and have a discoverable skill',()=>{
 assert.equal(read('docs/index.md'),read('LIBRARY.md'));
 assert(fs.existsSync(new URL('../.nojekyll',import.meta.url)), 'Pages must serve SKILL.md frontmatter verbatim');
 assert.match(read('llms.txt'),/^# Let 'Em Cookie/);
 assert.match(read('llms.txt'),/https:\/\/letemcookie.com\/docs\/index.md/);
 assert.match(read('skills/letemcookie/SKILL.md'),/^---\nname: letemcookie\ndescription:/);
 assert.doesNotMatch(read('skills/letemcookie/SKILL.md'),/allowed-tools:/);
 assert.match(read('skills/letemcookie/SKILL.md'),/not permission/);
 assert.match(read('docs/index.html'),/rel="alternate" type="text\/markdown"/);
 assert.doesNotMatch(read('LIBRARY.md'),/homepage uses a labeled iframe/);
});
test('agent discovery work preserves the owner-selected homepage',()=>{
 assert.doesNotMatch(read('index.html'),/iframe|llms|SKILL/);
 assert.match(read('index.html'),/id="eaten"/);
 assert.match(read('index.html'),/cookies eaten/);
 assert.match(read('index.html'),/src="\/counter.js"/);
 assert.doesNotMatch(read('share/index.html'),/id="eaten"/);
});
test('Context7 index targets consumer docs rather than extension internals',()=>{
 const config=JSON.parse(read('context7.json'));
 assert(config.folders.includes('docs'));
 assert(config.excludeFolders.includes('extension'));
 assert(config.excludeFiles.includes('AGENTS.md'));
});
