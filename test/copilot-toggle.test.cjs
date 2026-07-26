const assert = require("node:assert/strict");
const test = require("node:test");
const {
  DISABLE_COMMAND,
  ENABLE_COMMAND,
  executeCopilotCommand,
  registerCopilotToggle
} = require("../lib/copilot-toggle.cjs");

test("Copilot toolbar actions execute explicit enable and disable commands", async () => {
  const handlers = new Map();
  const executed = [];
  const subscriptions = [];
  const vscode = {
    window: {
      showErrorMessage() {
        assert.fail("No error message expected");
      }
    },
    commands: {
      registerCommand(command, handler) {
        handlers.set(command, handler);
        return { dispose() {} };
      },
      executeCommand(command) {
        executed.push(command);
      }
    }
  };

  registerCopilotToggle(vscode, subscriptions);
  assert.equal(subscriptions.length, 2);

  await handlers.get("macosGoldenGate.copilot.enable")();
  await handlers.get("macosGoldenGate.copilot.disable")();
  assert.deepEqual(executed, [ENABLE_COMMAND, DISABLE_COMMAND]);
});

test("Copilot toolbar reports a failed official command instead of failing silently", async () => {
  const messages = [];
  const vscode = {
    commands: {
      async executeCommand() {
        throw new Error("command unavailable");
      }
    },
    window: {
      async showErrorMessage(message) {
        messages.push(message);
      }
    }
  };

  assert.equal(await executeCopilotCommand(vscode, ENABLE_COMMAND), false);
  assert.deepEqual(messages, [
    "GitHub Copilot inline suggestions could not be switched. command unavailable"
  ]);
});
