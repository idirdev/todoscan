'use strict';

/**
 * @file config.js
 * @description Loads todoscan configuration from .todoscanrc or explicit path.
 * @module todoscan/config
 * @author idirdev
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = '.todoscanrc';

/**
 * Loads todoscan configuration.
 * Searches upward from dir for .todoscanrc (JSON) if no explicit path given.
 * If an explicit configPath is given and the file does not exist, throws.
 *
 * @param {string}  dir         - Directory to start searching from.
 * @param {string}  [configPath] - Explicit path to a config file.
 * @returns {object} Parsed configuration object, or {} if not found.
 * @throws {Error} If an explicit configPath is given but does not exist.
 */
function loadConfig(dir, configPath) {
  if (configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error('Config file not found: ' + configPath);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // Walk up the directory tree looking for .todoscanrc
  let current = path.resolve(dir);
  const root = path.parse(current).root;

  while (current !== root) {
    const candidate = path.join(current, CONFIG_FILE);
    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, 'utf8'));
      } catch {
        return {};
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return {};
}

module.exports = { loadConfig };
