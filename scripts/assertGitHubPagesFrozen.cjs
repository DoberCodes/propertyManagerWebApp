#!/usr/bin/env node
'use strict';

const message = [
  'GitHub Pages deployment is frozen during the Firebase Hosting migration.',
  'No build may be published to the gh-pages branch from repository tooling.',
  'See ADR-0028 and the Firebase Hosting migration report before changing this guard.',
].join('\n');

process.stderr.write('\n' + message + '\n\n');
process.exitCode = 1;
