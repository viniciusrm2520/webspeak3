import { formatBytes, type Transfer } from "../app/model";
import { useT } from "../i18n";

export function FileTransfersWindow({
  transfers,
  onClearFinished,
  onClose,
}: {
  transfers: Transfer[];
  onClearFinished: () => void;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <div className="ts-dialog ts-transfers-window" role="dialog" aria-label={t("transfers.title")}>
      <div className="ts-dialog-titlebar">
        <span>{t("transfers.title")}</span>
        <button onClick={onClose} title={t("dialog.close")} aria-label={t("dialog.close")}>
          ✕
        </button>
      </div>
      <div className="ts-dialog-body">
        {transfers.length === 0 ? (
          <p className="ts-options-placeholder">{t("transfers.empty")}</p>
        ) : (
          <table className="ts-transfers-table">
            <tbody>
              {transfers.map((x) => (
                <tr key={x.id} className={`ts-transfer-${x.status}`}>
                  <td title={t(`transfers.${x.dir}`)}>{x.dir === "down" ? "⬇" : "⬆"}</td>
                  <td className="ts-transfers-name" title={x.path}>
                    {x.name}
                  </td>
                  <td>
                    <progress value={x.done} max={x.size || 1} />
                  </td>
                  <td>
                    {formatBytes(x.done)} / {formatBytes(x.size)}
                  </td>
                  <td>{t(`transfers.status.${x.status}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="ts-dialog-buttons">
        <div className="ts-dialog-buttons-right">
          <button onClick={onClearFinished}>{t("transfers.clearFinished")}</button>
        </div>
      </div>
    </div>
  );
}
