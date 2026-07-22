const assert = require("node:assert/strict");
const test = require("node:test");
const {
  DISABLE_COMMAND,
  ENABLE_COMMAND,
  registerCopilotToggle
} = require("../lib/copilot-toggle.cjs");

test("Copilot toolbar actions execute explicit enable and disable commands", async () => {
  const handlers = new Map();
  const executed = [];
  const subscriptions = [];
  const vscode = {
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
