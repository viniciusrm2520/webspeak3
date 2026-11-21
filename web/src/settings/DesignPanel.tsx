import { useContext, useRef, useState } from "react";
import {
  type CustomTheme,
  type DesignTheme,
  designThemeLabel,
  DisplayPrefsContext,
  isDesignTheme,
  resolveDesignThemeBase,
  type TreeOptions,
} from "../app/prefs";
import { downloadBlob } from "../app/shared";
import { ActionIcon } from "../components/ui";
import { useT } from "../i18n";
import { parseIconPack } from "../iconpack";
import { DesignStorePanel } from "./DesignStorePanel";

type CustomThemeDraft = { id: string | null; name: string; baseTheme: DesignTheme; css: string };

export function DesignPanel({
  designSelection,
  onSelectionChange,
  customThemes,
  onSaveCustomTheme,
  onDeleteCustomTheme,
  idePixelFont,
  onIdePixelFontChange,
}: {
  designSelection: string;
  onSelectionChange: (next: string) => void;
  customThemes: CustomTheme[];
  onSaveCustomTheme: (theme: CustomTheme) => void;
  onDeleteCustomTheme: (id: string) => void;
  idePixelFont: boolean;
  onIdePixelFontChange: (on: boolean) => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState<CustomThemeDraft | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const prefs = useContext(DisplayPrefsContext);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const iconPackInputRef = useRef<HTMLInputElement | null>(null);

  const builtins: { id: DesignTheme; name: string; desc: string }[] = [
    { id: "standard", name: t("design.theme.standard"), desc: t("design.theme.standard.desc") },
    { id: "nova", name: t("design.theme.nova"), desc: t("design.theme.nova.desc") },
    { id: "pulse", name: t("design.theme.pulse"), desc: t("design.theme.pulse.desc") },
    { id: "ide", name: t("design.theme.ide"), desc: t("design.theme.ide.desc") },
  ];

  const handleSaveEditing = () => {
    if (!editing || !editing.name.trim()) return;
    const id = editing.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    onSaveCustomTheme({ id, name: editing.name.trim(), baseTheme: editing.baseTheme, css: editing.css });
    onSelectionChange(`custom:${id}`);
    setEditing(null);
  };

  const handleExport = (theme: CustomTheme) => {
    const blob = new Blob(
      [JSON.stringify({ name: theme.name, baseTheme: theme.baseTheme, css: theme.css }, null, 2)],
      { type: "application/json" }
    );
    downloadBlob(blob, `${theme.name.replace(/[^a-z0-9-_]+/gi, "_") || "theme"}.webspeak3theme.json`);
  };

  const handleImportSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (
        !parsed ||
        typeof parsed.name !== "string" ||
        !isDesignTheme(parsed.baseTheme) ||
        typeof parsed.css !== "string"
      ) {
        window.alert(t("design.custom.importError"));
        return;
      }
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      onSaveCustomTheme({ id, name: parsed.name, baseTheme: parsed.baseTheme, css: parsed.css });
      onSelectionChange(`custom:${id}`);
    } catch {
      window.alert(t("design.custom.importError"));
    }
  };

  const handleIconPackSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const pack = await parseIconPack(file);
      if (!pack) {
        window.alert(t("design.iconPack.importError"));
        return;
      }
      prefs.saveIconPacks([...prefs.iconPacks, pack]);
      prefs.setIconPackId(pack.id);
    } catch {
      window.alert(t("design.iconPack.importError"));
    }
  };

  if (storeOpen) {
    return (
      <DesignStorePanel
        customThemes={customThemes}
        onInstall={(theme) => {
          const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
          onSaveCustomTheme({ id, name: theme.name, baseTheme: theme.baseTheme, css: theme.css });
          onSelectionChange(`custom:${id}`);
        }}
        onClose={() => setStoreOpen(false)}
      />
    );
  }

  if (editing) {
    return (
      <>
        <h3>{editing.id ? t("design.custom.editTitle") : t("design.custom.newTitle")}</h3>
        <label className="ts-options-field">
          {t("design.custom.name")}
          <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
        </label>
        <label className="ts-options-field">
          {t("design.custom.base")}
          <select
            value={editing.baseTheme}
            onChange={(e) => setEditing({ ...editing, baseTheme: e.target.value as DesignTheme })}
          >
            <option value="standard">{t("design.theme.standard")}</option>
            <option value="nova">{t("design.theme.nova")}</option>
            <option value="pulse">{t("design.theme.pulse")}</option>
            <option value="ide">{t("design.theme.ide")}</option>
          </select>
        </label>
        <label className="ts-options-field">
          {t("design.custom.css")}
          <textarea
            className="ts-custom-theme-css"
            spellCheck={false}
            value={editing.css}
            onChange={(e) => setEditing({ ...editing, css: e.target.value })}
            placeholder={".ts-app {\n  --accent: #ff6b6b;\n}"}
          />
        </label>
        <p className="ts-options-subtitle">{t("design.custom.hint")}</p>
        <div className="ts-dialog-buttons-right">
          <button onClick={() => setEditing(null)}>{t("connect.cancel")}</button>
          <button onClick={handleSaveEditing} disabled={!editing.name.trim()}>
            {t("design.custom.save")}
          </button>
        </div>
      </>
    );
  }

  if (manageOpen) {
    return (
      <>
        <h3>{t("design.manage.title")}</h3>
        <button className="ts-design-back" onClick={() => setManageOpen(false)}>
          ← {t("design.store.back")}
        </button>
      <div className="ts-design-theme-grid">
        {builtins.map((th) => (
          <button
            key={th.id}
            className={`ts-design-theme-card${th.id === designSelection ? " ts-design-theme-card-active" : ""}`}
            onClick={() => onSelectionChange(th.id)}
          >
            <span className={`ts-design-theme-swatch ts-design-theme-swatch-${th.id}`} />
            <span className="ts-design-theme-card-name">{th.name}</span>
            <span className="ts-design-theme-card-desc">{th.desc}</span>
          </button>
        ))}
        {customThemes.map((theme) => (
          <div
            key={theme.id}
            className={`ts-design-theme-card ts-design-theme-card-custom${
              designSelection === `custom:${theme.id}` ? " ts-design-theme-card-active" : ""
            }`}
          >
            <button className="ts-design-theme-card-select" onClick={() => onSelectionChange(`custom:${theme.id}`)}>
              <span className="ts-design-theme-swatch ts-design-theme-swatch-custom" />
              <span className="ts-design-theme-card-name">{theme.name}</span>
              <span className="ts-design-theme-card-desc">
                {designThemeLabel(theme.baseTheme, t)}
              </span>
            </button>
            <div className="ts-design-theme-card-actions">
              <button
                onClick={() => setEditing({ id: theme.id, name: theme.name, baseTheme: theme.baseTheme, css: theme.css })}
                title={t("design.custom.edit")}
              >
                <ActionIcon>
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </ActionIcon>
              </button>
              <button
                onClick={() =>
                  setEditing({ id: null, name: t("design.custom.copyOf", { name: theme.name }), baseTheme: theme.baseTheme, css: theme.css })
                }
                title={t("design.custom.duplicate")}
              >
                <ActionIcon>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </ActionIcon>
              </button>
              <button onClick={() => handleExport(theme)} title={t("design.custom.export")}>
                <ActionIcon>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </ActionIcon>
              </button>
              <button
                className="ts-design-theme-card-delete"
                onClick={() => {
                  if (window.confirm(t("design.custom.deleteConfirm"))) onDeleteCustomTheme(theme.id);
                }}
                title={t("design.custom.delete")}
              >
                <ActionIcon>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </ActionIcon>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="ts-design-custom-actions">
        <button onClick={() => setEditing({ id: null, name: "", baseTheme: "standard", css: "" })}>
          {t("design.custom.new")}
        </button>
        <button onClick={() => importInputRef.current?.click()}>{t("design.custom.import")}</button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleImportSelected}
        />
        <button onClick={() => setStoreOpen(true)}>{t("design.store.open")}</button>
      </div>
        <h4 className="ts-design-manage-heading">{t("design.iconPack")}</h4>
        {prefs.iconPacks.length === 0 ? (
          <p className="ts-options-hint">{t("design.iconPack.none")}</p>
        ) : (
          <ul className="ts-design-iconpack-list">
            {prefs.iconPacks.map((pack) => (
              <li key={pack.id}>
                <span>
                  {pack.name} ({Object.keys(pack.icons).length})
                </span>
                <button
                  onClick={() => {
                    if (!window.confirm(t("design.iconPack.deleteConfirm"))) return;
                    prefs.saveIconPacks(prefs.iconPacks.filter((p) => p.id !== pack.id));
                    if (prefs.iconPackId === pack.id) prefs.setIconPackId("");
                  }}
                >
                  {t("design.custom.delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="ts-design-custom-actions">
          <button onClick={() => iconPackInputRef.current?.click()}>{t("design.iconPack.import")}</button>
          <input
            ref={iconPackInputRef}
            type="file"
            accept=".ts3_iconpack,.zip"
            style={{ display: "none" }}
            onChange={handleIconPackSelected}
          />
        </div>
        <p className="ts-options-hint">{t("design.iconPack.hint")}</p>
      </>
    );
  }

  const tree = prefs.tree;
  const setTree = (patch: Partial<TreeOptions>) => prefs.setTree({ ...tree, ...patch });
  const base = resolveDesignThemeBase(designSelection, customThemes);
  const treeCheckbox = (key: keyof TreeOptions, label: string) => (
    <label className="ts-options-checkbox">
      <input type="checkbox" checked={tree[key] as boolean} onChange={(e) => setTree({ [key]: e.target.checked })} />
      {label}
    </label>
  );
  // ponytail: these need data the connector doesn't forward yet (client_badges, group types).
  const unavailableCheckbox = (label: string) => (
    <label className="ts-options-checkbox ts-options-disabled" title={t("design.notAvailable")}>
      <input type="checkbox" disabled />
      {label}
    </label>
  );

  return (
    <>
      <h3>{t("options.section.design")}</h3>
      <div className="ts-options-columns ts-design-native">
        <div className="ts-options-fields ts-design-col">
          <fieldset className="ts-options-fieldset">
            <legend>{t("options.section.design")}</legend>
            <label className="ts-options-field">
              {t("design.theme")}
              <select value={designSelection} onChange={(e) => onSelectionChange(e.target.value)}>
                {builtins.map((th) => (
                  <option key={th.id} value={th.id}>
                    {th.name}
                  </option>
                ))}
                {customThemes.length > 0 && (
                  <optgroup label={t("design.customThemes")}>
                    {customThemes.map((theme) => (
                      <option key={theme.id} value={`custom:${theme.id}`}>
                        {theme.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            {base === "ide" && (
              <label className="ts-options-checkbox">
                <input type="checkbox" checked={idePixelFont} onChange={(e) => onIdePixelFontChange(e.target.checked)} />
                {t("design.idePixelFont")}
              </label>
            )}
            <label className="ts-options-field">
              {t("design.iconPack")}
              <select value={prefs.iconPackId} onChange={(e) => prefs.setIconPackId(e.target.value)}>
                <option value="">{t("design.theme.standard")}</option>
                {prefs.iconPacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="ts-design-custom-actions">
              <button onClick={() => setManageOpen(true)}>{t("design.manage")}</button>
              <button onClick={() => setStoreOpen(true)}>{t("design.store.open")}</button>
            </div>
          </fieldset>
          <fieldset className="ts-options-fieldset">
            <legend>{t("design.gif")}</legend>
            {treeCheckbox("animateAvatars", t("design.gif.avatars"))}
            {treeCheckbox("animateImages", t("design.gif.images"))}
          </fieldset>
        </div>
        <div className="ts-options-fields ts-design-col">
          <fieldset className="ts-options-fieldset">
            <legend>{t("design.tree")}</legend>
            <label className="ts-options-radio">
              <input
                type="radio"
                name="ts-tree-expand"
                checked={tree.expandMode === "all"}
                onChange={() => setTree({ expandMode: "all" })}
              />
              {t("design.tree.expandAll")}
            </label>
            <label className="ts-options-field ts-design-indent">
              {t("design.tree.expandDepth")}
              <input
                type="number"
                min={0}
                max={99}
                value={tree.expandDepth}
                disabled={tree.expandMode !== "all"}
                onChange={(e) => setTree({ expandDepth: Math.max(0, Math.floor(Number(e.target.value)) || 0) })}
              />
            </label>
            <label className="ts-options-radio">
              <input
                type="radio"
                name="ts-tree-expand"
                checked={tree.expandMode === "own"}
                onChange={() => setTree({ expandMode: "own" })}
              />
              {t("design.tree.expandOwn")}
            </label>
            {treeCheckbox("clientsBelow", t("design.tree.clientsBelow"))}
            {treeCheckbox("flags", t("design.tree.flags"))}
            {unavailableCheckbox(t("design.tree.overwolf"))}
            {unavailableCheckbox(t("design.tree.badges"))}
            {treeCheckbox("groupIconsInMenus", t("design.tree.groupIconsInMenus"))}
            {unavailableCheckbox(t("design.tree.hideInaccessibleGroups"))}
            {treeCheckbox("commanderLamp", t("design.tree.commanderLamp"))}
            {treeCheckbox("awayMessage", t("design.tree.awayMessage"))}
            {treeCheckbox("tooltips", t("design.tree.tooltips"))}
          </fieldset>
        </div>
      </div>
    </>
  );
}
