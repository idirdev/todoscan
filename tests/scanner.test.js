'use strict';

/**
 * @file scanner.test.js
 * @description Tests for todoscan parser, scanner, reporter, and config modules.
 * @module todoscan/tests
 * @author idirdev
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs2 = require('node:fs');
const path = require('node:path');
const { parseComments, getSupportedExtensions, TAG_PRIORITY } = require('../src/parser');
const { scan, matchesPattern, isExcluded } = require('../src/scanner');
const { formatJSON, formatCSV } = require('../src/reporter');
const { loadConfig } = require('../src/config');

const FIXTURES = path.join(__dirname, '__fixtures__');

before(() => {
  fs2.mkdirSync(path.join(FIXTURES, 'src'), { recursive: true });
  fs2.mkdirSync(path.join(FIXTURES, 'node_modules', 'dep'), { recursive: true });
  fs2.writeFileSync(
    path.join(FIXTURES, 'src', 'app.js'),
    'const x = 1;\n' +
    '// TODO: implement feature X\n' +
    '/* FIXME: this is broken */\n' +
    'function foo() {\n' +
    '  // HACK(john): workaround for issue #42\n' +
    '  return null;\n' +
    '}\n' +
    '// NOTE: this is intentional\n' +
    '// BUG: crashes on empty input\n' +
    '// OPTIMIZE: use a hashmap instead\n' +
    '// XXX: temporary code'
  );
  fs2.writeFileSync(
    path.join(FIXTURES, 'src', 'main.py'),
    '# TODO: add logging\ndef hello():\n    # FIXME: handle unicode\n    # NOTE: this is fine'
  );
  fs2.writeFileSync(
    path.join(FIXTURES, 'src', 'main.go'),
    'package main\n\n// TODO: add error handling\n/* BUG: race condition in handler */\nfunc main() {}'
  );
  fs2.writeFileSync(
    path.join(FIXTURES, 'src', 'lib.rs'),
    '// TODO: implement Display trait\n// HACK: unsafe block needed here\nfn main() {}'
  );
  fs2.writeFileSync(
    path.join(FIXTURES, 'node_modules', 'dep', 'index.js'),
    '// TODO: this should not appear\n'
  );
  fs2.writeFileSync(
    path.join(FIXTURES, 'src', 'deploy.sh'),
    '#!/bin/bash\n# TODO: add rollback support\n# FIXME: path is hardcoded'
  );
  fs2.writeFileSync(
    path.join(FIXTURES, '.todoscanrc'),
    JSON.stringify({ tags: 'TODO,FIXME,BUG', format: 'json', stats: true })
  );
  fs2.writeFileSync(
    path.join(FIXTURES, '.gitignore'),
    'node_modules/\n*.log\n'
  );
});

after(() => { fs2.rmSync(FIXTURES, { recursive: true, force: true }); });

describe('parseComments', () => {
  it('extracts TODO from JS single-line comments', () => {
    const results = parseComments('// TODO: implement this\nconst x = 1;', 'test.js', ['TODO']);
    assert.equal(results.length, 1);
    assert.equal(results[0].tag, 'TODO');
    assert.equal(results[0].message, 'implement this');
    assert.equal(results[0].line, 1);
  });

  it('extracts FIXME from multi-line comments', () => {
    const results = parseComments('/* FIXME: broken logic */\nvar y = 2;', 'test.js', ['FIXME']);
    assert.equal(results.length, 1);
    assert.equal(results[0].tag, 'FIXME');
  });

  it('extracts tags with author annotation', () => {
    const results = parseComments('// HACK(alice): workaround for bug', 'test.js', ['HACK']);
    assert.equal(results.length, 1);
    assert.equal(results[0].tag, 'HACK');
    assert.equal(results[0].message, 'workaround for bug');
  });

  it('extracts from Python hash comments', () => {
    const results = parseComments('# TODO: add tests\ndef foo(): pass', 'test.py', ['TODO']);
    assert.equal(results.length, 1);
    assert.equal(results[0].tag, 'TODO');
  });

  it('returns empty for unsupported extensions', () => {
    assert.equal(parseComments('// TODO: something', 'test.xyz', ['TODO']).length, 0);
  });

  it('handles multiple tags in one file', () => {
    const results = parseComments('// TODO: first\n// FIXME: second\n// BUG: third', 'test.js', ['TODO', 'FIXME', 'BUG']);
    assert.equal(results.length, 3);
  });

  it('is case-insensitive for tag matching', () => {
    const results = parseComments('// todo: lowercase tag', 'test.js', ['TODO']);
    assert.equal(results.length, 1);
    assert.equal(results[0].tag, 'TODO');
  });

  it('assigns correct priority values', () => {
    assert.equal(TAG_PRIORITY.BUG, 1);
    assert.equal(TAG_PRIORITY.FIXME, 2);
    assert.equal(TAG_PRIORITY.TODO, 6);
    assert.equal(TAG_PRIORITY.NOTE, 7);
  });

  it('captures context lines when requested', () => {
    const results = parseComments('line1\nline2\n// TODO: fix\nline4\nline5', 'test.js', ['TODO'], 1);
    assert.equal(results.length, 1);
    assert.ok(results[0].context);
    assert.equal(results[0].context.length, 3);
    assert.ok(results[0].context[1].isCurrent);
  });
});

describe('matchesPattern', () => {
  it('matches exact directory names', () => {
    assert.ok(matchesPattern('node_modules/foo', 'node_modules'));
  });
  it('matches glob wildcards', () => {
    assert.ok(matchesPattern('dist/bundle.min.js', '*.min.js'));
  });
  it('matches dir patterns with trailing slash', () => {
    assert.ok(matchesPattern('build/output.js', 'build/'));
  });
  it('does not match unrelated paths', () => {
    assert.ok(!matchesPattern('src/app.js', 'vendor'));
  });
});

describe('isExcluded', () => {
  it('excludes matching patterns', () => {
    assert.ok(isExcluded('vendor/lib.js', ['vendor']));
  });
  it('respects negation patterns', () => {
    assert.ok(!isExcluded('vendor/important.js', ['vendor', '!vendor/important.js']));
  });
});

describe('scan', () => {
  it('finds annotations in fixture files', async () => {
    const results = await scan(FIXTURES, {
      tags: ['TODO', 'FIXME', 'HACK', 'NOTE', 'BUG', 'OPTIMIZE', 'XXX'],
      extensions: [], exclude: [], gitignore: true, maxDepth: Infinity, context: 0, sort: 'file',
    });
    assert.ok(results.length > 0, 'Should find annotations');
    assert.equal(results.filter(r => r.file.includes('node_modules')).length, 0, 'Should skip node_modules');
  });

  it('respects extension filter', async () => {
    const results = await scan(FIXTURES, {
      tags: ['TODO'], extensions: ['py'], exclude: [], gitignore: false,
      maxDepth: Infinity, context: 0, sort: 'file',
    });
    assert.ok(results.length > 0);
    for (const r of results) {
      assert.ok(r.file.endsWith('.py'), 'Should only find .py files');
    }
  });

  it('respects tag filter', async () => {
    const results = await scan(FIXTURES, {
      tags: ['BUG'], extensions: [], exclude: [], gitignore: false,
      maxDepth: Infinity, context: 0, sort: 'file',
    });
    for (const r of results) { assert.equal(r.tag, 'BUG'); }
  });

  it('respects exclude patterns', async () => {
    const results = await scan(FIXTURES, {
      tags: ['TODO'], extensions: [], exclude: ['*.sh'], gitignore: false,
      maxDepth: Infinity, context: 0, sort: 'file',
    });
    assert.equal(results.filter(r => r.file.endsWith('.sh')).length, 0, 'Should exclude .sh files');
  });
});

describe('formatJSON', () => {
  it('produces valid JSON', () => {
    const results = [{ file: 'a.js', line: 1, column: 1, tag: 'TODO', message: 'test', priority: 6, raw: '// TODO: test' }];
    const parsed = JSON.parse(formatJSON(results));
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].tag, 'TODO');
  });
});

describe('formatCSV', () => {
  it('produces valid CSV with header', () => {
    const results = [{ file: 'a.js', line: 1, column: 1, tag: 'TODO', message: 'test', priority: 6, raw: '// TODO: test' }];
    const csv = formatCSV(results);
    const csvLines = csv.split(String.fromCharCode(10));
    assert.equal(csvLines[0], 'file,line,column,tag,priority,message');
    assert.equal(csvLines.length, 2);
  });
});

describe('loadConfig', () => {
  it('loads .todoscanrc from directory', () => {
    const config = loadConfig(FIXTURES);
    assert.equal(config.tags, 'TODO,FIXME,BUG');
    assert.equal(config.format, 'json');
    assert.equal(config.stats, true);
  });

  it('returns empty object when no config found', () => {
    assert.deepEqual(loadConfig('/tmp'), {});
  });

  it('throws on explicit missing config', () => {
    assert.throws(() => { loadConfig(FIXTURES, '/tmp/nonexistent-config-file.json'); });
  });
});

describe('getSupportedExtensions', () => {
  it('returns an array of extensions', () => {
    const exts = getSupportedExtensions();
    assert.ok(Array.isArray(exts));
    assert.ok(exts.includes('js'));
    assert.ok(exts.includes('py'));
    assert.ok(exts.includes('go'));
    assert.ok(exts.includes('rs'));
  });
});
