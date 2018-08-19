# todoscan

> Scan your codebase for TODO, FIXME, HACK, NOTE, XXX, BUG, OPTIMIZE comments.

**[English](#english) | [Francais](#francais)**

---

## English

### What is todoscan?

todoscan is a fast CLI tool that recursively scans source code files for annotation comments like TODO, FIXME, HACK, BUG and more. It supports 30+ file types across multiple programming languages and outputs results as colored terminal tables, JSON, or CSV.

### Features

- Detects **TODO, FIXME, HACK, NOTE, XXX, BUG, OPTIMIZE** tags
- Supports **30+ file extensions**: JS, TS, Python, Go, Rust, Java, C/C++, Ruby, PHP, Shell, CSS, HTML, Lua, SQL, and more
- **Smart comment parsing** with language-specific regex (single-line, multi-line, docstrings)
- **Multiple output formats**: colored table, JSON, CSV, summary
- **Group by** file, tag, or priority level
- **Sort by** file, tag, line, or priority
- Respects **.gitignore** and custom exclusion patterns
- Supports **.todoscanrc** configuration files (JSON)
- **Context lines** around matches
- **Zero configuration** needed to get started
- Lightweight: only 3 runtime dependencies

### Installation

```bash
npm install -g todoscan
```

### Usage

```bash
# Scan current directory
todoscan

# Scan a specific directory
todoscan ./src

# Only look for BUG and FIXME tags
todoscan --tags BUG,FIXME

# Output as JSON
todoscan --format json

# Output as CSV (great for spreadsheets)
todoscan --format csv

# Show summary statistics
todoscan --format summary

# Group results by tag instead of file
todoscan --group-by tag

# Sort by priority (BUG > FIXME > HACK > XXX > OPTIMIZE > TODO > NOTE)
todoscan --sort priority

# Only scan Python and JavaScript files
todoscan --extensions py,js

# Exclude specific patterns
todoscan --exclude "*.test.js,docs"

# Show 2 context lines around each match
todoscan --context 2

# Limit recursion depth
todoscan --max-depth 3

# Show table + statistics summary
todoscan --stats

# Use a specific config file
todoscan --config ./my-todoscanrc.json

# Combine options
todoscan ./src --tags TODO,BUG --format table --sort priority --stats
```

### Configuration

Create a `.todoscanrc` or `.todoscanrc.json` file in your project root:

```json
{
  "tags": "TODO,FIXME,BUG,HACK",
  "extensions": "js,ts,py",
  "exclude": ["vendor", "dist", "*.min.js"],
  "format": "table",
  "groupBy": "file",
  "sort": "priority",
  "maxDepth": 10,
  "context": 0,
  "gitignore": true,
  "stats": true
}
```

CLI flags override config file values.

### Priority Levels

| Priority | Tags        |
|----------|-------------|
| HIGH     | BUG, FIXME  |
| MEDIUM   | HACK, XXX   |
| LOW      | OPTIMIZE, TODO, NOTE |

### Supported Languages

| Language      | Extensions                          | Comment Styles         |
|---------------|-------------------------------------|------------------------|
| JavaScript/TS | .js, .jsx, .ts, .tsx, .mjs, .cjs    | `//`, `/* */`          |
| Python        | .py, .pyw, .pyi                     | `#`, `""" """`         |
| Go            | .go                                 | `//`, `/* */`          |
| Rust          | .rs                                 | `//`, `/* */`          |
| Java/Kotlin   | .java, .kt, .kts, .scala            | `//`, `/* */`          |
| C/C++         | .c, .h, .cpp, .hpp, .cc, .cxx       | `//`, `/* */`          |
| Ruby          | .rb, .rake                          | `#`, `=begin =end`    |
| PHP           | .php                                | `//`, `#`, `/* */`    |
| Shell         | .sh, .bash, .zsh, .fish             | `#`                    |
| HTML/XML      | .html, .htm, .xml, .vue, .svelte    | `<!-- -->`             |
| CSS           | .css, .scss, .less                  | `/* */`                |
| Lua           | .lua                                | `--`, `--[[ ]]`       |
| SQL           | .sql                                | `--`, `/* */`          |
| Config        | .yml, .yaml, .toml, .conf           | `#`                    |

### Programmatic API

```js
const { scan, formatJSON } = require('todoscan');

const results = await scan('/path/to/project', {
  tags: ['TODO', 'FIXME', 'BUG'],
  extensions: ['js', 'ts'],
  exclude: ['dist'],
  gitignore: true,
  maxDepth: Infinity,
  context: 0,
  sort: 'priority',
});

console.log(formatJSON(results));
```

---

## Francais

### Description

todoscan est un outil CLI rapide qui scanne recursivement vos fichiers source pour trouver les commentaires d'annotation comme TODO, FIXME, HACK, BUG et plus encore. Il prend en charge plus de 30 types de fichiers et affiche les resultats sous forme de tableaux colores, JSON ou CSV.

### Fonctionnalites

- Detecte les tags **TODO, FIXME, HACK, NOTE, XXX, BUG, OPTIMIZE**
- Supporte **30+ extensions** : JS, TS, Python, Go, Rust, Java, C/C++, Ruby, PHP, Shell, CSS, HTML, Lua, SQL, etc.
- **Parsing intelligent** des commentaires avec regex adapte a chaque langage
- **Formats de sortie multiples** : tableau colore, JSON, CSV, resume
- **Regroupement** par fichier, tag ou niveau de priorite
- **Tri** par fichier, tag, ligne ou priorite
- Respecte les **.gitignore** et patterns d'exclusion personnalises
- Support des fichiers de configuration **.todoscanrc** (JSON)
- **Lignes de contexte** autour des correspondances
- **Zero configuration** pour commencer
- Leger : seulement 3 dependances runtime

### Installation

```bash
npm install -g todoscan
```

### Utilisation

```bash
# Scanner le repertoire courant
todoscan

# Scanner un repertoire specifique
todoscan ./src

# Chercher uniquement les tags BUG et FIXME
todoscan --tags BUG,FIXME

# Sortie en JSON
todoscan --format json

# Sortie en CSV (ideal pour les tableurs)
todoscan --format csv

# Afficher un resume statistique
todoscan --format summary

# Regrouper par tag au lieu de par fichier
todoscan --group-by tag

# Trier par priorite (BUG > FIXME > HACK > XXX > OPTIMIZE > TODO > NOTE)
todoscan --sort priority

# Scanner uniquement les fichiers Python et JavaScript
todoscan --extensions py,js

# Exclure des patterns specifiques
todoscan --exclude "*.test.js,docs"

# Afficher 2 lignes de contexte autour de chaque match
todoscan --context 2

# Afficher le tableau + un resume statistique
todoscan --stats
```

### Configuration

Creez un fichier `.todoscanrc` ou `.todoscanrc.json` a la racine de votre projet :

```json
{
  "tags": "TODO,FIXME,BUG,HACK",
  "extensions": "js,ts,py",
  "exclude": ["vendor", "dist", "*.min.js"],
  "format": "table",
  "groupBy": "file",
  "sort": "priority",
  "maxDepth": 10,
  "context": 0,
  "gitignore": true,
  "stats": true
}
```

Les options CLI ont priorite sur le fichier de configuration.

### Niveaux de priorite

| Priorite | Tags         |
|----------|--------------|
| HAUTE    | BUG, FIXME   |
| MOYENNE  | HACK, XXX    |
| BASSE    | OPTIMIZE, TODO, NOTE |

### API Programmatique

```js
const { scan, formatJSON } = require('todoscan');

const results = await scan('/chemin/vers/projet', {
  tags: ['TODO', 'FIXME', 'BUG'],
  extensions: ['js', 'ts'],
  exclude: ['dist'],
  gitignore: true,
  maxDepth: Infinity,
  context: 0,
  sort: 'priority',
});

console.log(formatJSON(results));
```

---

## License

MIT - idirdev
