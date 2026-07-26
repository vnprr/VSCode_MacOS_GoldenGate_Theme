const ENABLE_COMMAND = "github.copilot.chat.completions.enable";
const DISABLE_COMMAND = "github.copilot.chat.completions.disable";

async function executeCopilotCommand(vscode, command) {
  try {
    await vscode.commands.executeCommand(command);
    return true;
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    await vscode.window.showErrorMessage(
      `GitHub Copilot inline suggestions could not be switched.${detail}`
    );
    return false;
  }
}

function registerCopilotToggle(vscode, subscriptions) {
  subscriptions.push(
    vscode.commands.registerCommand("macosGoldenGate.copilot.enable", () =>
      executeCopilotCommand(vscode, ENABLE_COMMAND)
    ),
    vscode.commands.registerCommand("macosGoldenGate.copilot.disable", () =>
      executeCopilotCommand(vscode, DISABLE_COMMAND)
    )
  );
}

module.exports = {
  DISABLE_COMMAND,
  ENABLE_COMMAND,
  executeCopilotCommand,
  registerCopilotToggle
};
