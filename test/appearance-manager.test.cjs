const assert = require("node:assert/strict");
const test = require("node:test");
const { AppearanceManager, STATE_KEY } = require("../lib/appearance-manager.cjs");

function createHarness(initialGlobal = {}, preset = {
  "workbench.iconTheme": "golden-files",
  "editor.fontFamily": "SF Mono"
}) {
  const globalValues = new Map(Object.entries(initialGlobal));
  let theme = "Default Light Modern";
  let listener;
  const stored = new Map();

  const configuration = {
    get(key) {
      if (key === "workbench.colorTheme") return theme;
      return globalValues.get(key);
    },
    inspect(key) {
      return { globalValue: globalValues.get(key) };
    },
    async update(key, value) {
      if (value === undefined) globalValues.delete(key);
      else globalValues.set(key, value);
    }
  };

  const vscode = {
    ConfigurationTarget: { Global: 1 },
    workspace: {
      getConfiguration: () => configuration,
      onDidChangeConfiguration(callback) {
        listener = callback;
        return { dispose() { listener = undefined; } };
      }
    }
  };

  const globalState = {
    get: (key) => stored.get(key),
    async update(key, value) {
      if (value === undefined) stored.delete(key);
      else stored.set(key, structuredClone(value));
    }
  };

  const manager = new AppearanceManager(vscode, globalState, preset);

  return {
    globalValues,
    globalState,
    manager,
    vscode,
    setTheme(value) { theme = value; },
    async notifyThemeChange() {
      listener?.({ affectsConfiguration: (key) => key === "workbench.colorTheme" });
      await manager.queue;
    }
  };
}

test("does nothing while another theme is selected", async () => {
  const harness = createHarness({ "workbench.iconTheme": "old-icons" });
  await harness.manager.start();
  assert.equal(harness.globalValues.get("workbench.iconTheme"), "old-icons");
  assert.equal(harness.globalState.get(STATE_KEY), undefined);
});

test("applies the full preset after selecting Golden Gate", async () => {
  const harness = createHarness({ "workbench.iconTheme": "old-icons" });
  await harness.manager.start();
  harness.setTheme("macOS Golden Gate — Light");
  await harness.notifyThemeChange();
  assert.equal(harness.globalValues.get("workbench.iconTheme"), "golden-files");
  assert.equal(harness.globalValues.get("editor.fontFamily"), "SF Mono");
  assert.ok(harness.globalState.get(STATE_KEY));
});

test("restores previous values and removes values that were previously absent", async () => {
  const harness = createHarness({ "workbench.iconTheme": "old-icons" });
  await harness.manager.start();
  harness.setTheme("macOS Golden Gate — Dark");
  await harness.notifyThemeChange();
  harness.setTheme("Default Dark Modern");
  await harness.notifyThemeChange();
  assert.equal(harness.globalValues.get("workbench.iconTheme"), "old-icons");
  assert.equal(harness.globalValues.has("editor.fontFamily"), false);
  assert.equal(harness.globalState.get(STATE_KEY), undefined);
});

test("does not overwrite a managed setting changed by the user", async () => {
  const harness = createHarness({ "workbench.iconTheme": "old-icons" });
  await harness.manager.start();
  harness.setTheme("macOS Golden Gate — Light");
  await harness.notifyThemeChange();
  harness.globalValues.set("workbench.iconTheme", "my-new-icons");
  harness.setTheme("Default Light Modern");
  await harness.notifyThemeChange();
  assert.equal(harness.globalValues.get("workbench.iconTheme"), "my-new-icons");
});

test("restores stale state on startup when Golden Gate is no longer selected", async () => {
  const harness = createHarness({ "workbench.iconTheme": "old-icons" });
  harness.setTheme("macOS Golden Gate — Light");
  await harness.manager.start();
  harness.setTheme("Default Light Modern");
  harness.manager.dispose();
  await harness.manager.start();
  assert.equal(harness.globalValues.get("workbench.iconTheme"), "old-icons");
  assert.equal(harness.globalState.get(STATE_KEY), undefined);
});

test("updates an untouched managed value when a new extension version changes the preset", async () => {
  const harness = createHarness(
    { "workbench.editor.tabSizing": "fit" },
    { "workbench.editor.tabSizing": "fit" }
  );
  harness.setTheme("macOS Golden Gate — Light");
  await harness.manager.start();
  harness.manager.dispose();

  const upgradedManager = new AppearanceManager(harness.vscode, harness.globalState, {
    "workbench.editor.tabSizing": "shrink"
  });
  await upgradedManager.start();

  assert.equal(harness.globalValues.get("workbench.editor.tabSizing"), "shrink");
  const state = harness.globalState.get(STATE_KEY);
  assert.equal(state.applied["workbench.editor.tabSizing"], "shrink");
  assert.deepEqual(state.backup["workbench.editor.tabSizing"], {
    hasValue: true,
    value: "fit"
  });
});

test("does not apply an upgraded preset over a manual override", async () => {
  const harness = createHarness(
    { "workbench.editor.tabSizing": "fit" },
    { "workbench.editor.tabSizing": "fit" }
  );
  harness.setTheme("macOS Golden Gate — Light");
  await harness.manager.start();
  harness.globalValues.set("workbench.editor.tabSizing", "fixed");
  harness.manager.dispose();

  const upgradedManager = new AppearanceManager(harness.vscode, harness.globalState, {
    "workbench.editor.tabSizing": "shrink"
  });
  await upgradedManager.start();

  assert.equal(harness.globalValues.get("workbench.editor.tabSizing"), "fixed");
});
