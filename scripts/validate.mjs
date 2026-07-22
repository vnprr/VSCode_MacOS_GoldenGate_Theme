import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  const absolutePath = resolve(projectRoot, relativePath);
  try {
    return JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
    return null;
  }
}

async function walk(relativeDirectory) {
  const absoluteDirectory = resolve(projectRoot, relativeDirectory);
  if (!(await exists(absoluteDirectory))) return [];
  const output = [];
  for (const entry of await readdir(absoluteDirectory, { withFileTypes: true })) {
    const relativePath = `${relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) output.push(...(await walk(relativePath)));
    else output.push(relativePath);
  }
  return output;
}

function isColor(value) {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
    value
  );
}

function toRgba(hex) {
  let value = hex.slice(1);
  if (value.length === 3 || value.length === 4) {
    value = [...value].map((character) => character + character).join("");
  }
  if (value.length === 6) value += "FF";
  return {
    r: Number.parseInt(value.slice(0, 2), 16) / 255,
    g: Number.parseInt(value.slice(2, 4), 16) / 255,
    b: Number.parseInt(value.slice(4, 6), 16) / 255,
    a: Number.parseInt(value.slice(6, 8), 16) / 255
  };
}

function composite(top, bottom) {
  const alpha = top.a + bottom.a * (1 - top.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
    g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
    b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
    a: alpha
  };
}

function luminance(color) {
  const convert = (channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  return (
    0.2126 * convert(color.r) +
    0.7152 * convert(color.g) +
    0.0722 * convert(color.b)
  );
}

function contrast(foreground, background, base) {
  const baseColor = toRgba(base);
  const backgroundColor = composite(toRgba(background), baseColor);
  const foregroundColor = composite(toRgba(foreground), backgroundColor);
  const lighter = Math.max(luminance(foregroundColor), luminance(backgroundColor));
  const darker = Math.min(luminance(foregroundColor), luminance(backgroundColor));
  return (lighter + 0.05) / (darker + 0.05);
}

function inspectColorValue(value, location) {
  if (typeof value === "string" && value.startsWith("#") && !isColor(value)) {
    fail(`${location}: invalid color ${value}`);
  }
}

function inspectNestedColors(value, location) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectNestedColors(entry, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") {
    inspectColorValue(value, location);
    return;
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    inspectNestedColors(nestedValue, `${location}.${key}`);
  }
}

async function validateThemes(packageJson) {
  for (const contribution of packageJson.contributes?.themes ?? []) {
    const relativePath = contribution.path.replace(/^\.\//, "");
    const theme = await readJson(relativePath);
    if (!theme) continue;
    if (theme.name !== contribution.label) {
      fail(`${relativePath}: theme name must match contribution label`);
    }
    const expectedType = contribution.uiTheme === "vs-dark" ? "dark" : "light";
    if (theme.type !== expectedType) {
      fail(`${relativePath}: expected type ${expectedType}, got ${theme.type}`);
    }
    if (Object.keys(theme.colors ?? {}).length < 500) {
      fail(`${relativePath}: expected broad workbench coverage (at least 500 colors)`);
    }
    if ((theme.tokenColors ?? []).length < 25) {
      fail(`${relativePath}: expected at least 25 TextMate rules`);
    }
    if (Object.keys(theme.semanticTokenColors ?? {}).length < 20) {
      fail(`${relativePath}: expected at least 20 semantic token rules`);
    }
    inspectNestedColors(theme.colors, `${relativePath}.colors`);
    inspectNestedColors(theme.tokenColors, `${relativePath}.tokenColors`);
    inspectNestedColors(
      theme.semanticTokenColors,
      `${relativePath}.semanticTokenColors`
    );

    const base = theme.colors["editor.background"];
    const contrastPairs = [
      ["editor.foreground", "editor.background", 7],
      ["sideBar.foreground", "sideBar.background", 7],
      ["statusBar.foreground", "statusBar.background", 4.5],
      ["button.foreground", "button.background", 4.5],
      ["input.foreground", "input.background", 7],
      ["textLink.foreground", "editor.background", 4.5]
    ];
    for (const [foregroundKey, backgroundKey, minimum] of contrastPairs) {
      const ratio = contrast(
        theme.colors[foregroundKey],
        theme.colors[backgroundKey],
        base
      );
      if (ratio < minimum) {
        fail(
          `${relativePath}: ${foregroundKey} on ${backgroundKey} is ${ratio.toFixed(2)}:1; expected ${minimum}:1`
        );
      }
    }

    const selectedControlForegrounds = [
      "activityBar.foreground",
      "activityBarTop.foreground"
    ];
    for (const colorKey of selectedControlForegrounds) {
      if (theme.colors[colorKey] !== theme.colors.foreground) {
        fail(
          `${relativePath}: ${colorKey} must match foreground for selected controls`
        );
      }
    }
    const passiveControlForegrounds = [
      "icon.foreground",
      "titleBar.activeForeground"
    ];
    for (const colorKey of passiveControlForegrounds) {
      if (theme.colors[colorKey] !== theme.colors.descriptionForeground) {
        fail(
          `${relativePath}: ${colorKey} must match descriptionForeground so passive Codicons and product icons share one neutral toolbar color`
        );
      }
    }
    if (
      theme.colors["list.activeSelectionBackground"] !==
      theme.colors["tab.activeBackground"]
    ) {
      fail(
        `${relativePath}: drag preview surface must match the active Modern UI tab`
      );
    }
    if (!/^#[0-9a-f]{6}$/i.test(theme.colors["tab.activeBackground"])) {
      fail(`${relativePath}: tab.activeBackground must be an opaque fade-matched surface`);
    }
    if (
      theme.colors["tab.hoverBackground"] !== theme.colors["tab.activeBackground"] ||
      theme.colors["tab.unfocusedHoverBackground"] !==
        theme.colors["tab.unfocusedActiveBackground"]
    ) {
      fail(`${relativePath}: tab hover fades must match active tab surfaces`);
    }
    const neutralDropSurfaces = [
      "list.dropBackground",
      "sideBar.dropBackground",
      "editorGroup.dropBackground",
      "panelSection.dropBackground",
      "terminal.dropBackground"
    ];
    if (new Set(neutralDropSurfaces.map((key) => theme.colors[key])).size !== 1) {
      fail(`${relativePath}: drop surfaces must share one neutral material`);
    }
    notes.push(
      `${contribution.label}: ${Object.keys(theme.colors).length} UI colors, ${theme.tokenColors.length} TextMate rules`
    );
  }
}

function collectDefinitionReferences(value, output = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectDefinitionReferences(entry, output);
  } else if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key !== "iconDefinitions") collectDefinitionReferences(nestedValue, output);
    }
  } else if (typeof value === "string" && value.startsWith("_")) {
    output.push(value);
  }
  return output;
}

async function validateFileIcons(packageJson) {
  for (const contribution of packageJson.contributes?.iconThemes ?? []) {
    const relativePath = contribution.path.replace(/^\.\//, "");
    const manifest = await readJson(relativePath);
    if (!manifest) continue;
    const definitions = manifest.iconDefinitions ?? {};
    if (Object.keys(definitions).length < 150) {
      fail(`${relativePath}: expected at least 150 adaptive icon definitions`);
    }
    for (const [id, definition] of Object.entries(definitions)) {
      if (!definition.iconPath) {
        fail(`${relativePath}: ${id} has no iconPath`);
        continue;
      }
      const iconPath = resolve(projectRoot, dirname(relativePath), definition.iconPath);
      if (!(await exists(iconPath))) {
        fail(`${relativePath}: missing icon for ${id}: ${definition.iconPath}`);
      }
    }
    const references = collectDefinitionReferences(manifest);
    for (const reference of references) {
      if (!definitions[reference]) {
        fail(`${relativePath}: undefined icon reference ${reference}`);
      }
    }
    notes.push(
      `${contribution.label}: ${Object.keys(definitions).length} adaptive definitions, ${references.length} associations`
    );
  }

  const svgFiles = await walk("icons/files");
  if (svgFiles.length < 300) {
    fail(`icons/files: expected at least 300 light/dark SVG assets, got ${svgFiles.length}`);
  }
  for (const relativePath of svgFiles.filter((path) => extname(path) === ".svg")) {
    const source = await readFile(resolve(projectRoot, relativePath), "utf8");
    if (!source.includes("<svg") || !source.includes("</svg>")) {
      fail(`${relativePath}: malformed SVG wrapper`);
    }
    if (/<script\b|<foreignObject\b|\b(?:xlink:)?href\s*=/i.test(source)) {
      fail(`${relativePath}: SVG contains disallowed active or external content`);
    }
  }
}

async function validateProductIcons(packageJson) {
  for (const contribution of packageJson.contributes?.productIconThemes ?? []) {
    const relativePath = contribution.path.replace(/^\.\//, "");
    const manifest = await readJson(relativePath);
    if (!manifest) continue;
    if ((manifest.fonts ?? []).length === 0) {
      fail(`${relativePath}: no product icon font declared`);
    }
    for (const font of manifest.fonts ?? []) {
      for (const source of font.src ?? []) {
        const fontPath = resolve(projectRoot, dirname(relativePath), source.path);
        if (!(await exists(fontPath))) {
          fail(`${relativePath}: missing font ${source.path}`);
        }
      }
    }
    const definitions = manifest.iconDefinitions ?? {};
    if (Object.keys(definitions).length < 100) {
      fail(`${relativePath}: expected at least 100 product icon overrides`);
    }
    for (const [id, definition] of Object.entries(definitions)) {
      if (!definition.fontCharacter || typeof definition.fontCharacter !== "string") {
        fail(`${relativePath}: ${id} has no fontCharacter`);
      }
    }
    const close = definitions.close;
    if (
      close?.fontId !== "golden-gate-controls" ||
      close?.fontCharacter !== "\\e000"
    ) {
      fail(`${relativePath}: close must use the compact Golden Gate control glyph`);
    }
    const dirty = definitions["circle-filled"];
    if (
      dirty?.fontId !== "golden-gate-controls" ||
      dirty?.fontCharacter !== "\\e001"
    ) {
      fail(`${relativePath}: circle-filled must use the compact filled dot`);
    }
    const terminalSuccess = definitions["terminal-decoration-success"];
    if (
      terminalSuccess?.fontId !== "golden-gate-controls" ||
      terminalSuccess?.fontCharacter !== "\\e001"
    ) {
      fail(`${relativePath}: terminal success decoration must use the compact filled dot`);
    }
    const controlsFont = (manifest.fonts ?? []).find(
      (font) => font.id === "golden-gate-controls"
    );
    const controlsSource = controlsFont?.src?.[0]?.path;
    if (!controlsSource) {
      fail(`${relativePath}: compact controls font is missing`);
    } else {
      const controlsPath = resolve(projectRoot, dirname(relativePath), controlsSource);
      const opentypeModule = await import("opentype.js");
      const opentype = opentypeModule.default ?? opentypeModule;
      const font = opentype.loadSync(controlsPath);
      const dotGlyph = font.charToGlyph(String.fromCodePoint(0xe001));
      const closedContours = dotGlyph.path.commands.filter(
        (command) => command.type === "Z"
      ).length;
      if (closedContours !== 1) {
        fail(`${relativePath}: filled dot must contain one solid contour without a hole`);
      }
    }
    notes.push(
      `${contribution.label}: ${Object.keys(definitions).length} rounded product glyph overrides`
    );
  }
}

async function validatePackagePaths(packageJson) {
  for (const collection of ["themes", "iconThemes", "productIconThemes"]) {
    for (const contribution of packageJson.contributes?.[collection] ?? []) {
      const path = contribution.path.replace(/^\.\//, "");
      if (!(await exists(resolve(projectRoot, path)))) {
        fail(`package.json: missing ${collection} contribution ${contribution.path}`);
      }
    }
  }
  if (!(await exists(resolve(projectRoot, "assets/licenses/PHOSPHOR-ICONS-MIT.txt")))) {
    fail("Missing Phosphor Icons attribution/license file");
  }

  const projectFiles = (
    await Promise.all(
      ["themes", "icons", "product-icons", "file-icons", "assets"].map((directory) =>
        walk(directory)
      )
    )
  ).flat();
  const bundledAppleFont = projectFiles.find((path) =>
    /(?:sfpro|sfmono|sfns|sfsymbol).+\.(?:ttf|otf|woff2?)$/i.test(path)
  );
  if (bundledAppleFont) {
    fail(`Proprietary Apple font/symbol asset must not be bundled: ${bundledAppleFont}`);
  }
}

async function validateOneClickExperience(packageJson) {
  const mainPath = packageJson.main?.replace(/^\.\//, "");
  if (!mainPath || !(await exists(resolve(projectRoot, mainPath)))) {
    fail(`package.json: missing one-click extension entry point ${packageJson.main ?? "(none)"}`);
  }
  if (!(packageJson.activationEvents ?? []).includes("*")) {
    fail('package.json: one-click appearance manager must activate with "*"');
  }
  const commandIds = new Set(
    (packageJson.contributes?.commands ?? []).map((command) => command.command)
  );
  for (const command of [
    "macosGoldenGate.copilot.enable",
    "macosGoldenGate.copilot.disable"
  ]) {
    if (!commandIds.has(command)) {
      fail(`package.json: missing synchronized Copilot toolbar action ${command}`);
    }
  }

  const preset = await readJson("appearance-preset.json");
  const workspaceSettings = await readJson(".vscode/settings.json");
  if (!preset || !workspaceSettings) return;

  const workspaceAppearance = { ...workspaceSettings };
  delete workspaceAppearance["workbench.colorTheme"];
  const presetKeys = Object.keys(preset).sort();
  const workspaceKeys = Object.keys(workspaceAppearance).sort();
  if (JSON.stringify(presetKeys) !== JSON.stringify(workspaceKeys)) {
    fail("appearance-preset.json: keys must match .vscode/settings.json except workbench.colorTheme");
  }
  for (const [key, value] of Object.entries(preset)) {
    if (JSON.stringify(value) !== JSON.stringify(workspaceAppearance[key])) {
      fail(`appearance-preset.json: ${key} differs from .vscode/settings.json`);
    }
  }

  if (preset["workbench.iconTheme"] !== "macos-golden-gate-files") {
    fail("appearance-preset.json: file icon theme is not enabled");
  }
  if (preset["workbench.productIconTheme"] !== "macos-golden-gate-symbols") {
    fail("appearance-preset.json: product icon theme is not enabled");
  }
  if (!String(preset["editor.fontFamily"]).includes("SF Mono")) {
    fail("appearance-preset.json: editor does not prefer SF Mono");
  }
  if (!String(preset["terminal.integrated.fontFamily"]).includes("SF Mono")) {
    fail("appearance-preset.json: terminal does not prefer SF Mono");
  }
  if (preset["workbench.editor.tabSizing"] !== "shrink") {
    fail("appearance-preset.json: tabSizing must use the clean drag preview path");
  }
  if (
    preset["editor.scrollbar.vertical"] !== "auto" ||
    preset["editor.scrollbar.horizontal"] !== "auto" ||
    preset["workbench.editor.titleScrollbarVisibility"] !== "auto"
  ) {
    fail("appearance-preset.json: supported scrollbars must use automatic visibility");
  }
  notes.push(`One-click appearance preset: ${presetKeys.length} managed settings`);
}

const packageJson = await readJson("package.json");
if (packageJson) {
  await validatePackagePaths(packageJson);
  await validateOneClickExperience(packageJson);
  await validateThemes(packageJson);
  await validateFileIcons(packageJson);
  await validateProductIcons(packageJson);
}

if (errors.length > 0) {
  console.error("Golden Gate validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Golden Gate validation passed.\n");
  for (const note of notes) console.log(`- ${note}`);
}
