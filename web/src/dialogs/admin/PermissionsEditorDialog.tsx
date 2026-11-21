import { useEffect, useState } from "react";
import type {
  ChannelInfo,
  ClientInfo,
  GroupEntry,
  PermissionCatalogEntry,
  PermissionOverviewEntry,
  PermScope,
} from "../../app/model";
import { useT } from "../../i18n";
import { useBackdropDismiss } from "../../lib/a11y";

/** The five permission-editor tabs from the real TS3 "Rechte" window - each
 *  is a different scope the ts3 protocol tracks assigned permissions under. */
const PERM_SCOPES: { scope: PermScope; labelKey: string }[] = [
  { scope: "server", labelKey: "permsEditor.tab.server" },
  { scope: "client", labelKey: "permsEditor.tab.client" },
  { scope: "channel", labelKey: "permsEditor.tab.channel" },
  { scope: "channelgroup", labelKey: "permsEditor.tab.channelgroup" },
  { scope: "channelclient", labelKey: "permsEditor.tab.channelclient" },
];

export function PermissionsEditorDialog({
  initialScope,
  channelGroups,
  serverGroups,
  channels,
  clients,
  entries: loadedEntries,
  catalog,
  onSelectTarget,
  onLoadCatalog,
  onAdd,
  onRemove,
  onClose,
}: {
  initialScope: PermScope;
  channelGroups: GroupEntry[] | null;
  serverGroups: GroupEntry[] | null;
  channels: ChannelInfo[];
  clients: ClientInfo[];
  entries: PermissionOverviewEntry[] | null;
  catalog: PermissionCatalogEntry[] | null;
  onSelectTarget: (scope: PermScope, id1: number, id2?: number) => void;
  onLoadCatalog: () => void;
  onAdd: (scope: PermScope, ids: number[], permId: number, value: number, negated: boolean, skip: boolean) => void;
  onRemove: (scope: PermScope, ids: number[], permId: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const backdrop = useBackdropDismiss(onClose);
  const [scope, setScope] = useState<PermScope>(initialScope);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [channelId, setChannelId] = useState<number | null>(null);
  const [clientDbIdInput, setClientDbIdInput] = useState("");
  const [filter, setFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPermSearch, setAddPermSearch] = useState("");
  const [addPermId, setAddPermId] = useState<number | null>(null);
  const [addValue, setAddValue] = useState("1");
  const [addNegated, setAddNegated] = useState(false);
  const [addSkip, setAddSkip] = useState(false);

  const isGroupScope = scope === "server" || scope === "channelgroup";
  const groupList = scope === "server" ? serverGroups : scope === "channelgroup" ? channelGroups : null;
  // The channelgrouplist/servergrouplist requests decline silently when the
  // account lacks the permission to see them (no reply at all, same as
  // banlist/complainlist elsewhere) - without this, a permission-limited
  // account just sees a permanently blank panel with no explanation.
  const [groupsTimedOut, setGroupsTimedOut] = useState(false);
  useEffect(() => {
    setGroupsTimedOut(false);
    if (groupList) return;
    const id = window.setTimeout(() => setGroupsTimedOut(true), 6000);
    return () => window.clearTimeout(id);
  }, [groupList]);

  // (ids, ready) for the currently selected target under the active tab -
  // ready is false while a required piece (channel/client) hasn't been picked yet.
  const target: { id1: number; id2?: number } | null = (() => {
    const clientDbId = parseInt(clientDbIdInput, 10);
    switch (scope) {
      case "server":
      case "channelgroup":
        return groupId !== null ? { id1: groupId } : null;
      case "channel":
        return channelId !== null ? { id1: channelId } : null;
      case "client":
        return !Number.isNaN(clientDbId) ? { id1: clientDbId } : null;
      case "channelclient":
        return channelId !== null && !Number.isNaN(clientDbId) ? { id1: channelId, id2: clientDbId } : null;
      default:
        return null;
    }
  })();

  // Entries only count while they belong to the target on screen - after a
  // tab switch they'd otherwise show (and let you delete/add against) the
  // previous tab's target, e.g. server group 6 edited as channel group 6.
  const targetKey = target ? `${scope}:${target.id1}:${target.id2 ?? ""}` : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const entries = loadedKey !== null && loadedKey === targetKey ? loadedEntries : null;
  const select = (s: PermScope, id1: number, id2?: number) => {
    setLoadedKey(`${s}:${id1}:${id2 ?? ""}`);
    onSelectTarget(s, id1, id2);
  };

  const load = (next: { scope: PermScope; groupId?: number | null; channelId?: number | null; clientDbId?: number }) => {
    // The catalog doubles as the name->id lookup the delete button needs, so
    // fetch it alongside the first load rather than only when "+ Hinzufügen"
    // is opened - onLoadCatalog is idempotent (a no-op once already cached).
    onLoadCatalog();
    const s = next.scope;
    const gid = next.groupId !== undefined ? next.groupId : groupId;
    const cid = next.channelId !== undefined ? next.channelId : channelId;
    const cldbid = next.clientDbId !== undefined ? next.clientDbId : parseInt(clientDbIdInput, 10);
    if ((s === "server" || s === "channelgroup") && gid !== null && gid !== undefined) {
      select(s, gid);
    } else if (s === "channel" && cid !== null && cid !== undefined) {
      select(s, cid);
    } else if (s === "client" && !Number.isNaN(cldbid)) {
      select(s, cldbid);
    } else if (s === "channelclient" && cid !== null && cid !== undefined && !Number.isNaN(cldbid)) {
      select(s, cid, cldbid);
    }
  };

  const filtered = entries?.filter((e) => e.name.toLowerCase().includes(filter.toLowerCase())) ?? null;
  const showNegated = scope === "server";
  const showSkip = scope === "server" || scope === "client";

  const catalogFiltered = (catalog ?? [])
    .filter((p) => p.name.toLowerCase().includes(addPermSearch.toLowerCase()))
    .slice(0, 200); // keep the <select> responsive against the ~500-entry catalog

  return (
    <div className="ts-dialog-backdrop" {...backdrop}>
      <div className="ts-dialog ts-perms-editor-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ts-dialog-titlebar">
          <span>{t("permsEditor.title")}</span>
          <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
            ✕
          </button>
        </div>
        <div className="ts-perms-editor-tabs">
          {PERM_SCOPES.map((tab) => (
            <button
              key={tab.scope}
              className={`ts-perms-editor-tab${scope === tab.scope ? " ts-perms-editor-tab-active" : ""}`}
              onClick={() => {
                // Server and channel group ids overlap, so a picked group
                // never carries over between those two tabs.
                const switchesGroupKind = isGroupScope && tab.scope !== scope;
                if (switchesGroupKind) setGroupId(null);
                setScope(tab.scope);
                setShowAddForm(false);
                load({ scope: tab.scope, groupId: switchesGroupKind ? null : undefined });
              }}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
        <div className="ts-dialog-body ts-perms-editor-body">
          <div className="ts-perms-editor-picker">
            {isGroupScope &&
              (groupList ? (
                <ul className="ts-perms-editor-list">
                  {groupList.length === 0 && (
                    <li className="ts-perms-editor-list-empty">{t("groupAssign.empty")}</li>
                  )}
                  {groupList.map((g) => (
                    <li key={g.id}>
                      <button
                        className={`ts-link-button${groupId === g.id ? " ts-perms-editor-selected" : ""}`}
                        onClick={() => {
                          setGroupId(g.id);
                          load({ scope, groupId: g.id });
                        }}
                      >
                        {g.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="ts-connection-info-loading">
                  {groupsTimedOut ? t("connectionInfo.unavailable") : t("connectionInfo.loading")}
                </div>
              ))}
            {(scope === "channel" || scope === "channelclient") && (
              <ul className="ts-perms-editor-list">
                {channels.map((c) => (
                  <li key={c.id}>
                    <button
                      className={`ts-link-button${channelId === c.id ? " ts-perms-editor-selected" : ""}`}
                      onClick={() => {
                        setChannelId(c.id);
                        load({ scope, channelId: c.id });
                      }}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {(scope === "client" || scope === "channelclient") && (
              <div className="ts-perms-editor-client-picker">
                <label className="ts-dialog-field">
                  {t("permsEditor.clientDbId")}
                  <input
                    value={clientDbIdInput}
                    onChange={(e) => setClientDbIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load({ scope })}
                    placeholder="1"
                  />
                </label>
                <button onClick={() => load({ scope })}>{t("permsEditor.load")}</button>
                {clients.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      if (!Number.isNaN(id)) {
                        setClientDbIdInput(String(id));
                        load({ scope, clientDbId: id });
                      }
                    }}
                  >
                    <option value="" disabled>
                      {t("permsEditor.pickOnlineClient")}
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.databaseId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
          <div className="ts-perms-editor-main">
            {!target ? (
              <div className="ts-connection-info-loading">{t("permsEditor.pickTarget")}</div>
            ) : (
              <>
                <div className="ts-dialog-row">
                  <label className="ts-dialog-field ts-dialog-field-grow">
                    {t("clientLog.filter")}
                    <input value={filter} onChange={(e) => setFilter(e.target.value)} />
                  </label>
                  <button
                    onClick={() => {
                      setShowAddForm((v) => !v);
                      if (!catalog) onLoadCatalog();
                    }}
                  >
                    + {t("permsEditor.addPermission")}
                  </button>
                </div>
                {showAddForm && (
                  <form
                    className="ts-perms-editor-add-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (addPermId === null || !target) return;
                      const value = parseInt(addValue, 10);
                      if (Number.isNaN(value)) return;
                      const ids = target.id2 !== undefined ? [target.id1, target.id2] : [target.id1];
                      onAdd(scope, ids, addPermId, value, addNegated, addSkip);
                      setShowAddForm(false);
                      setAddPermSearch("");
                      setAddPermId(null);
                    }}
                  >
                    <input
                      placeholder={t("permsEditor.searchPermission")}
                      value={addPermSearch}
                      onChange={(e) => setAddPermSearch(e.target.value)}
                    />
                    <select value={addPermId ?? ""} onChange={(e) => setAddPermId(parseInt(e.target.value, 10))}>
                      <option value="" disabled>
                        {t("permsEditor.searchPermission")}
                      </option>
                      {catalogFiltered.map((p) => (
                        <option key={p.id} value={p.id} title={p.description}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={addValue}
                      onChange={(e) => setAddValue(e.target.value)}
                      style={{ width: "5em" }}
                    />
                    {showNegated && (
                      <label>
                        <input type="checkbox" checked={addNegated} onChange={(e) => setAddNegated(e.target.checked)} />
                        {t("permissionOverview.negated")}
                      </label>
                    )}
                    {showSkip && (
                      <label>
                        <input type="checkbox" checked={addSkip} onChange={(e) => setAddSkip(e.target.checked)} />
                        {t("permissionOverview.skip")}
                      </label>
                    )}
                    <button type="submit" disabled={addPermId === null}>
                      {t("dialog.ok")}
                    </button>
                  </form>
                )}
                {!entries ? (
                  <div className="ts-connection-info-loading">{t("connectionInfo.loading")}</div>
                ) : filtered && filtered.length === 0 ? (
                  <div className="ts-connection-info-loading">{t("permissionOverview.empty")}</div>
                ) : (
                  <div className="ts-permission-overview-scroll">
                    <table className="ts-ban-list-table">
                      <thead>
                        <tr>
                          <th>{t("permissionOverview.name")}</th>
                          <th>{t("permissionOverview.value")}</th>
                          {showNegated && <th>{t("permissionOverview.negated")}</th>}
                          {showSkip && <th>{t("permissionOverview.skip")}</th>}
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered!.map((entry, i) => {
                          const catalogEntry = catalog?.find((p) => p.name === entry.name);
                          return (
                            <tr key={`${entry.name}-${i}`} title={entry.description || undefined}>
                              <td>{entry.name}</td>
                              <td>{entry.value}</td>
                              {showNegated && <td>{entry.negated ? "✔️" : ""}</td>}
                              {showSkip && <td>{entry.skip ? "✔️" : ""}</td>}
                              <td>
                                {catalogEntry && (
                                  <button
                                    onClick={() => {
                                      const ids = target.id2 !== undefined ? [target.id1, target.id2] : [target.id1];
                                      onRemove(scope, ids, catalogEntry.id);
                                    }}
                                    title={t("fileBrowser.delete")}
                                  >
                                    🗑
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="ts-dialog-buttons">
          <button onClick={() => target && load({ scope })} disabled={!target}>
            {t("fileBrowser.refresh")}
          </button>
          <div className="ts-dialog-buttons-right">
            <button onClick={onClose}>{t("dialog.close")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
