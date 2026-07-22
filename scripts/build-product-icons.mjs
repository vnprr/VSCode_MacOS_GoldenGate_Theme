#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productIconRoot = path.join(projectRoot, 'product-icons');
const fontRoot = path.join(productIconRoot, 'fonts');
const licenseRoot = path.join(projectRoot, 'assets', 'licenses');

const PHOSPHOR_VERSION = '2.1.2';
const FONT_ID = 'phosphor-regular';
const FONT_FILE = 'Phosphor-Regular.woff2';
const CONTROLS_FONT_ID = 'golden-gate-controls';
const CONTROLS_FONT_FILE = 'GoldenGateControls.ttf';
const COMPACT_CLOSE_CODE_POINT = 0xe000;
const COMPACT_CLOSE_SCALE = 0.7;

// Layout glyphs encode direction, docking and visibility. Phosphor does not
// provide every exact state, while VS Code's own Codicons do. Omitting these
// IDs is the official product-icon-theme fallback and preserves their meaning.
const NATIVE_LAYOUT_ICON_IDS = new Set([
  'layout', 'editor-layout', 'configure-layout-icon',
  'layout-activitybar-left', 'layout-activitybar-right',
  'layout-sidebar-left', 'layout-sidebar-left-dock', 'layout-sidebar-left-off',
  'layout-sidebar-right', 'layout-sidebar-right-dock', 'layout-sidebar-right-off',
  'activity-bar-left', 'activity-bar-right',
  'auxiliarybar-left-layout-icon', 'auxiliarybar-left-off-layout-icon',
  'auxiliarybar-right-layout-icon', 'auxiliarybar-right-off-layout-icon',
  'panel-left', 'panel-left-off', 'panel-right', 'panel-right-off',
  'layout-panel', 'layout-panel-center', 'layout-panel-dock',
  'layout-panel-justify', 'layout-panel-left', 'layout-panel-off',
  'layout-panel-right', 'panel-bottom', 'panel-layout-icon',
  'panel-layout-icon-off', 'panel-align-center', 'panel-align-justify',
  'panel-align-left', 'panel-align-right', 'layout-menubar',
  'layout-statusbar', 'layout-centered',
]);

// Product icon IDs are grouped by the Phosphor Regular glyph that replaces
// them. Keeping the aliases here makes the generated JSON deterministic and
// keeps workbench-specific IDs in step with their matching public Codicon ID.
const ICON_GROUPS = {
  // Accounts, settings, and primary workbench destinations.
  'user-circle': [
    'account', 'person', 'accounts-view-bar-icon', 'ai-customization-user',
  ],
  'user-plus': ['person-add'],
  'users-three': ['organization'],
  'gear': [
    'gear', 'settings', 'settings-gear', 'settings-view-bar-icon',
    'settings-editor-label-icon', 'preferences-editor-label-icon',
    'models-management-editor-label-icon', 'debug-configure', 'debug-console',
    'extensions-manage', 'notifications-configure', 'settings-more-action',
    'tasks-list-configure', 'terminal-configure-profile',
    'testing-update-profiles', 'theme-selection-manage-extension',
  ],
  'files': ['files', 'explorer-view-icon'],
  'magnifying-glass': [
    'search', 'search-large', 'search-view-icon', 'search-editor-label-icon',
    'go-to-search', 'terminal-command-history-fuzzy-search', 'inspect',
    'search-fuzzy', 'search-see-more',
  ],
  'git-branch': [
    'git-branch', 'source-control', 'source-control-view-icon',
    'terminal-symbol-branch',
  ],
  'bug': [
    'bug', 'debug', 'debug-all', 'debug-alt', 'debug-alt-small', 'run-view-icon',
    'breakpoints-view-icon', 'callstack-view-icon', 'callstack-view-session',
    'loaded-scripts-view-icon', 'variables-view-icon', 'watch-view-icon',
    'disassembly-editor-label-icon', 'chat-debug-editor-label-icon',
    'testing-debug-icon', 'testing-debug-all-icon',
  ],
  'squares-four': [
    'extensions', 'extensions-large', 'extensions-view-icon',
    'extensions-editor-label-icon', 'extension-default-icon',
    'runtime-extensions-editor-label-icon', 'agent-plugin-editor-icon',
    'ai-customization-extension',
  ],
  'flask': ['beaker', 'test-view-icon'],
  'list-checks': ['checklist', 'tasklist', 'test-results-icon'],
  'chat-circle-dots': [
    'comment', 'comment-draft', 'comment-unresolved', 'feedback',
    'remote-explorer-report-issues', 'survey',
  ],
  'chats-circle': [
    'comment-discussion', 'comment-discussion-quote',
    'comment-discussion-sparkle', 'comments-view-icon',
  ],
  'sparkle': [
    'sparkle', 'sparkle-filled', 'chat-sparkle', 'chat-view-icon',
    'chat-editor-label-icon', 'chat-model-provider-generic',
    'chat-model-provider-gemini', 'search-sparkle', 'search-sparkle-empty',
    'search-sparkle-filled', 'preferences-ai-results', 'start-inline-chat',
    'ai-customization-view-icon', 'symbol-misc',
  ],
  'monitor': [
    'remote', 'remote-explorer', 'remote-explorer-view-icon',
    'extensions-remote', 'mcp-server-remote', 'terminal-symbol-remote', 'vr',
  ],
  'plug': ['plug', 'ports-view-icon', 'ai-customization-plugin', 'debug-connected'],
  'hard-drives': [
    'server', 'server-environment', 'server-process', 'mcp-server',
    'mcp-server-editor-icon', 'ai-customization-mcp-server',
    'notebook-kernel-select', 'process-explorer-editor-label-icon', 'mcp',
  ],
  'terminal': [
    'terminal', 'terminal-bash', 'terminal-cmd', 'terminal-debian',
    'terminal-git-bash', 'terminal-linux', 'terminal-powershell',
    'terminal-tmux', 'terminal-ubuntu', 'terminal-view-icon',
  ],
  'terminal-window': [
    'output', 'output-view-icon', 'terminal-command-history-output',
    'debug-console-view-icon', 'debug-line-by-line', 'repl-editor-label-icon',
  ],

  // Common toolbar actions and state.
  'plus': [
    'add', 'add-small', 'ports-forward-icon', 'terminal-new',
    'keybindings-add', 'watch-expressions-add',
    'watch-expressions-add-function-breakpoint', 'ai-customization-add',
    'hover-increase-verbosity', 'diff-insert', 'diff-review-insert',
  ],
  'minus': [
    'remove', 'remove-small', 'hover-decrease-verbosity', 'diff-remove',
    'diff-review-remove', 'dash', 'horizontal-rule',
  ],
  'x': [
    'chrome-close', 'auxiliarybar-close', 'color-picker-close',
    'diff-review-close', 'panel-close', 'ports-stop-forward-icon',
    'search-remove', 'settings-remove', 'terminal-command-history-remove',
    'widget-close', 'workspace-trust-editor-cross', 'notifications-clear',
    'preferences-clear-input', 'profiles-editor-remove-folder',
    'tasks-remove', 'watch-expression-remove',
    'workspace-trust-editor-remove-folder',
  ],
  'x-circle': [
    'error', 'error-small', 'extensions-error-message',
    'notebook-state-error', 'terminal-decoration-error',
    'testing-failed-icon', 'chat-sparkle-error',
  ],
  'broom': [
    'clear-all', 'close-all', 'breakpoints-remove-all',
    'debug-console-clear-all', 'extensions-clear-search-results',
    'notebook-clear', 'notifications-clear-all', 'search-clear-results',
    'watch-expressions-remove-all',
  ],
  'check': [
    'check', 'notebook-state-success', 'notebook-stop-edit',
    'testing-was-covered', 'workspace-trust-editor-check',
  ],
  'checks': ['check-all'],
  'check-circle': [
    'pass', 'pass-filled', 'getting-started-step-checked',
    'testing-passed-icon', 'git-branch-staged-changes',
  ],
  'circle': [
    'circle', 'circle-large', 'circle-large-filled',
    'circle-small', 'circle-small-filled', 'record', 'record-small',
    'ports-forwarded-with-process-icon',
    'ports-forwarded-without-process-icon', 'terminal-decoration-incomplete',
    'terminal-decoration-mark', 'terminal-decoration-success',
    'testing-unset-icon', 'getting-started-step-unchecked',
    'debug-breakpoint', 'debug-breakpoint-conditional',
    'debug-breakpoint-data', 'debug-breakpoint-function',
    'debug-breakpoint-log', 'debug-stackframe',
    'debug-stackframe-focused', 'debug-stackframe-active',
  ],
  'circle-dashed': [
    'unverified', 'debug-breakpoint-unverified', 'debug-breakpoint-pending',
    'debug-breakpoint-conditional-unverified',
    'debug-breakpoint-data-unverified',
    'debug-breakpoint-function-unverified',
    'debug-breakpoint-log-unverified',
  ],
  'warning': [
    'warning', 'extensions-warning-message', 'markers-view-icon',
    'workspace-trust-banner', 'bracket-error', 'chat-sparkle-warning',
    'git-branch-conflicts', 'run-errors', 'testing-error-icon',
  ],
  'warning-circle': ['issues', 'issue-draft', 'issue-reopened'],
  'info': ['info', 'extensions-info-message'],
  'question': ['question', 'ask', 'testing-missing-branch'],
  'bell': ['bell', 'bell-dot'],
  'bell-slash': [
    'bell-slash', 'bell-slash-dot', 'notifications-do-not-disturb',
  ],
  'eye': [
    'eye', 'preview', 'notebook-render-output', 'testing-continuous-is-on',
    'testing-turn-continuous-run-on',
  ],
  'eye-closed': [
    'eye-closed', 'testing-hidden', 'testing-turn-continuous-run-off',
  ],
  'lock': [
    'lock', 'lock-small', 'extensions-private', 'private-ports-view-icon',
  ],
  'lock-open': ['unlock'],
  'shield-check': ['verified', 'verified-filled', 'extensions-verified-publisher', 'workspace-trusted'],
  'shield-warning': ['workspace-untrusted'],
  'seal-question': ['workspace-unknown'],
  'shield': [
    'shield', 'extension-workspace-trust', 'workspace-trust-editor-label-icon',
  ],

  // Navigation, disclosure, and sorting.
  'caret-right': [
    'chevron-right', 'triangle-right', 'find-collapsed', 'folding-collapsed',
    'inline-suggestion-hints-next', 'notebook-collapsed',
    'search-hide-replace', 'suggest-more-info', 'view-pane-container-collapsed',
    'breadcrumb-separator', 'debug-console-evaluation-prompt',
    'fold', 'fold-down',
  ],
  'caret-left': [
    'chevron-left', 'triangle-left', 'inline-suggestion-hints-previous',
  ],
  'caret-down': [
    'chevron-down', 'triangle-down', 'find-expanded', 'folding-expanded',
    'markers-view-multi-line-collapsed', 'notebook-expanded',
    'notifications-collapse', 'notifications-expand-down',
    'notifications-hide', 'parameter-hints-next', 'search-show-replace',
    'settings-folder-dropdown', 'view-pane-container-expanded',
  ],
  'caret-up': [
    'chevron-up', 'triangle-up', 'markers-view-multi-line-expanded',
    'notifications-collapse-up', 'notifications-expand',
    'notifications-hide-up', 'parameter-hints-previous',
    'review-comment-collapse', 'fold-up',
  ],
  'arrow-right': [
    'arrow-right', 'arrow-small-right', 'forward',
    'debug-console-evaluation-input',
  ],
  'arrow-left': ['arrow-left', 'arrow-small-left', 'debug-step-back'],
  'arrow-down': [
    'arrow-down', 'arrow-small-down', 'diff-editor-next-change',
    'find-next-match', 'goto-next-location', 'marker-navigation-next',
    'notebook-diff-editor-next-change', 'notebook-move-down',
  ],
  'arrow-up': [
    'arrow-up', 'arrow-small-up', 'diff-editor-previous-change',
    'find-previous-match', 'goto-previous-location',
    'marker-navigation-previous', 'notebook-diff-editor-previous-change',
    'notebook-move-up',
  ],
  'arrows-left-right': [
    'arrow-both', 'arrow-swap', 'git-compare', 'replace', 'replace-all',
    'find-replace', 'find-replace-all', 'search-replace',
    'search-replace-all', 'notifications-position', 'mirror',
  ],
  'arrows-down-up': ['sort-precedence', 'keybindings-sort'],
  'arrow-circle-down': ['arrow-circle-down'],
  'arrow-circle-left': ['arrow-circle-left'],
  'arrow-circle-right': ['arrow-circle-right'],
  'arrow-circle-up': ['arrow-circle-up'],
  'arrow-square-out': [
    'link-external', 'open-in-product', 'open-in-window', 'open-preview',
    'ports-open-browser-icon', 'ports-open-preview-icon',
  ],
  'arrows-clockwise': [
    'refresh', 'sync', 'debug-restart', 'debug-rerun',
    'extension-restart-required', 'extensions-refresh',
    'extensions-sync-enabled', 'notebook-state-executing', 'rerun-task',
    'search-refresh', 'settings-sync-view-icon', 'testing-refresh-tests',
    'testing-rerun-icon', 'timeline-refresh', 'redo',
  ],
  'arrows-counter-clockwise': ['sync-ignored', 'extensions-sync-ignored'],
  'arrow-counter-clockwise': [
    'discard', 'notebook-revert', 'settings-discard', 'debug-restart-frame',
  ],
  'clock-counter-clockwise': [
    'history', 'extension-activation-time', 'testing-queued-icon',
    'timeline-open', 'timeline-view-icon', 'voice-transcripts-view-icon',
  ],
  'clock': ['clockface', 'watch', 'notebook-state-pending', 'ai-customization-automation'],
  'circle-notch': ['loading', 'session-in-progress'],

  // Windows and layout controls.
  'layout': ['layout', 'editor-layout', 'configure-layout-icon'],
  'sidebar-simple': [
    'layout-activitybar-left', 'layout-activitybar-right',
    'layout-sidebar-left', 'layout-sidebar-left-dock',
    'layout-sidebar-left-off', 'layout-sidebar-right',
    'layout-sidebar-right-dock', 'layout-sidebar-right-off',
    'activity-bar-left', 'activity-bar-right',
    'auxiliarybar-left-layout-icon', 'auxiliarybar-left-off-layout-icon',
    'auxiliarybar-right-layout-icon', 'auxiliarybar-right-off-layout-icon',
    'panel-left', 'panel-left-off', 'panel-right', 'panel-right-off',
  ],
  'rows': [
    'layout-panel', 'layout-panel-center', 'layout-panel-dock',
    'layout-panel-justify', 'layout-panel-left', 'layout-panel-off',
    'layout-panel-right', 'panel-bottom', 'panel-layout-icon',
    'panel-layout-icon-off', 'panel-align-center', 'panel-align-justify',
    'panel-align-left', 'panel-align-right', 'symbol-interface',
    'layout-menubar', 'layout-statusbar',
  ],
  'columns': ['layout-centered'],
  'split-horizontal': ['split-horizontal'],
  'split-vertical': ['split-vertical', 'notebook-split-cell'],
  'app-window': [
    'window', 'window-active', 'empty-window', 'multiple-windows',
    'default-view-icon',
  ],
  'browser': ['browser'],
  'corners-out': ['screen-full', 'fullscreen', 'auxiliarybar-maximize', 'panel-maximize'],
  'corners-in': ['screen-normal', 'chrome-restore'],
  'minus-square': ['chrome-minimize'],
  'square': ['chrome-maximize', 'primitive-square', 'notebook-stop'],

  // Files, folders, editing, and documents.
  'file': ['file'],
  'file-text': ['file-text'],
  'file-code': [
    'file-code', 'markdown', 'notebook-open-as-text',
    'terminal-symbol-file', 'symbol-file',
  ],
  'file-image': ['file-media', 'image-carousel-editor-label-icon'],
  'file-pdf': ['file-pdf'],
  'file-zip': ['file-zip', 'file-binary', 'debug-inspect-memory'],
  'file-magnifying-glass': [
    'go-to-file', 'language-models-open-settings',
    'preferences-open-settings', 'search-open-in-file',
    'terminal-command-history-open-file',
  ],
  'file-plus': ['new-file', 'search-new-editor'],
  'folder': [
    'folder', 'root-folder', 'project', 'workspace-trust-editor-folder-picker',
    'ai-customization-workspace', 'mcp-server-workspace',
    'terminal-symbol-folder',
  ],
  'folder-open': ['folder-opened', 'root-folder-opened', 'folder-active'],
  'folder-plus': ['new-folder'],
  'folders': ['folder-library', 'library'],
  'book': [
    'book', 'open-editors-view-icon', 'remote-explorer-documentation',
    'ai-customization-instructions',
  ],
  'books': ['collection', 'collection-small', 'new-collection'],
  'bookmark': ['bookmark', 'ai-customization-prompt'],
  'notebook': ['notebook', 'notebook-template'],
  'floppy-disk': ['save', 'save-all', 'save-as', 'notebook-save'],
  'copy': ['copy', 'notebook-copy'],
  'clipboard': ['clippy', 'ports-copy-address-icon'],
  'paperclip': ['attach'],
  'download': ['download', 'desktop-download'],
  'cloud-arrow-down': [
    'cloud-download', 'edit-sessions-view-icon', 'extensions-install-count',
    'extensions-install-local-in-remote',
    'extensions-install-workspace-recommended', 'go-to-editing-session',
  ],
  'cloud-arrow-up': ['cloud-upload'],
  'cloud': ['cloud', 'cloud-small'],
  'pencil-simple': [
    'edit', 'edit-code', 'edit-session', 'edit-sparkle', 'rename',
    'keybindings-edit', 'notebook-edit', 'profiles-editor-edit-folder',
    'settings-edit', 'terminal-rename', 'workspace-trust-editor-edit-folder',
    'extensions-configure-recommended',
  ],
  'trash': [
    'trash', 'debug-remove-config', 'notebook-delete-cell', 'terminal-kill',
  ],
  'eraser': ['eraser'],
  'archive': ['archive', 'unarchive', 'git-stash', 'git-stash-apply', 'git-stash-pop', 'terminal-symbol-stash'],
  'package': ['package', 'symbol-namespace'],
  'export': ['export'],
  'arrow-square-in': ['import'],

  // Search, lists, and editor utilities.
  'funnel': [
    'filter', 'filter-filled', 'list-filter', 'find-filter',
    'extensions-filter', 'testing-filter', 'timeline-filter',
    'preferences-filter',
  ],
  'funnel-x': ['exclude'],
  'list': ['menu', 'three-bars'],
  'list-bullets': ['list-flat', 'list-unordered', 'search-list', 'testing-show-as-list-icon'],
  'list-numbers': ['list-ordered', 'symbol-enum', 'terminal-symbol-option'],
  'tree-view': ['list-tree', 'search-tree'],
  'list-magnifying-glass': ['search-show-context'],
  'arrows-in': ['collapse-all', 'debug-collapse-all', 'search-collapse-results'],
  'arrows-out': ['expand-all', 'search-expand-results', 'unfold'],
  'dots-three': ['ellipsis', 'search-details', 'bracket-dot'],
  'dots-three-vertical': ['kebab-vertical'],
  'dots-six-vertical': ['grabber', 'gripper', 'debug-gripper'],
  'asterisk': ['regex'],
  'text-aa': ['case-sensitive', 'preserve-case', 'whole-word', 'text-size'],
  'selection-all': ['list-selection', 'find-selection'],
  'paragraph': [
    'whitespace', 'diff-editor-toggle-whitespace',
    'notebook-diff-cell-toggle-whitespace', 'no-newline',
  ],
  'arrow-bend-down-left': ['newline', 'word-wrap'],
  'arrow-bend-up-left': ['reply'],
  'text-indent': ['indent'],
  'text-b': ['bold'],
  'text-italic': ['italic'],
  'text-strikethrough': ['strikethrough'],
  'paint-bucket': ['paintcan', 'color-mode'],
  'palette': ['symbol-color'],
  'lightbulb': [
    'lightbulb', 'lightbulb-empty', 'gutter-lightbulb',
    'getting-started-beginner', 'refactor-preview-view-icon',
    'ai-customization-skill',
  ],
  'magic-wand': [
    'wand', 'lightbulb-autofix', 'lightbulb-sparkle',
    'gutter-lightbulb-aifix-auto-fix', 'gutter-lightbulb-auto-fix',
    'gutter-lightbulb-sparkle', 'gutter-lightbulb-sparkle-filled',
  ],
  'hammer': ['build'],

  // Source control and repositories.
  'git-commit': ['git-commit', 'terminal-symbol-commit'],
  'git-merge': ['git-merge', 'merge', 'merge-into', 'combine'],
  'git-diff': [
    'diff', 'diff-single', 'diff-multiple', 'code-review',
    'multi-diff-editor-label-icon',
  ],
  'git-pull-request': [
    'git-pull-request', 'git-pull-request-closed',
    'git-pull-request-create', 'git-pull-request-done',
    'git-pull-request-draft', 'git-pull-request-go-to-changes',
    'git-pull-request-new-changes', 'terminal-symbol-pull-request',
    'terminal-symbol-pull-request-done',
  ],
  'git-fork': ['repo-forked', 'worktree', 'worktree-small'],
  'github-logo': [
    'github', 'github-alt', 'github-inverted', 'github-project',
    'github-action', 'octoface',
  ],
  'folder-simple': [
    'repo', 'repo-clone', 'repo-fetch', 'repo-force-push', 'repo-pinned',
    'repo-pull', 'repo-push', 'repo-selected',
  ],
  'plus-circle': ['diff-added', 'git-branch-changes', 'new-session'],
  'minus-circle': ['diff-removed'],
  'pencil-circle': ['diff-modified', 'diff-renamed'],
  'circle-half': ['diff-ignored'],
  'tray-arrow-down': ['git-fetch'],

  // Run, debug, breakpoints, and testing.
  'play': [
    'play', 'debug-start', 'debug-continue', 'debug-run', 'run-all',
    'run-above', 'run-below', 'run-with-deps', 'notebook-execute',
    'notebook-execute-above', 'notebook-execute-all',
    'notebook-execute-below', 'testing-run-icon', 'testing-run-all-icon',
    'ai-customization-run', 'debug-continue-small',
  ],
  'play-circle': ['play-circle'],
  'pause': ['debug-pause'],
  'stop': [
    'debug-stop', 'debug-disconnect', 'search-stop', 'beaker-stop',
    'testing-cancel-icon', 'testing-cancel-refresh-tests',
  ],
  'stop-circle': ['stop-circle'],
  'skip-forward': ['debug-step-over', 'testing-skipped-icon', 'skip'],
  'skip-back': ['debug-reverse-continue'],
  'arrow-down-right': ['debug-step-into'],
  'arrow-up-right': ['debug-step-out'],
  'prohibit': [
    'activate-breakpoints', 'breakpoints-activate', 'circle-slash',
    'debug-breakpoint-disabled',
    'debug-breakpoint-conditional-disabled',
    'debug-breakpoint-data-disabled', 'debug-breakpoint-function-disabled',
    'debug-breakpoint-log-disabled', 'debug-breakpoint-unsupported',
  ],
  'chart-bar': ['coverage', 'debug-coverage', 'testing-coverage'],
  'chart-pie': [
    'pie-chart', 'run-coverage', 'run-all-coverage',
    'testing-coverage-icon', 'testing-coverage-all-icon',
  ],

  // Code symbols and language-oriented glyphs.
  'code': [
    'code', 'code-oss', 'notebook-mimetype', 'azure', 'azure-devops',
    'openai', 'python', 'ruby', 'snake', 'squirrel', 'vscode',
    'vscode-insiders',
  ],
  'code-block': ['gist', 'gist-secret', 'symbol-snippet'],
  'brackets-square': ['symbol-array'],
  'toggle-left': ['symbol-boolean'],
  'cube': ['symbol-class', 'outline-view-icon'],
  'lock-key': ['symbol-constant'],
  'number-circle-one': ['symbol-enum-member', 'terminal-symbol-option-value'],
  'lightning': ['symbol-event', 'getting-started-setup', 'ai-customization-hook'],
  'text-t': ['symbol-field'],
  'key': ['key', 'symbol-key', 'symbol-keyword', 'terminal-symbol-symbol-text'],
  'function': [
    'symbol-method', 'symbol-method-arrow', 'terminal-symbol-alias',
    'terminal-symbol-method',
  ],
  'hash': ['symbol-numeric', 'index-zero'],
  'math-operations': ['symbol-operator'],
  'brackets-round': ['symbol-parameter', 'terminal-symbol-argument'],
  'wrench': ['symbol-property', 'tools', 'ai-customization-tools'],
  'ruler': ['symbol-ruler'],
  'quotes': ['symbol-string', 'quote', 'quotes'],
  'tree-structure': [
    'symbol-structure', 'type-hierarchy', 'type-hierarchy-sub',
    'type-hierarchy-super', 'group-by-ref-type',
    'ungroup-by-ref-type', 'file-submodule',
  ],
  'textbox': ['symbol-variable', 'variable-group', 'watch-expressions-add-data-breakpoint'],
  'brackets-curly': ['json'],

  // Communication, media, status, and remaining common Codicons.
  'link': [
    'link', 'references', 'file-symlink-directory', 'file-symlink-file',
    'terminal-symbol-symbolic-link-file',
    'terminal-symbol-symbolic-link-folder',
  ],
  'at': ['mention'],
  'envelope': ['mail'],
  'envelope-open': ['mail-read'],
  'paper-plane-tilt': ['send', 'send-to-remote-agent'],
  'microphone': ['mic', 'mic-filled'],
  'speaker-slash': ['mute'],
  'speaker-high': ['unmute'],
  'smiley': ['smiley', 'reactions'],
  'thumbs-up': ['thumbsup', 'thumbsup-filled'],
  'thumbs-down': ['thumbsdown', 'thumbsdown-filled'],
  'heart': ['heart', 'heart-filled', 'extensions-sponsor'],
  'star': [
    'star-empty', 'star-full', 'star-half', 'extensions-rating',
    'extensions-star-empty', 'extensions-star-full',
    'extensions-star-half', 'mcp-server-starred', 'timeline-pin',
    'timeline-unpin', 'ai-customization-builtin',
    'remote-explorer-get-started', 'terminal-symbol-inline-suggestion',
  ],
  'flag': ['flag', 'milestone', 'terminal-symbol-flag'],
  'tag': ['tag', 'ports-label-icon', 'terminal-symbol-tag'],
  'map-pin': ['location'],
  'map-trifold': ['map', 'map-filled', 'map-vertical', 'map-vertical-filled'],
  'tray': ['inbox'],
  'globe': ['globe'],
  'compass': ['compass', 'compass-active', 'compass-dot'],
  'broadcast': ['broadcast', 'radio-tower', 'live-share'],
  'database': ['database'],
  'gauge': ['dashboard'],
  'cpu': ['chip', 'circuit-board'],
  'desktop-tower': ['vm', 'vm-active', 'vm-connect', 'vm-outline', 'vm-pending', 'vm-running', 'vm-small'],
  'device-mobile': ['device-mobile'],
  'camera': ['device-camera'],
  'video-camera': ['device-camera-video'],
  'image': ['image'],
  'music-note': ['music', 'piano'],
  'game-controller': ['game'],
  't-shirt': ['jersey'],
  'phone-incoming': ['call-incoming', 'callhierarchy-incoming'],
  'phone-outgoing': ['call-outgoing', 'callhierarchy-outgoing'],
  'briefcase': ['briefcase'],
  'calendar': ['calendar'],
  'credit-card': ['credit-card'],
  'gift': ['gift'],
  'coffee': ['coffee'],
  'flame': ['flame'],
  'rocket': ['rocket'],
  'robot': [
    'robot', 'hubot', 'agent', 'ai-customization-agent', 'claude',
    'copilot', 'copilot-blocked', 'copilot-error', 'copilot-in-progress',
    'copilot-large', 'copilot-not-connected', 'copilot-snooze',
    'copilot-success', 'copilot-unavailable', 'copilot-warning',
    'copilot-warning-large', 'chat-model-provider-claude',
    'chat-model-provider-copilot', 'chat-model-provider-openai',
  ],
  'brain': ['thinking', 'debug-hint'],
  'binoculars': ['telescope'],
  'scales': ['law', 'mcp-server-license'],
  'megaphone': [
    'megaphone', 'issue-reporter', 'twitter', 'remote-explorer-feedback',
  ],
  'article': ['report', 'remote-explorer-review-issues', 'request-changes'],
  'rss': ['rss'],
  'keyboard': [
    'keyboard-tab', 'keyboard-tab-above', 'keyboard-tab-below',
    'keybindings-editor-label-icon', 'record-keys', 'keybindings-record-keys',
  ],
  'cursor-text': ['cursor', 'insert'],
  'magnet': ['magnet'],
  'push-pin': ['pin', 'pinned', 'pinned-dirty'],
  'percent': ['percentage'],
  'target': ['target'],
  'pulse': ['pulse'],
  'graph': ['graph', 'graph-left', 'graph-line', 'graph-scatter'],
  'table': ['table'],
  'stack': ['layers', 'layers-active', 'layers-dot', 'versions', 'extensions-pre-release'],
  'share': ['share'],
  'sign-in': ['sign-in'],
  'sign-out': ['sign-out'],
  'house': ['home'],
  'note': ['note'],
  'graduation-cap': ['mortar-board'],
  'paint-brush': ['surround-with'],
  'arrows-out-cardinal': ['move'],
  'magnifying-glass-plus': ['zoom-in'],
  'magnifying-glass-minus': ['zoom-out'],
  'scissors': ['screen-cut'],
};

function parseGlyphs(css) {
  const glyphs = new Map();
  const rule = /\.ph\.ph-([a-z0-9-]+):before\s*\{\s*content:\s*"\\([0-9a-f]+)";\s*\}/gi;

  for (const match of css.matchAll(rule)) {
    glyphs.set(match[1], match[2].toLowerCase());
  }

  if (glyphs.size < 1000) {
    throw new Error(`Expected the Phosphor Regular CSS to expose at least 1000 glyphs; found ${glyphs.size}.`);
  }

  return glyphs;
}

function buildIconDefinitions(glyphs) {
  const definitions = {};
  const assignedBy = new Map();

  for (const [phosphorName, iconIds] of Object.entries(ICON_GROUPS)) {
    const codePoint = glyphs.get(phosphorName);
    if (!codePoint) {
      throw new Error(`Phosphor Regular ${PHOSPHOR_VERSION} has no "${phosphorName}" glyph.`);
    }

    for (const iconId of iconIds) {
      if (NATIVE_LAYOUT_ICON_IDS.has(iconId)) continue;

      const previous = assignedBy.get(iconId);
      if (previous && previous !== phosphorName) {
        throw new Error(`Product icon "${iconId}" is assigned to both "${previous}" and "${phosphorName}".`);
      }

      assignedBy.set(iconId, phosphorName);
      definitions[iconId] = {
        fontCharacter: `\\${codePoint}`,
        fontId: FONT_ID,
      };
    }
  }

  // These two aliases are the controls used by editor tabs. A dedicated font
  // lets the close glyph be genuinely smaller because product icon themes do
  // not expose a per-icon font-size. The dirty state uses Phosphor's compact
  // outlined dot instead of the much larger filled circle.
  definitions.close = {
    fontCharacter: `\\${COMPACT_CLOSE_CODE_POINT.toString(16)}`,
    fontId: CONTROLS_FONT_ID,
  };
  definitions['circle-filled'] = {
    fontCharacter: `\\${glyphs.get('dot-outline')}`,
    fontId: FONT_ID,
  };

  return Object.fromEntries(Object.entries(definitions).sort(([left], [right]) => left.localeCompare(right)));
}

function transformPath(opentype, sourcePath, scale, centerX, centerY) {
  const path = new opentype.Path();
  path.commands = sourcePath.commands.map((command) => {
    const transformed = { ...command };
    for (const key of ['x', 'x1', 'x2']) {
      if (typeof transformed[key] === 'number') {
        transformed[key] = centerX + (transformed[key] - centerX) * scale;
      }
    }
    for (const key of ['y', 'y1', 'y2']) {
      if (typeof transformed[key] === 'number') {
        transformed[key] = centerY + (transformed[key] - centerY) * scale;
      }
    }
    return transformed;
  });
  return path;
}

function buildControlsFont(opentype, sourceFont, xCodePoint) {
  const sourceGlyph = sourceFont.charToGlyph(String.fromCodePoint(xCodePoint));
  const bounds = sourceGlyph.getBoundingBox();
  const centerX = (bounds.x1 + bounds.x2) / 2;
  const centerY = (bounds.y1 + bounds.y2) / 2;
  const emptyPath = new opentype.Path();
  const closePath = transformPath(
    opentype,
    sourceGlyph.path,
    COMPACT_CLOSE_SCALE,
    centerX,
    centerY,
  );
  const glyphs = [
    new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: sourceFont.unitsPerEm,
      path: emptyPath,
    }),
    new opentype.Glyph({
      name: 'compact-close',
      unicode: COMPACT_CLOSE_CODE_POINT,
      advanceWidth: sourceGlyph.advanceWidth,
      path: closePath,
    }),
  ];

  return new opentype.Font({
    familyName: 'Golden Gate Controls',
    styleName: 'Regular',
    unitsPerEm: sourceFont.unitsPerEm,
    ascender: sourceFont.ascender,
    descender: sourceFont.descender,
    glyphs,
    version: 'Version 1.0',
    description: 'Compact tab controls derived from Phosphor Icons Regular.',
    copyright: 'Copyright Phosphor Icons. Licensed under the MIT License.',
    license: 'MIT License',
    licenseURL: 'https://opensource.org/license/mit',
  });
}

async function main() {
  let regularCssPath;
  try {
    regularCssPath = require.resolve('@phosphor-icons/web/regular');
  } catch (error) {
    throw new Error('Missing @phosphor-icons/web. Run npm install before building product icons.', { cause: error });
  }

  const packageRoot = path.resolve(path.dirname(regularCssPath), '..', '..');
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  if (packageJson.version !== PHOSPHOR_VERSION) {
    throw new Error(
      `Expected @phosphor-icons/web ${PHOSPHOR_VERSION}, found ${packageJson.version}. ` +
      'The version is pinned because icon-font code points are build inputs.',
    );
  }

  const css = await readFile(regularCssPath, 'utf8');
  const glyphs = parseGlyphs(css);
  const xCodePoint = Number.parseInt(glyphs.get('x'), 16);
  const opentypeModule = await import('opentype.js');
  const opentype = opentypeModule.default ?? opentypeModule;
  const sourceFont = opentype.loadSync(path.join(path.dirname(regularCssPath), 'Phosphor.ttf'));
  const controlsFont = buildControlsFont(opentype, sourceFont, xCodePoint);
  const iconDefinitions = buildIconDefinitions(glyphs);
  const theme = {
    $schema: 'vscode://schemas/product-icon-theme',
    fonts: [
      {
        id: FONT_ID,
        src: [{ path: `./fonts/${FONT_FILE}`, format: 'woff2' }],
        weight: 'normal',
        style: 'normal',
      },
      {
        id: CONTROLS_FONT_ID,
        src: [{ path: `./fonts/${CONTROLS_FONT_FILE}`, format: 'truetype' }],
        weight: 'normal',
        style: 'normal',
      },
    ],
    iconDefinitions,
  };

  await Promise.all([
    mkdir(fontRoot, { recursive: true }),
    mkdir(licenseRoot, { recursive: true }),
  ]);

  await Promise.all([
    copyFile(path.join(path.dirname(regularCssPath), 'Phosphor.woff2'), path.join(fontRoot, FONT_FILE)),
    writeFile(path.join(fontRoot, CONTROLS_FONT_FILE), Buffer.from(controlsFont.toArrayBuffer())),
    copyFile(path.join(packageRoot, 'LICENSE'), path.join(licenseRoot, 'PHOSPHOR-ICONS-MIT.txt')),
    writeFile(
      path.join(productIconRoot, 'golden-gate-product-icon-theme.json'),
      `${JSON.stringify(theme, null, 2)}\n`,
      'utf8',
    ),
  ]);

  console.log(
    `Built Golden Gate product icon theme: ${Object.keys(iconDefinitions).length} product IDs, ` +
    `${NATIVE_LAYOUT_ICON_IDS.size} native layout fallbacks, ` +
    `${Object.keys(ICON_GROUPS).length} Phosphor glyph groups.`,
  );
}

await main();
