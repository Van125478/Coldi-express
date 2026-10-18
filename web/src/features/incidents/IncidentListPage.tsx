import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { incidentDetailPath, incidentListPath } from "@/features/incidents/incidentCopy";
import { formatWhen, IncidentBadges } from "@/features/incidents/incidentUi";
import { lostSession } from "@/features/workspace/sessionLoss";
import { EmptyPanel, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { BusinessRole } from "@/models/session";
import { listIncidentNotifications, listIncidents, markIncidentNotificationRead, unreadIncidentCount, type IncidentNotificationRecord, type IncidentRecord } from "@/services/incidentService";

export function IncidentListPage() {
  usePageTitle("Sự cố");
  const { snapshot, logout } = useAuth();
  const role: BusinessRole = snapshot.status === "authenticated" ? snapshot.user.role : "SHIPPER";
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [notifications, setNotifications] = useState<IncidentNotificationRecord[]>([]);
  const [unread, setUnread] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState("loading");
    Promise.all([listIncidents(), listIncidentNotifications(), unreadIncidentCount()])
      .then(([page, notes, count]) => {
        if (!active) return;
        setIncidents(page.incidents);
        setNotifications(notes.notifications);
        setUnread(count.unread);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [logout, reloadKey]);

  async function markRead(notification: IncidentNotificationRecord) {
    if (notification.read) return;
    try {
      const updated = await markIncidentNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => (item.id === notification.id ? updated.notification : item)));
      setUnread((current) => Math.max(0, current - 1));
    } catch (error: unknown) {
      if (lostSession(error, logout)) return;
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Sự cố vận chuyển"
        summary="Các báo cáo trong phạm vi chuyến bạn được xem. Trạng thái sự cố không đổi trạng thái chuyến hàng."
      />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải sự cố.</p> : null}
      {state === "error" ? (
        <div role="alert" className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-ink">Không tải được danh sách sự cố.</p>
          <Button type="button" className="mt-3" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </Button>
        </div>
      ) : null}
      {state === "ready" ? (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.7fr)]">
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <EmptyPanel title="Chưa có sự cố" body="Khi bạn báo sự cố trên một chuyến mình có quyền, báo cáo sẽ xuất hiện tại đây." />
            ) : (
              incidents.map((incident) => (
                <Link
                  key={incident.id}
                  to={incidentDetailPath(role, incident.id)}
                  className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-navy"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold leading-snug text-ink">{incident.title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{incident.shipmentLabel}</p>
                    </div>
                    <IncidentBadges status={incident.status} statusLabel={incident.statusLabel} categoryLabel={incident.incidentTypeLabel} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Cập nhật <time dateTime={incident.updatedAt}>{formatWhen(incident.updatedAt)}</time>
                  </p>
                </Link>
              ))
            )}
          </div>
          <aside className="rounded-2xl border border-line bg-surface p-4">
            <h2 className="text-sm font-bold text-navy">Thông báo</h2>
            <p className="mt-1 text-sm text-ink">{unread} chưa đọc</p>
            <div className="mt-4 space-y-3">
              {notifications.length === 0 ? <p className="text-sm text-muted">Chưa có thông báo sự cố.</p> : null}
              {notifications.slice(0, 8).map((notification) => (
                <div key={notification.id} className="border-t border-line pt-3">
                  <Link
                    to={incidentDetailPath(role, notification.incidentId)}
                    className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
                    onClick={() => {
                      void markRead(notification);
                    }}
                  >
                    {notification.label}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {notification.read ? "Đã đọc" : "Chưa đọc"}
                    <span aria-hidden="true"> · </span>
                    <time dateTime={notification.createdAt}>{formatWhen(notification.createdAt)}</time>
                  </p>
                </div>
              ))}
            </div>
            <Link to={incidentListPath(role)} className="mt-4 inline-flex text-sm font-semibold text-navy underline-offset-4 hover:underline">
              Ở lại danh sách sự cố
            </Link>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
