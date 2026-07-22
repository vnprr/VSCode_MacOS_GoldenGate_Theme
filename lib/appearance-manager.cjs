const GOLDEN_GATE_THEMES = new Set([
  "macOS Golden Gate — Light",
  "macOS Golden Gate — Dark"
]);

const STATE_KEY = "macosGoldenGate.previousAppearance.v1";

function valuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

class AppearanceManager {
  constructor(vscode, globalState, preset) {
    this.vscode = vscode;
    this.globalState = globalState;
    this.preset = preset;
    this.listener = undefined;
    this.queue = Promise.resolve();
  }

  async start() {
    await this.reconcile();
    this.listener = this.vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("workbench.colorTheme")) {
        this.scheduleReconcile();
      }
    });
  }

  dispose() {
    this.listener?.dispose();
  }

  scheduleReconcile() {
    this.queue = this.queue
      .then(() => this.reconcile())
      .catch((error) => console.error("macOS Golden Gate appearance error", error));
    return this.queue;
  }

  async reconcile() {
    const configuration = this.vscode.workspace.getConfiguration();
    const theme = configuration.get("workbench.colorTheme");
    const state = this.globalState.get(STATE_KEY);

    if (GOLDEN_GATE_THEMES.has(theme)) {
      if (state) await this.syncPreset(configuration, state);
      else await this.applyPreset(configuration);
    } else if (state) {
      await this.restorePreset(configuration, state);
    }
  }

  async applyPreset(configuration) {
    const backup = {};
    for (const key of Object.keys(this.preset)) {
      const inspected = configuration.inspect(key);
      const value = inspected?.globalValue;
      backup[key] = value === undefined ? { hasValue: false } : { hasValue: true, value };
    }

    const state = { backup, applied: {} };
    await this.globalState.update(STATE_KEY, state);

    for (const [key, value] of Object.entries(this.preset)) {
      await configuration.update(key, value, this.vscode.ConfigurationTarget.Global);
      state.applied[key] = value;
      await this.globalState.update(STATE_KEY, state);
    }
  }

  async syncPreset(configuration, state) {
    state.backup ??= {};
    state.applied ??= {};

    for (const [key, appliedValue] of Object.entries(state.applied)) {
      if (Object.hasOwn(this.preset, key)) continue;

      const currentGlobalValue = configuration.inspect(key)?.globalValue;
      if (valuesEqual(currentGlobalValue, appliedValue)) {
        const previous = state.backup[key];
        await configuration.update(
          key,
          previous?.hasValue ? previous.value : undefined,
          this.vscode.ConfigurationTarget.Global
        );
      }
      delete state.applied[key];
      delete state.backup[key];
    }

    for (const [key, desiredValue] of Object.entries(this.preset)) {
      if (!Object.hasOwn(state.applied, key)) {
        const value = configuration.inspect(key)?.globalValue;
        state.backup[key] = value === undefined ? { hasValue: false } : { hasValue: true, value };
        await configuration.update(key, desiredValue, this.vscode.ConfigurationTarget.Global);
        state.applied[key] = desiredValue;
        continue;
      }

      const appliedValue = state.applied[key];
      const currentGlobalValue = configuration.inspect(key)?.globalValue;
      if (
        valuesEqual(currentGlobalValue, appliedValue) &&
        !valuesEqual(appliedValue, desiredValue)
      ) {
        await configuration.update(key, desiredValue, this.vscode.ConfigurationTarget.Global);
        state.applied[key] = desiredValue;
      }
    }

    await this.globalState.update(STATE_KEY, state);
  }

  async restorePreset(configuration, state) {
    const remaining = {};

    for (const [key, appliedValue] of Object.entries(state.applied ?? {})) {
      try {
        const currentGlobalValue = configuration.inspect(key)?.globalValue;
        if (valuesEqual(currentGlobalValue, appliedValue)) {
          const previous = state.backup?.[key];
          await configuration.update(
            key,
            previous?.hasValue ? previous.value : undefined,
            this.vscode.ConfigurationTarget.Global
          );
        }
      } catch (error) {
        remaining[key] = appliedValue;
        console.error(`Could not restore ${key}`, error);
      }
    }

    if (Object.keys(remaining).length === 0) {
      await this.globalState.update(STATE_KEY, undefined);
    } else {
      await this.globalState.update(STATE_KEY, { ...state, applied: remaining });
    }
  }
}

module.exports = { AppearanceManager, GOLDEN_GATE_THEMES, STATE_KEY, valuesEqual };
