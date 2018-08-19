#!/usr/bin/env node
'use strict';

/**
 * @file cli.js
 * @description CLI entry point for todoscan.
 *   Usage: todoscan [dir] [options]
 * @module todoscan/cli
 * @author idirdev
 */

const path = require('path');
const { scan } = require('../src/scanner');
const { formatTable, formatJSON, formatCSV, formatMarkdown, formatSummary } = require('../src/reporter');
const { loadConfig } = require('../src/config');

/** Minimal argument parser (no external deps). */
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    dir: '.',
    type: null,
    ext: null,
    ignore: null,
    format: 'table',
    groupBy: 'file',
    help: false,
  };
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '--help' || a === '-h') { opts.help = true; }
    else if (a === '--type')     { opts.type   = args[++i]; }
    else if (a === '--ext')      { opts.ext    = args[++i]; }
    else if (a === '--ignore')   { opts.ignore = args[++i]; }
    else if (a === '--format')   { opts.format = args[++i]; }
    else if (a === '--group-by') { opts.groupBy = args[++i]; }
    else if (!a.startsWith('-')) { opts.dir = a; }
    i++;
  }
  return opts;
}

const HELP = [
  'Usage: todoscan [dir] [options]',
  '',
  'Options:',
  '  --type   <tags>    Comma-separated tags: TODO,FIXME,HACK,XXX,NOTE',
  '  --ext    <exts>    Comma-separated extensions: js,ts,py',
  '  --ignore <dirs>    Comma-separated dirs/patterns to ignore',
  '  --format <fmt>     Output format: table|json|csv|markdown|summary',
  '  --group-by <key>   Group by: type|file|author',
  '  -h, --help         Show this help',
].join('\n');

(async () => {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    process.stdout.write(HELP + '\n');
    process.exit(0);
  }

  const dir = path.resolve(opts.dir);
  const fileConfig = loadConfig(dir);

  const tags = opts.type
    ? opts.type.split(',').map(t => t.trim().toUpperCase())
    : (fileConfig.tags ? fileConfig.tags.split(',').map(t => t.trim().toUpperCase()) : ['TODO', 'FIXME', 'HACK', 'XXX', 'NOTE']);

  const extensions = opts.ext
    ? opts.ext.split(',').map(e => e.trim().replace(/^\./, ''))
    : (fileConfig.extensions ? fileConfig.extensions.split(',').map(e => e.trim()) : []);

  const exclude = opts.ignore
    ? opts.ignore.split(',').map(p => p.trim())
    : (fileConfig.exclude || []);

  const format = opts.format || fileConfig.format || 'table';

  let results;
  try {
    results = await scan(dir, { tags, extensions, exclude, gitignore: true, maxDepth: Infinity, context: 0, sort: 'file' });
  } catch (err) {
    process.stderr.write('Error: ' + err.message + '\n');
    process.exit(1);
  }

  if (results.length === 0) {
    process.stdout.write('No annotations found. Clean codebase!\n');
    process.exit(0);
  }

  let output;
  switch (format) {
    case 'json':     output = formatJSON(results);     break;
    case 'csv':      output = formatCSV(results);      break;
    case 'markdown': output = formatMarkdown(results); break;
    case 'summary':  output = formatSummary(results);  break;
    default:         output = formatTable(results);    break;
  }

  process.stdout.write(output + '\n');
  process.exit(0);
})();
