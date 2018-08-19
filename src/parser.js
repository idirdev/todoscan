'use strict';

/**
 * @file parser.js
 * @description Parses source files for annotated comments (TODO, FIXME, etc.).
 * @module todoscan/parser
 * @author idirdev
 */

/**
 * Priority map — lower number means higher urgency.
 * @type {Object.<string,number>}
 */
const TAG_PRIORITY = {
  BUG: 1,
  FIXME: 2,
  HACK: 3,
  XXX: 4,
  OPTIMIZE: 5,
  TODO: 6,
  NOTE: 7,
};

/**
 * Set of file extensions that support comment syntax.
 * Key: extension without dot. Value: comment style descriptor.
 * @type {Set<string>}
 */
const SUPPORTED_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'php', 'java', 'kt', 'kts',
  'go', 'rs', 'c', 'cpp', 'cc', 'h', 'hpp',
  'cs', 'swift', 'scala', 'groovy',
  'sh', 'bash', 'zsh', 'fish',
  'css', 'scss', 'sass', 'less',
  'html', 'vue', 'svelte',
  'yaml', 'yml', 'toml',
  'sql', 'graphql', 'gql',
  'lua', 'r', 'dart', 'elm',
]);

/**
 * Returns the list of supported file extensions.
 * @returns {string[]} Array of extensions without leading dot.
 */
function getSupportedExtensions() {
  return Array.from(SUPPORTED_EXTENSIONS);
}

/**
 * Builds a per-tag regex from the list of active tags.
 * @param {string[]} tags - Uppercase tag names.
 * @returns {RegExp}
 */
function buildTagRegex(tags) {
  const escapeRe = /[.*+?^\x24\x7B\x7D()|\x5B\x5D\\]/g;
  const pattern = tags.map(t => t.replace(escapeRe, '\\$&')).join('|');
  return new RegExp(
    '(?:\/\/|#|--|/\\*|<!--)\\s*(' + pattern + ')(?:\\(([^)]+)\\))?\\s*:?\\s*(.+?)(?:\\s*\\*\/|\\s*-->)?\\s*$',
    'i'
  );
}

/**
 * Parses the contents of a source file and extracts annotated comments.
 *
 * @param {string} content    - Raw file contents.
 * @param {string} filePath   - Relative or absolute file path (used for ext check).
 * @param {string[]} tags     - Tags to search for, e.g. ['TODO', 'FIXME'].
 * @param {number} [context=0] - Lines of surrounding context to capture.
 * @returns {Array<{
 *   file: string,
 *   line: number,
 *   column: number,
 *   tag: string,
 *   author: string|null,
 *   message: string,
 *   priority: number,
 *   raw: string,
 *   context?: Array<{lineNumber: number, text: string, isCurrent: boolean}>
 * }>}
 */
function parseComments(content, filePath, tags, context = 0) {
  const ext = filePath.split('.').pop().toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) return [];

  const tagRe = buildTagRegex(tags);
  const lines = content.split('\n');
  const results = [];

  lines.forEach((rawLine, idx) => {
    const m = rawLine.match(tagRe);
    if (!m) return;

    const tag = m[1].toUpperCase();
    const author = m[2] || null;
    const message = (m[3] || '').trim();
    const lineNumber = idx + 1;
    const column = rawLine.search(tagRe) + 1;

    const entry = {
      file: filePath,
      line: lineNumber,
      column,
      tag,
      author,
      message,
      priority: TAG_PRIORITY[tag] ?? 99,
      raw: rawLine.trim(),
    };

    if (context > 0) {
      const start = Math.max(0, idx - context);
      const end = Math.min(lines.length - 1, idx + context);
      entry.context = [];
      for (let i = start; i <= end; i++) {
        entry.context.push({
          lineNumber: i + 1,
          text: lines[i],
          isCurrent: i === idx,
        });
      }
    }

    results.push(entry);
  });

  return results;
}

module.exports = { parseComments, getSupportedExtensions, TAG_PRIORITY, SUPPORTED_EXTENSIONS };
