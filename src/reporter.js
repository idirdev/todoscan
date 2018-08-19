'use strict';

/**
 * @file reporter.js
 * @description Formats scan results into table, JSON, CSV, and summary views.
 * @module todoscan/reporter
 * @author idirdev
 */

/**
 * Groups an array of results by a given field key.
 *
 * @param {object[]} results - Array of comment entries.
 * @param {string}   key     - Field to group by (e.g. 'tag', 'file', 'author').
 * @returns {Object.<string, object[]>}
 */
function groupBy(results, key) {
  return results.reduce((acc, item) => {
    const group = String(item[key] ?? 'unknown');
    (acc[group] = acc[group] || []).push(item);
    return acc;
  }, {});
}

/**
 * Returns count statistics grouped by tag type.
 *
 * @param {object[]} results - Scan results.
 * @returns {Object.<string, number>} Map of tag -> count.
 */
function stats(results) {
  return results.reduce((acc, r) => {
    acc[r.tag] = (acc[r.tag] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Pads a string to a fixed width (truncates if too long).
 * @param {string} str - Input string.
 * @param {number} w   - Target width.
 * @returns {string}
 */
function pad(str, w) {
  const s = String(str ?? '');
  return s.length >= w ? s.slice(0, w - 1) + '…' : s.padEnd(w);
}

/**
 * Formats results as a plain-text table.
 *
 * @param {object[]} results - Scan results.
 * @param {object}   [opts]  - Options (reserved for future use).
 * @returns {string}
 */
function formatTable(results, opts = {}) {
  if (results.length === 0) return 'No annotations found.';

  const rows = results.map(r => [
    pad(r.file, 40),
    pad(String(r.line), 6),
    pad(r.tag, 10),
    pad(r.author || '-', 12),
    pad(r.message, 60),
  ]);

  const header = [pad('FILE', 40), pad('LINE', 6), pad('TAG', 10), pad('AUTHOR', 12), pad('MESSAGE', 60)];
  const sep = '-'.repeat(132);

  return [sep, header.join('  '), sep, ...rows.map(r => r.join('  ')), sep].join('\n');
}

/**
 * Formats results as a JSON string.
 *
 * @param {object[]} results - Scan results.
 * @returns {string} Pretty-printed JSON.
 */
function formatJSON(results) {
  return JSON.stringify(results, null, 2);
}

/**
 * Formats results as CSV with a header row.
 *
 * @param {object[]} results - Scan results.
 * @returns {string}
 */
function formatCSV(results) {
  const header = 'file,line,column,tag,priority,message';
  const rows = results.map(r => {
    const escape = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    return [r.file, r.line, r.column, r.tag, r.priority, escape(r.message)].join(',');
  });
  return [header, ...rows].join('\n');
}

/**
 * Formats results as a Markdown report.
 *
 * @param {object[]} results - Scan results.
 * @returns {string}
 */
function formatMarkdown(results) {
  if (results.length === 0) return '# Scan Report\n\nNo annotations found.';
  const counts = stats(results);
  const lines = ['# TODO Scan Report', '', '## Summary', ''];
  for (const [tag, count] of Object.entries(counts)) {
    lines.push('- **' + tag + '**: ' + count);
  }
  lines.push('', '## Annotations', '', '| File | Line | Tag | Author | Message |', '|------|------|-----|--------|---------|');
  for (const r of results) {
    lines.push('| ' + [r.file, r.line, r.tag, r.author || '-', r.message].join(' | ') + ' |');
  }
  return lines.join('\n');
}

/**
 * Formats a summary view (statistics + group breakdown).
 *
 * @param {object[]} results - Scan results.
 * @param {object}   [opts]  - Options: groupBy field.
 * @returns {string}
 */
function formatSummary(results, opts = {}) {
  const counts = stats(results);
  const total = results.length;
  const lines = ['=== Scan Summary ===', 'Total: ' + total + ' annotation(s)', ''];
  for (const [tag, count] of Object.entries(counts)) {
    const bar = '█'.repeat(Math.min(count, 40));
    lines.push(pad(tag, 10) + ' ' + String(count).padStart(4) + '  ' + bar);
  }
  return lines.join('\n');
}

module.exports = { formatTable, formatJSON, formatCSV, formatMarkdown, formatSummary, groupBy, stats };
