const ENABLE_COMMAND = "github.copilot.chat.completions.enable";
const DISABLE_COMMAND = "github.copilot.chat.completions.disable";

function registerCopilotToggle(vscode, subscriptions) {
  subscriptions.push(
    vscode.commands.registerCommand("macosGoldenGate.copilot.enable", () =>
      vscode.commands.executeCommand(ENABLE_COMMAND)
    ),
    vscode.commands.registerCommand("macosGoldenGate.copilot.disable", () =>
      vscode.commands.executeCommand(DISABLE_COMMAND)
    )
  );
}

module.exports = { DISABLE_COMMAND, ENABLE_COMMAND, registerCopilotToggle };
