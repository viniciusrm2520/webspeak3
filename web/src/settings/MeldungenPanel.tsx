import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useT } from "../i18n";
import {
  BUILTIN_PACK,
  deleteSoundPack,
  getNotificationSettings,
  importSoundPack,
  isSpecialKey,
  loadSoundPacks,
  NO_SOUNDS_PACK,
  NOTIFICATION_TREE,
  type NotificationNode,
  type NotificationOverride,
  type NotificationSettings,
  packScript,
  runSoundScript,
  saveNotificationSettings,
  type SoundPack,
  textPositionChoices,
} from "../notifications";

function useSoundPacks(): [SoundPack[], () => void] {
  const [packs, setPacks] = useState<SoundPack[]>([]);
  const reload = useCallback(() => void loadSoundPacks().then(setPacks), []);
  useEffect(reload, [reload]);
  return [packs, reload];
}

/** WebSpeak3 Standard, Keine Sounds and the imported packs. */
export function SoundPackOptions() {
  const t = useT();
  const [packs] = useSoundPacks();
  return (
    <>
      <option value={BUILTIN_PACK}>{t("notify.pack.builtin")}</option>
      <option value={NO_SOUNDS_PACK}>{t("notify.pack.none")}</option>
      {packs.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </>
  );
}

const notificationLeaves = (node: NotificationNode): string[] =>
  node.key ? [node.key] : (node.children ?? []).flatMap(notificationLeaves);

export function MeldungenPanel({
  onOpenFavorites,
  onApplyPackToFavorites,
}: {
  onOpenFavorites: () => void;
  onApplyPackToFavorites: () => void;
}) {
  const t = useT();
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [packs, reloadPacks] = useSoundPacks();
  const [open, setOpen] = useState<Set<string>>(() => new Set(["connection"]));
  const fileRef = useRef<HTMLInputElement>(null);
  const pack = packs.find((p) => p.id === settings.pack);
  const save = (next: NotificationSettings) => {
    saveNotificationSettings(next);
    setSettings(next);
  };
  const defaultScript = (key: string) => packScript(pack, settings.pack, key);
  const override = (keys: string[], patch: NotificationOverride) => {
    const overrides = { ...settings.overrides };
    for (const key of keys) {
      const merged = { ...overrides[key], ...patch };
      // Values equal to the default aren't overrides (that's what makes a row bold).
      if (!merged.off) delete merged.off;
      if (merged.script === defaultScript(key)) delete merged.script;
      if (merged.text?.join() === "server") delete merged.text;
      if (Object.keys(merged).length) overrides[key] = merged;
      else delete overrides[key];
    }
    save({ ...settings, overrides });
  };
  const handleImport = async (file: File) => {
    try {
      const imported = await importSoundPack(file);
      reloadPacks();
      save({ ...settings, pack: imported.id });
    } catch {
      window.alert(t("notify.importFailed"));
    }
  };

  const renderNode = (node: NotificationNode, path: string, depth: number): React.ReactNode => {
    const id = `${path}/${node.label}`;
    const special = node.key ? isSpecialKey(node.key) : id === "/special";
    const indent = { paddingLeft: 4 + depth * 16 };
    if (node.key) {
      const key = node.key;
      const o = settings.overrides[key];
      const script = o?.script ?? defaultScript(key);
      const text = Array.isArray(o?.text) ? o.text : ["server"];
      return (
        <tr key={id} className={o ? "ts-notify-custom" : undefined}>
          <td style={indent}>
            <label className="ts-notify-action">
              {!special && (
                <input type="checkbox" checked={!o?.off} onChange={(e) => override([key], { off: !e.target.checked })} />
              )}
              {t(`notify.${node.label}`)}
            </label>
          </td>
          <td>
            <span className="ts-notify-script">
              <input
                value={script}
                spellCheck={false}
                onChange={(e) => override([key], { script: e.target.value })}
              />
              {script && (
                <button title={t("sounds.test")} onClick={() => void runSoundScript(script, settings.pack)}>
                  ▶
                </button>
              )}
            </span>
          </td>
          <td>
            {!special && (
              <details className="ts-notify-text">
                <summary>{text.map((p) => t(`notify.text.${p}`)).join(", ") || "—"}</summary>
                <div className="ts-notify-text-menu">
                  {textPositionChoices(key).map((p) => (
                    <label key={p} className="ts-options-checkbox">
                      <input
                        type="checkbox"
                        checked={text.includes(p)}
                        onChange={(e) =>
                          override([key], {
                            text: textPositionChoices(key).filter((c) => (c === p ? e.target.checked : text.includes(c))),
                          })
                        }
                      />
                      {t(`notify.text.${p}`)}
                    </label>
                  ))}
                </div>
              </details>
            )}
          </td>
        </tr>
      );
    }
    const leaves = notificationLeaves(node);
    const on = leaves.filter((k) => !settings.overrides[k]?.off).length;
    const expanded = open.has(id);
    const toggle = () =>
      setOpen((prev) => {
        const next = new Set(prev);
        if (!next.delete(id)) next.add(id);
        return next;
      });
    return [
      <tr key={id} className={leaves.some((k) => settings.overrides[k]) ? "ts-notify-custom" : undefined}>
        <td style={indent} colSpan={3}>
          <span className="ts-notify-action">
            <button className="ts-notify-twisty" onClick={toggle}>
              {expanded ? "▾" : "▸"}
            </button>
            {!special && (
              <input
                type="checkbox"
                checked={on === leaves.length}
                ref={(el) => {
                  if (el) el.indeterminate = on > 0 && on < leaves.length;
                }}
                onChange={(e) => override(leaves, { off: !e.target.checked })}
              />
            )}
            <span onClick={toggle}>{t(`notify.${node.label}`)}</span>
          </span>
        </td>
      </tr>,
      ...(expanded ? (node.children ?? []).map((c) => renderNode(c, id, depth + 1)) : []),
    ];
  };

  return (
    <>
      <h3>{t("options.section.meldungen")}</h3>
      <p className="ts-options-subtitle">{t("notify.subtitle")}</p>
      <div className="ts-options-fields">
        <div className="ts-notify-row">
          <label htmlFor="ts-notify-pack">{t("notify.soundPack")}</label>
          <select id="ts-notify-pack" value={settings.pack} onChange={(e) => save({ ...settings, pack: e.target.value })}>
            <SoundPackOptions key={packs.length} />
          </select>
          <button
            title={t("notify.applyToFavorites")}
            onClick={() => {
              if (window.confirm(t("notify.applyToFavoritesConfirm"))) onApplyPackToFavorites();
            }}
          >
            ✔
          </button>
          <button title={t("notify.importPack")} onClick={() => fileRef.current?.click()}>
            📂
          </button>
          {pack && (
            <button
              title={t("notify.deletePack")}
              onClick={() => {
                if (!window.confirm(t("notify.deletePackConfirm", { name: pack.name }))) return;
                void deleteSoundPack(pack.id).then(reloadPacks);
                save({ ...settings, pack: BUILTIN_PACK });
              }}
            >
              🗑
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".ts3_soundpack,.zip"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleImport(file);
            }}
          />
        </div>
        <div className="ts-notify-row">
          <label htmlFor="ts-notify-muted">{t("notify.whenMuted")}</label>
          <select
            id="ts-notify-muted"
            value={settings.whenMuted}
            onChange={(e) => save({ ...settings, whenMuted: e.target.value as NotificationSettings["whenMuted"] })}
          >
            <option value="all">{t("notify.whenMuted.all")}</option>
            <option value="important">{t("notify.whenMuted.important")}</option>
            <option value="none">{t("notify.whenMuted.none")}</option>
          </select>
        </div>
        <p className="ts-notify-hint">
          {t("notify.hintBefore")}
          <a href="#" onClick={(e) => (e.preventDefault(), onOpenFavorites())}>
            {t("notify.hintLink")}
          </a>
          {t("notify.hintAfter")}
        </p>
        <div className="ts-notify-tree">
          <table>
            <thead>
              <tr>
                <th>{t("notify.col.action")}</th>
                <th>{t("notify.col.script")}</th>
                <th>{t("notify.col.text")}</th>
              </tr>
            </thead>
            <tbody>{NOTIFICATION_TREE.map((n) => renderNode(n, "", 0))}</tbody>
          </table>
        </div>
        {Object.keys(settings.overrides).length > 0 && (
          <div>
            <button onClick={() => save({ ...settings, overrides: {} })}>{t("notify.resetAll")}</button>
          </div>
        )}
      </div>
    </>
  );
}
