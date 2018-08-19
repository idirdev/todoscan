'use strict';

/**
 * @file index.js
 * @description Public API for the todoscan package.
 * @module todoscan
 * @author idirdev
 */

const { scan, matchesPattern, isExcluded } = require('./scanner');
const { parseComments, getSupportedExtensions, TAG_PRIORITY } = require('./parser');
const { formatTable, formatJSON, formatCSV, formatMarkdown, formatSummary, groupBy, stats } = require('./reporter');
const { loadConfig } = require('./config');

module.exports = {
  scan,
  matchesPattern,
  isExcluded,
  parseComments,
  getSupportedExtensions,
  TAG_PRIORITY,
  formatTable,
  formatJSON,
  formatCSV,
  formatMarkdown,
  formatSummary,
  groupBy,
  stats,
  loadConfig,
};
