'use strict';

/**
 * @file scanner.js
 * @description Walks directory trees and delegates file parsing to parser.js.
 * @module todoscan/scanner
 * @author idirdev
 */

const fs = require('fs');
const path = require('path');
const { parseComments, SUPPORTED_EXTENSIONS } = require('./parser');

/**
 * Default directories to always exclude.
 * @type {string[]}
 */
const DEFAULT_EXCLUDE = [
  'node_modules', '.git', '.hg', '.svn',
  'dist', 'build', 'coverage', '.next', '.nuxt',
  '__pycache__', '.tox', 'vendor',
];

/**
 * Tests whether a relative path segment matches a simple glob pattern.
 * Supports: exact names, trailing slash (dir match), leading/trailing wildcards.
 *
 * @param {string} relPath  - The path relative to the scan root.
 * @param {string} pattern  - Glob pattern string.
 * @returns {boolean}
 */
function matchesPattern(relPath, pattern) {
  // Normalise separators
  const p = relPath.replace(/\\/g, '/');
  const pat = pattern.replace(/\\/g, '/');

  // Trailing slash = directory prefix match
  if (pat.endsWith('/')) {
    const dir = pat.slice(0, -1);
    return p === dir || p.startsWith(dir + '/');
  }

  // No wildcard = check segment inclusion
  if (!pat.includes('*')) {
    return p === pat || p.startsWith(pat + '/') || p.endsWith('/' + pat) || p.includes('/' + pat + '/');
  }

  // Convert glob to regex: * -> [^/]*, ** -> .*
  const globEscRe = /[.+^\x24\x7B\x7D()|\x5B\x5D\\]/g;
  const escaped = pat
    .replace(globEscRe, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  const re = new RegExp('^' + escaped + '$');
  // Match against the full path or just the basename
  return re.test(p) || re.test(path.basename(p));
}

/**
 * Determines whether a path should be excluded from scanning.
 * Supports negation patterns prefixed with '!'.
 *
 * @param {string} relPath    - Path relative to the scan root.
 * @param {string[]} patterns - Exclusion patterns (may include '!' negations).
 * @returns {boolean}
 */
function isExcluded(relPath, patterns) {
  let excluded = false;
  for (const pat of patterns) {
    if (pat.startsWith('!')) {
      if (matchesPattern(relPath, pat.slice(1))) excluded = false;
    } else {
      if (matchesPattern(relPath, pat)) excluded = true;
    }
  }
  return excluded;
}

/**
 * Recursively collects all scannable file paths under a directory.
 *
 * @param {string}   dir        - Absolute path to directory.
 * @param {string}   root       - Absolute root for relative-path computation.
 * @param {string[]} extensions - Allowed extensions (empty = all supported).
 * @param {string[]} exclude    - Exclusion patterns.
 * @param {number}   maxDepth   - Maximum recursion depth.
 * @param {number}   depth      - Current depth.
 * @returns {string[]} Absolute file paths.
 */
function collectFiles(dir, root, extensions, exclude, maxDepth, depth) {
  if (depth > maxDepth) return [];
  let files = [];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    const relPath = path.relative(root, absPath).replace(/\\/g, '/');

    if (isExcluded(relPath, [...DEFAULT_EXCLUDE, ...exclude])) continue;

    if (entry.isDirectory()) {
      files = files.concat(collectFiles(absPath, root, extensions, exclude, maxDepth, depth + 1));
    } else if (entry.isFile()) {
      const ext = entry.name.split('.').pop().toLowerCase();
      const allowed = extensions.length === 0 ? SUPPORTED_EXTENSIONS.has(ext) : extensions.includes(ext);
      if (allowed) files.push(absPath);
    }
  }

  return files;
}

/**
 * Loads gitignore patterns from a .gitignore file in the given directory.
 *
 * @param {string} dir - Directory to look in.
 * @returns {string[]} Array of patterns.
 */
function loadGitignorePatterns(dir) {
  const gitignorePath = path.join(dir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) return [];
  return fs.readFileSync(gitignorePath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

/**
 * Scans a directory for annotated comments and returns structured results.
 *
 * @param {string} dir - Absolute path to the directory to scan.
 * @param {object} opts
 * @param {string[]} opts.tags       - Tags to scan for.
 * @param {string[]} opts.extensions - File extensions to restrict to (empty = all).
 * @param {string[]} opts.exclude    - Glob patterns to exclude.
 * @param {boolean}  opts.gitignore  - Whether to honour .gitignore.
 * @param {number}   opts.maxDepth   - Max directory recursion depth.
 * @param {number}   opts.context    - Lines of context per result.
 * @param {string}   opts.sort       - Sort key: 'file'|'line'|'tag'|'priority'.
 * @returns {Promise<object[]>} Resolved array of comment entries.
 */
async function scan(dir, opts) {
  const {
    tags = ['TODO', 'FIXME', 'HACK', 'XXX', 'NOTE'],
    extensions = [],
    exclude = [],
    gitignore = true,
    maxDepth = Infinity,
    context = 0,
    sort = 'file',
  } = opts;

  const upperTags = tags.map(t => t.toUpperCase());
  const gitPatterns = gitignore ? loadGitignorePatterns(dir) : [];
  const allExclude = [...exclude, ...gitPatterns];

  const files = collectFiles(dir, dir, extensions, allExclude, maxDepth, 0);

  let results = [];
  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const relPath = path.relative(dir, filePath).replace(/\\/g, '/');
    const entries = parseComments(content, relPath, upperTags, context);
    results = results.concat(entries);
  }

  // Sort results
  results.sort((a, b) => {
    switch (sort) {
      case 'line':     return a.line - b.line;
      case 'tag':      return a.tag.localeCompare(b.tag);
      case 'priority': return a.priority - b.priority;
      case 'file':
      default:
        return a.file.localeCompare(b.file) || a.line - b.line;
    }
  });

  return results;
}

module.exports = { scan, matchesPattern, isExcluded, collectFiles };
