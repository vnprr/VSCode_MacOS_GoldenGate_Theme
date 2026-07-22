#!/usr/bin/env node

/**
 * Generates the Golden Gate adaptive file icon theme.
 *
 * The artwork is deliberately drawn from a tiny set of original primitives:
 * a softly rounded document, a translucent colour lozenge and a layered
 * Finder-like folder.  No vendor logo or SF Symbol artwork is embedded.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDirectory);
const artworkRoot = join(projectRoot, 'icons', 'files');
const themePath = join(projectRoot, 'file-icons', 'golden-gate-file-icon-theme.json');

// id, short glyph, accent. Glyphs stay typographic on purpose: at 16 px they
// remain calmer and more legible than miniature brand marks.
const fileArtwork = [
  ['default', '', '#B8C2D1'],
  ['text', 'TXT', '#AAB4C3'],
  ['log', 'LOG', '#9AA7B8'],
  ['javascript', 'JS', '#FFD45A'],
  ['typescript', 'TS', '#69AFFF'],
  ['react', 'JSX', '#65D9F3'],
  ['vue', 'VU', '#62D49B'],
  ['svelte', 'SV', '#FF8B63'],
  ['astro', 'AS', '#C89CFF'],
  ['angular', 'NG', '#FF7183'],
  ['html', '<>', '#FF9A62'],
  ['css', 'CSS', '#6FB3FF'],
  ['sass', 'SS', '#EF8EC4'],
  ['tailwind', 'TW', '#5ED8E6'],
  ['json', '{}', '#E8BE55'],
  ['yaml', 'YML', '#B59AF5'],
  ['toml', 'TOM', '#D39A72'],
  ['xml', 'XML', '#F0A45D'],
  ['markdown', 'MD', '#7AB7E8'],
  ['latex', 'TEX', '#64C1A6'],
  ['python', 'PY', '#70B7EE'],
  ['rust', 'RS', '#E69866'],
  ['go', 'GO', '#64CFE3'],
  ['java', 'JV', '#F07870'],
  ['kotlin', 'KT', '#B68DF1'],
  ['swift', 'SW', '#FF8C62'],
  ['csharp', 'C#', '#A487E5'],
  ['fsharp', 'F#', '#7396E7'],
  ['cpp', 'C++', '#6E9EEA'],
  ['objective-c', 'OC', '#72A8E8'],
  ['php', 'PHP', '#9B96DB'],
  ['ruby', 'RB', '#EF7777'],
  ['shell', 'SH', '#70C58A'],
  ['powershell', 'PS', '#63A9ED'],
  ['sql', 'SQL', '#58C1BD'],
  ['graphql', 'GQ', '#E777BC'],
  ['docker', 'DK', '#64ADF1'],
  ['git', 'GIT', '#F2886D'],
  ['config', 'CFG', '#A8B2C1'],
  ['env', 'ENV', '#82C77A'],
  ['lock', 'LCK', '#E2B965'],
  ['test', 'TST', '#70C98D'],
  ['image', 'IMG', '#B08DE7'],
  ['font', 'Aa', '#E88FB7'],
  ['audio', 'AUD', '#DF81CB'],
  ['video', 'VID', '#8C93ED'],
  ['archive', 'ZIP', '#C59A70'],
  ['database', 'DB', '#5CC7C3'],
  ['pdf', 'PDF', '#F17070'],
  ['word', 'DOC', '#6A9FEC'],
  ['spreadsheet', 'XLS', '#66B984'],
  ['presentation', 'PPT', '#F09265'],
  ['storybook', 'SB', '#EF83B9'],
  ['eslint', 'ESL', '#A18BEA'],
  ['prettier', 'PR', '#E58D80'],
  ['prisma', 'PRS', '#6B8FB3'],
  ['terraform', 'TF', '#9A88E8'],
  ['nginx', 'NX', '#61BC81'],
  ['wasm', 'W', '#9D86E6'],
  ['zig', 'ZG', '#F0B95E'],
  ['lua', 'LUA', '#738DDC'],
  ['dart', 'DT', '#62B6E8'],
  ['elixir', 'EX', '#A887CF'],
  ['haskell', 'HS', '#A77FC5'],
  ['r', 'R', '#6F9EDB'],
  ['julia', 'JL', '#A77ED9'],
  ['scala', 'SC', '#E76F73'],
  ['clojure', 'CL', '#70BD83'],
  ['groovy', 'GR', '#72B3D1'],
  ['perl', 'PL', '#8D93D8'],
  ['make', 'MK', '#A6B0BE'],
  ['cmake', 'CM', '#76A2DF'],
  ['gradle', 'GD', '#6EB79D'],
  ['maven', 'MV', '#D67572'],
  ['nix', 'NIX', '#6FC2D5'],
  ['solidity', 'SOL', '#9FA7B4'],
  ['proto', 'PB', '#62BEB3'],
  ['csv', 'CSV', '#6DB887'],
  ['notebook', 'NB', '#E99A63'],
  ['license', 'LIC', '#D9B163'],
  ['key', 'KEY', '#E1B85B'],
  ['binary', 'BIN', '#9BA6B5'],
  ['package', 'PKG', '#DBA960'],
  ['api', 'API', '#68B8C9'],
  ['template', 'TPL', '#C59BDB'],
];

// id, short glyph, accent. Blank glyphs are used by the generic/root folders.
const folderArtwork = [
  ['folder', '', '#7FAAE6'],
  ['root', '/', '#6E9FDF'],
  ['source', '<>', '#70A9ED'],
  ['app', 'APP', '#7C9FE7'],
  ['components', 'UI', '#A18DE9'],
  ['pages', 'PG', '#77A7E1'],
  ['routes', 'RT', '#7EB9C8'],
  ['hooks', 'HK', '#D08FCB'],
  ['utils', 'UT', '#9AA8BA'],
  ['library', 'LIB', '#A18ACA'],
  ['api', 'API', '#65BCC7'],
  ['server', 'SRV', '#7E9DBD'],
  ['client', 'WEB', '#6FB0E5'],
  ['config', 'CFG', '#A1A9B6'],
  ['test', 'TST', '#71C18C'],
  ['docs', 'DOC', '#79A9DD'],
  ['assets', 'AST', '#C596DD'],
  ['images', 'IMG', '#B287DD'],
  ['styles', 'CSS', '#72B3E8'],
  ['public', 'PUB', '#66BFAD'],
  ['modules', 'MOD', '#72B893'],
  ['build', 'BLD', '#D5A65E'],
  ['scripts', 'SH', '#79BE89'],
  ['database', 'DB', '#61BCB8'],
  ['locales', 'L10', '#7CB5D5'],
  ['types', 'T', '#739FE2'],
  ['github', 'GH', '#9AA5B5'],
  ['vscode', 'VS', '#6DAEE7'],
  ['git', 'GIT', '#E58670'],
  ['cache', 'TMP', '#AAB1BD'],
  ['archive', 'ZIP', '#BD956E'],
  ['mobile', 'MOB', '#87A3DC'],
  ['desktop', 'MAC', '#A4AABB'],
  ['cloud', 'CLD', '#7EB8E0'],
  ['containers', 'CTR', '#69AEE6'],
  ['security', 'SEC', '#D1A45B'],
  ['data', 'DAT', '#69BBAE'],
  ['logs', 'LOG', '#A1AABA'],
  ['fonts', 'Aa', '#D68EBA'],
  ['media', 'MED', '#9A8DDD'],
];

const languageIds = {
  plaintext: 'text', log: 'log', javascript: 'javascript', javascriptreact: 'react',
  typescript: 'typescript', typescriptreact: 'react', vue: 'vue', svelte: 'svelte', astro: 'astro',
  'angular-html': 'angular', html: 'html', css: 'css', scss: 'sass', less: 'sass',
  json: 'json', jsonc: 'json', yaml: 'yaml', toml: 'toml', xml: 'xml',
  markdown: 'markdown', mdx: 'markdown', latex: 'latex', bibtex: 'latex', python: 'python',
  rust: 'rust', go: 'go', java: 'java', kotlin: 'kotlin', swift: 'swift',
  csharp: 'csharp', fsharp: 'fsharp', c: 'cpp', cpp: 'cpp', 'objective-c': 'objective-c',
  'objective-cpp': 'objective-c', php: 'php', ruby: 'ruby', shellscript: 'shell',
  powershell: 'powershell', sql: 'sql', graphql: 'graphql', dockerfile: 'docker',
  lua: 'lua', dart: 'dart', elixir: 'elixir', haskell: 'haskell', r: 'r',
  julia: 'julia', scala: 'scala', clojure: 'clojure', groovy: 'groovy', perl: 'perl',
  makefile: 'make', cmake: 'cmake', nix: 'nix', solidity: 'solidity', protobuf: 'proto',
  csv: 'csv', jupyter: 'notebook', ini: 'config', properties: 'config',
  handlebars: 'template', twig: 'template', pug: 'template', razor: 'template',
};

const fileExtensions = {
  txt: 'text', text: 'text', log: 'log', out: 'log',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', es6: 'javascript',
  ts: 'typescript', mts: 'typescript', cts: 'typescript', 'd.ts': 'typescript',
  jsx: 'react', tsx: 'react', vue: 'vue', svelte: 'svelte', astro: 'astro',
  html: 'html', htm: 'html', xhtml: 'html', css: 'css', pcss: 'css',
  scss: 'sass', sass: 'sass', less: 'sass', styl: 'sass', stylus: 'sass',
  json: 'json', jsonc: 'json', json5: 'json', jsonl: 'json', geojson: 'json', webmanifest: 'json',
  yaml: 'yaml', yml: 'yaml', toml: 'toml', ini: 'config', cfg: 'config', conf: 'config', properties: 'config',
  xml: 'xml', xsd: 'xml', xsl: 'xml', xslt: 'xml', plist: 'xml',
  md: 'markdown', mdx: 'markdown', markdown: 'markdown', rst: 'markdown', adoc: 'markdown',
  tex: 'latex', sty: 'latex', cls: 'latex', bib: 'latex',
  py: 'python', pyw: 'python', pyi: 'python', pyx: 'python', rs: 'rust', go: 'go',
  java: 'java', kt: 'kotlin', kts: 'kotlin', swift: 'swift', cs: 'csharp', csx: 'csharp',
  fs: 'fsharp', fsx: 'fsharp', fsi: 'fsharp', c: 'cpp', h: 'cpp', cc: 'cpp', cpp: 'cpp',
  cxx: 'cpp', hpp: 'cpp', hxx: 'cpp', m: 'objective-c', mm: 'objective-c',
  php: 'php', phtml: 'php', rb: 'ruby', erb: 'ruby', gemspec: 'ruby',
  sh: 'shell', bash: 'shell', zsh: 'shell', fish: 'shell', ksh: 'shell', command: 'shell',
  ps1: 'powershell', psm1: 'powershell', psd1: 'powershell',
  sql: 'sql', ddl: 'sql', dml: 'sql', graphql: 'graphql', gql: 'graphql',
  patch: 'git', diff: 'git', env: 'env', lock: 'lock',
  bmp: 'image', gif: 'image', ico: 'image', jpeg: 'image', jpg: 'image', png: 'image',
  tif: 'image', tiff: 'image', webp: 'image', avif: 'image', heic: 'image', svg: 'image',
  otf: 'font', ttf: 'font', woff: 'font', woff2: 'font', eot: 'font',
  mp3: 'audio', wav: 'audio', aac: 'audio', flac: 'audio', m4a: 'audio', ogg: 'audio', opus: 'audio',
  mp4: 'video', mov: 'video', mkv: 'video', avi: 'video', webm: 'video', m4v: 'video',
  zip: 'archive', tar: 'archive', gz: 'archive', tgz: 'archive', bz2: 'archive', xz: 'archive',
  '7z': 'archive', rar: 'archive', deb: 'archive', rpm: 'archive', jar: 'archive',
  db: 'database', sqlite: 'database', sqlite3: 'database', pdf: 'pdf',
  doc: 'word', docx: 'word', odt: 'word', rtf: 'word',
  xls: 'spreadsheet', xlsx: 'spreadsheet', ods: 'spreadsheet', numbers: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation', odp: 'presentation', keynote: 'presentation',
  prisma: 'prisma', tf: 'terraform', tfvars: 'terraform', wasm: 'wasm', wat: 'wasm', zig: 'zig',
  lua: 'lua', dart: 'dart', ex: 'elixir', exs: 'elixir', hs: 'haskell', lhs: 'haskell',
  r: 'r', jl: 'julia', scala: 'scala', sc: 'scala', clj: 'clojure', cljs: 'clojure',
  cljc: 'clojure', edn: 'clojure', groovy: 'groovy', gradle: 'gradle', pl: 'perl', pm: 'perl',
  mk: 'make', cmake: 'cmake', nix: 'nix', sol: 'solidity', proto: 'proto',
  csv: 'csv', tsv: 'csv', ipynb: 'notebook', pem: 'key', key: 'key', p12: 'key',
  pfx: 'key', cer: 'key', crt: 'key', bin: 'binary', dat: 'binary',
  hbs: 'template', mustache: 'template', twig: 'template', pug: 'template', ejs: 'template',
  http: 'api', rest: 'api',
};

const fileNames = {
  'readme': 'markdown', 'readme.md': 'markdown', 'readme.mdx': 'markdown',
  'changelog': 'markdown', 'changelog.md': 'markdown', 'code_of_conduct.md': 'markdown',
  'license': 'license', 'license.md': 'license', 'license.txt': 'license', 'copying': 'license',
  'package.json': 'package', 'bower.json': 'package', 'deno.json': 'package', 'deno.jsonc': 'package',
  'composer.json': 'package', 'mix.exs': 'package', 'pubspec.yaml': 'package',
  'package-lock.json': 'lock', 'npm-shrinkwrap.json': 'lock', 'yarn.lock': 'lock',
  'pnpm-lock.yaml': 'lock', 'bun.lock': 'lock', 'bun.lockb': 'lock', 'composer.lock': 'lock',
  'cargo.lock': 'lock', 'poetry.lock': 'lock', 'pipfile.lock': 'lock', 'gemfile.lock': 'lock',
  'cargo.toml': 'rust', 'go.mod': 'go', 'go.sum': 'go', 'gemfile': 'ruby', 'rakefile': 'ruby',
  'podfile': 'ruby', 'package.swift': 'swift', 'requirements.txt': 'python', 'pyproject.toml': 'python',
  'pipfile': 'python', 'poetry.toml': 'python', 'pom.xml': 'maven', 'build.gradle': 'gradle',
  'build.gradle.kts': 'gradle', 'settings.gradle': 'gradle', 'gradle.properties': 'gradle',
  'makefile': 'make', 'gnumakefile': 'make', 'cmakelists.txt': 'cmake',
  'dockerfile': 'docker', 'containerfile': 'docker', 'docker-compose.yml': 'docker',
  'docker-compose.yaml': 'docker', 'compose.yml': 'docker', 'compose.yaml': 'docker', '.dockerignore': 'docker',
  '.gitignore': 'git', '.gitattributes': 'git', '.gitmodules': 'git', '.gitkeep': 'git',
  '.env': 'env', '.env.local': 'env', '.env.development': 'env', '.env.production': 'env',
  '.env.test': 'env', '.env.example': 'env', '.editorconfig': 'config', '.npmrc': 'config',
  '.yarnrc': 'config', '.yarnrc.yml': 'config', '.nvmrc': 'config', '.browserslistrc': 'config',
  'tsconfig.json': 'typescript', 'jsconfig.json': 'javascript', 'vite.config.js': 'config',
  'vite.config.ts': 'config', 'webpack.config.js': 'config', 'webpack.config.ts': 'config',
  'rollup.config.js': 'config', 'rollup.config.ts': 'config', 'babel.config.js': 'config',
  'babel.config.cjs': 'config', 'postcss.config.js': 'config', 'postcss.config.cjs': 'config',
  'next.config.js': 'config', 'next.config.mjs': 'config', 'nuxt.config.ts': 'config',
  'astro.config.mjs': 'astro', 'svelte.config.js': 'svelte', 'angular.json': 'angular',
  'tailwind.config.js': 'tailwind', 'tailwind.config.ts': 'tailwind',
  '.eslintrc': 'eslint', '.eslintrc.js': 'eslint', '.eslintrc.cjs': 'eslint',
  '.eslintrc.json': 'eslint', 'eslint.config.js': 'eslint', 'eslint.config.mjs': 'eslint',
  '.prettierrc': 'prettier', '.prettierrc.json': 'prettier', '.prettierrc.yml': 'prettier',
  'prettier.config.js': 'prettier', '.prettierignore': 'prettier',
  'schema.prisma': 'prisma', 'main.tf': 'terraform', 'nginx.conf': 'nginx',
  '.storybook/main.js': 'storybook', '.storybook/main.ts': 'storybook',
  'jest.config.js': 'test', 'jest.config.ts': 'test', 'vitest.config.js': 'test', 'vitest.config.ts': 'test',
  'playwright.config.js': 'test', 'playwright.config.ts': 'test', 'cypress.config.js': 'test',
  'cypress.config.ts': 'test', 'info.plist': 'xml', 'project.pbxproj': 'config',
};

const folderNames = {
  src: 'source', source: 'source', sources: 'source', app: 'app', apps: 'app',
  components: 'components', component: 'components', ui: 'components', widgets: 'components',
  pages: 'pages', views: 'pages', screens: 'pages', routes: 'routes', router: 'routes', routing: 'routes',
  hooks: 'hooks', composables: 'hooks', utils: 'utils', utilities: 'utils', helpers: 'utils', common: 'utils', shared: 'utils',
  lib: 'library', libs: 'library', library: 'library', libraries: 'library', vendor: 'library',
  api: 'api', endpoints: 'api', services: 'api', server: 'server', backend: 'server', functions: 'server',
  client: 'client', frontend: 'client', web: 'client', config: 'config', configs: 'config', settings: 'config', '.config': 'config',
  test: 'test', tests: 'test', '__tests__': 'test', spec: 'test', specs: 'test', e2e: 'test', cypress: 'test', playwright: 'test',
  docs: 'docs', doc: 'docs', documentation: 'docs', examples: 'docs',
  assets: 'assets', resources: 'assets', images: 'images', image: 'images', img: 'images', icons: 'images', screenshots: 'images',
  styles: 'styles', style: 'styles', css: 'styles', scss: 'styles', sass: 'styles', themes: 'styles', theme: 'styles',
  public: 'public', static: 'public', www: 'public', 'node_modules': 'modules', dependencies: 'modules',
  dist: 'build', build: 'build', out: 'build', output: 'build', release: 'build', target: 'build', coverage: 'build',
  scripts: 'scripts', script: 'scripts', bin: 'scripts', tools: 'scripts', tooling: 'scripts', tasks: 'scripts',
  database: 'database', db: 'database', migrations: 'database', prisma: 'database',
  locales: 'locales', locale: 'locales', i18n: 'locales', l10n: 'locales', translations: 'locales',
  types: 'types', typings: 'types', '@types': 'types', '.github': 'github', workflows: 'github',
  '.vscode': 'vscode', '.idea': 'config', '.git': 'git', '.cache': 'cache', cache: 'cache', tmp: 'cache', temp: 'cache',
  archive: 'archive', archives: 'archive', backup: 'archive', backups: 'archive',
  ios: 'mobile', android: 'mobile', mobile: 'mobile', macos: 'desktop', windows: 'desktop', linux: 'desktop', desktop: 'desktop',
  cloud: 'cloud', infra: 'cloud', infrastructure: 'cloud', terraform: 'cloud',
  docker: 'containers', containers: 'containers', auth: 'security', security: 'security', certificates: 'security',
  data: 'data', fixtures: 'data', seeds: 'data', logs: 'logs', log: 'logs', fonts: 'fonts', media: 'media', audio: 'media', video: 'media',
};

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const idFor = (kind, artwork, mode, state = '') =>
  `_${kind}_${artwork.replaceAll('-', '_')}${state ? `_${state}` : ''}_${mode}`;

function labelSize(label) {
  if (label.length <= 1) return '4.6';
  if (label.length === 2) return '3.9';
  return '3.05';
}

function fileSvg([, label, accent], mode) {
  const dark = mode === 'dark';
  const paperTop = dark ? '#F7F9FF' : '#FFFFFF';
  const paperBottom = dark ? '#9AA8BD' : '#DDE3EC';
  const outline = dark ? '#D1D8E4' : '#68758A';
  const line = dark ? '#D8DEE9' : '#7E899B';
  const badgeInk = '#111722';
  const genericDetails = `
    <path d="M5.25 7.1h4.9M5.25 9h3.8M5.25 10.9h4.35" fill="none" stroke="${line}" stroke-width=".8" stroke-linecap="round" opacity=".9"/>`;
  const badge = `
    <rect x="2.05" y="9.05" width="11.9" height="4.75" rx="2.18" fill="${accent}" fill-opacity="${dark ? '.94' : '.9'}" stroke="${dark ? '#FFFFFF' : '#FFFFFF'}" stroke-opacity="${dark ? '.3' : '.76'}" stroke-width=".45"/>
    <path d="M3.18 10.05c1.65-.62 6.38-.78 9.58-.1" fill="none" stroke="#FFFFFF" stroke-width=".48" stroke-linecap="round" opacity=".38"/>
    <text x="8" y="12.48" text-anchor="middle" fill="${badgeInk}" font-family="-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" font-size="${labelSize(label)}" font-weight="750" letter-spacing="-.08">${escapeXml(label)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <defs>
    <linearGradient id="paper" x1="4" y1="1.5" x2="11.8" y2="14.4" gradientUnits="userSpaceOnUse">
      <stop stop-color="${paperTop}" stop-opacity="${dark ? '.31' : '.98'}"/>
      <stop offset="1" stop-color="${paperBottom}" stop-opacity="${dark ? '.16' : '.86'}"/>
    </linearGradient>
  </defs>
  <path d="M4.25 1.35h4.47l3.53 3.53v8.2c0 .92-.75 1.67-1.67 1.67H4.25c-.92 0-1.67-.75-1.67-1.67V3.02c0-.92.75-1.67 1.67-1.67Z" fill="url(#paper)" stroke="${outline}" stroke-opacity="${dark ? '.78' : '.9'}" stroke-width=".72" stroke-linejoin="round"/>
  <path d="M8.72 1.52v2.3c0 .68.55 1.23 1.23 1.23h2.13" fill="none" stroke="${outline}" stroke-opacity=".8" stroke-width=".68" stroke-linejoin="round"/>
  <path d="M3.45 2.8c.22-.42.6-.65 1.15-.67h3.18" fill="none" stroke="#FFFFFF" stroke-width=".5" stroke-linecap="round" opacity="${dark ? '.45' : '.9'}"/>${label ? badge : genericDetails}
</svg>
`;
}

function folderSvg([, label, accent], mode, expanded) {
  const dark = mode === 'dark';
  const outline = dark ? '#D6E7FF' : '#526D91';
  const backOpacity = dark ? '.88' : '.94';
  const frontOpacity = dark ? '.82' : '.9';
  const glyph = label ? `
  <rect x="7.02" y="8.2" width="6.25" height="4.15" rx="1.86" fill="#FFFFFF" fill-opacity="${dark ? '.22' : '.6'}" stroke="#FFFFFF" stroke-opacity="${dark ? '.35' : '.74'}" stroke-width=".42"/>
  <text x="10.15" y="11.03" text-anchor="middle" fill="${dark ? '#FFFFFF' : '#222A35'}" font-family="-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif" font-size="${labelSize(label)}" font-weight="760" letter-spacing="-.1">${escapeXml(label)}</text>` : '';

  const shape = expanded
    ? `<path d="M1.55 5.55h12.9l-1.28 7.1c-.15.85-.88 1.47-1.75 1.47H3.02c-.86 0-1.6-.62-1.75-1.47L.64 8.93c-.17-.98.58-1.88 1.58-1.88h2.22l.94-1.5h8.94" fill="url(#folder)" stroke="${outline}" stroke-opacity="${dark ? '.72' : '.82'}" stroke-width=".68" stroke-linejoin="round"/>`
    : `<path d="M1.55 4.05c0-.85.69-1.54 1.54-1.54h2.77l1.4 1.55h5.65c.85 0 1.54.69 1.54 1.54v6.86c0 .85-.69 1.54-1.54 1.54H3.09c-.85 0-1.54-.69-1.54-1.54V4.05Z" fill="url(#folder)" stroke="${outline}" stroke-opacity="${dark ? '.72' : '.82'}" stroke-width=".68" stroke-linejoin="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <defs>
    <linearGradient id="folder" x1="2.2" y1="2.4" x2="13.7" y2="14.2" gradientUnits="userSpaceOnUse">
      <stop stop-color="${accent}" stop-opacity="${backOpacity}"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="${frontOpacity}"/>
    </linearGradient>
  </defs>
  ${shape}
  <path d="M2.35 ${expanded ? '8.3' : '5.3'}c2.65-.62 7.55-.62 11.02.04" fill="none" stroke="#FFFFFF" stroke-width=".62" stroke-linecap="round" opacity="${dark ? '.35' : '.52'}"/>${glyph}
</svg>
`;
}

const mapAssociations = (mapping, kind, mode, state = '') => Object.fromEntries(
  Object.entries(mapping).map(([key, artwork]) => [key, idFor(kind, artwork, mode, state)]),
);

async function build() {
  const iconDefinitions = {};

  for (const mode of ['dark', 'light']) {
    await mkdir(join(artworkRoot, mode), { recursive: true });

    for (const artwork of fileArtwork) {
      const [name] = artwork;
      const filename = `file-${name}.svg`;
      await writeFile(join(artworkRoot, mode, filename), fileSvg(artwork, mode), 'utf8');
      iconDefinitions[idFor('file', name, mode)] = { iconPath: `../icons/files/${mode}/${filename}` };
    }

    for (const artwork of folderArtwork) {
      const [name] = artwork;
      for (const expanded of [false, true]) {
        const state = expanded ? 'open' : '';
        const filename = `folder-${name}${expanded ? '-open' : ''}.svg`;
        await writeFile(join(artworkRoot, mode, filename), folderSvg(artwork, mode, expanded), 'utf8');
        iconDefinitions[idFor('folder', name, mode, state)] = { iconPath: `../icons/files/${mode}/${filename}` };
      }
    }
  }

  const associations = (mode) => ({
    file: idFor('file', 'default', mode),
    folder: idFor('folder', 'folder', mode),
    folderExpanded: idFor('folder', 'folder', mode, 'open'),
    rootFolder: idFor('folder', 'root', mode),
    rootFolderExpanded: idFor('folder', 'root', mode, 'open'),
    languageIds: mapAssociations(languageIds, 'file', mode),
    fileExtensions: mapAssociations(fileExtensions, 'file', mode),
    fileNames: mapAssociations(fileNames, 'file', mode),
    folderNames: mapAssociations(folderNames, 'folder', mode),
    folderNamesExpanded: mapAssociations(folderNames, 'folder', mode, 'open'),
  });

  const dark = associations('dark');
  const light = associations('light');
  const theme = {
    $schema: 'vscode://schemas/icon-theme',
    hidesExplorerArrows: false,
    // Keep unrecognised files inside this visual system instead of importing
    // unrelated language-contributor artwork.
    showLanguageModeIcons: false,
    iconDefinitions,
    ...dark,
    light,
  };

  await mkdir(dirname(themePath), { recursive: true });
  await writeFile(themePath, `${JSON.stringify(theme, null, 2)}\n`, 'utf8');

  // Keep validation dependency-free so the generator is useful during packaging.
  const parsed = JSON.parse(await readFile(themePath, 'utf8'));
  const referencedIds = new Set();
  const collect = (section) => {
    for (const key of ['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded']) {
      if (section[key]) referencedIds.add(section[key]);
    }
    for (const key of ['languageIds', 'fileExtensions', 'fileNames', 'folderNames', 'folderNamesExpanded']) {
      Object.values(section[key] ?? {}).forEach((id) => referencedIds.add(id));
    }
  };
  collect(parsed);
  collect(parsed.light ?? {});

  const missingDefinitions = [...referencedIds].filter((id) => !parsed.iconDefinitions[id]);
  if (missingDefinitions.length) {
    throw new Error(`Missing icon definitions: ${missingDefinitions.join(', ')}`);
  }

  const missingFiles = [];
  for (const [id, definition] of Object.entries(parsed.iconDefinitions)) {
    try {
      await readFile(join(dirname(themePath), definition.iconPath));
    } catch {
      missingFiles.push(`${id}: ${definition.iconPath}`);
    }
  }
  if (missingFiles.length) throw new Error(`Missing SVG files:\n${missingFiles.join('\n')}`);

  console.log(`Golden Gate file icons generated: ${Object.keys(iconDefinitions).length} SVG definitions.`);
  console.log(`Mappings: ${Object.keys(fileExtensions).length} extensions, ${Object.keys(fileNames).length} names, ${Object.keys(languageIds).length} languages, ${Object.keys(folderNames).length} folder names.`);
  console.log(`Validated theme: ${relative(projectRoot, themePath)} (${referencedIds.size} referenced definitions).`);
}

await build();
