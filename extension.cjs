const vscode = require("vscode");
const preset = require("./appearance-preset.json");
const { AppearanceManager } = require("./lib/appearance-manager.cjs");
const { registerCopilotToggle } = require("./lib/copilot-toggle.cjs");

async function activate(context) {
  registerCopilotToggle(vscode, context.subscriptions);
  const manager = new AppearanceManager(vscode, context.globalState, preset);
  context.subscriptions.push(manager);
  await manager.start();
}

function deactivate() {}

module.exports = { activate, deactivate };
