#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'src');
const TOP_DIRS = [
  'Components',
  'Redux',
  'utils',
  'types',
  'Hooks',
  'pages',
  'services',
  'constants',
  'config',
];

const exts = ['.ts', '.tsx', '.js', '.jsx'];
let changedFiles = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const res = path.resolve(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'build', 'coverage', '.git'].includes(e.name)) continue;
      walk(res);
      continue;
    }
    if (!exts.includes(path.extname(e.name))) continue;
    processFile(res);
  }
}

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;

  // Regex: import ... from '../../Components/xyz'
  const importRegex = new RegExp(
    "(from\\s+['\"])((?:\\.\\./)+)\\b(" + TOP_DIRS.join('|') + ")(/[^'\\"]*)(['\"])",
    'g'
  );

  src = src.replace(importRegex, (match, p1, p2, p3, p4, p5) => {
    // p1 = from ' or from "
    // p3 = top dir (Components, Redux, utils, ...)
    // p4 = rest of path
    return `${p1}${p3}${p4}${p5}`;
  });

  // Also handle require('..') style
  const requireRegex = new RegExp(
    "(require\\(\s*['\"])((?:\\.\\./)+)\\b(" + TOP_DIRS.join('|') + ")(/[^'\\"]*)(['\"]\\s*\))",
    'g'
  );
  src = src.replace(requireRegex, (match, p1, p2, p3, p4, p5) => {
    return `${p1}${p3}${p4}${p5}`;
  });

  if (src !== original) {
    fs.writeFileSync(filePath, src, 'utf8');
    changedFiles.push(filePath);
  }
}

walk(ROOT);

console.log(`Converted imports in ${changedFiles.length} files.`);
if (changedFiles.length) console.log(changedFiles.join('\n'));
process.exit(0);
