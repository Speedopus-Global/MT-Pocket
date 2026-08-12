import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import {
  Bell,
  FileText,
  Clock,
  CheckCircle2,
  X,
  RefreshCw,
  AlertTriangle,
  Handshake,
  Loader2,
} from 'lucide-react';

const NOTIF_META = {
  doc_submitted:          { color: 'text-primary',     bg: 'bg-primary/10',     icon: FileText },
  doc_under_review:       { color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: Clock },
  doc_approved:           { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  doc_rejected:           { color: 'text-destructive', bg: 'bg-destructive/10', icon: X },
  doc_reupload_required:  { color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: RefreshCw },
  account_suspended:      { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
  account_unsuspended:    { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  account_banned:         { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
  report_filed:           { color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: AlertTriangle },
  offer_received:         { color: 'text-primary',     bg: 'bg-primary/10',     icon: Handshake },
  offer_accepted:         { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  offer_rejected:         { color: 'text-destructive', bg: 'bg-destructive/10', icon: X },
  new_message:            { color: 'text-primary',     bg: 'bg-primary/10',     icon: Bell },
};
const defaultMeta = { color: 'text-muted-foreground', bg: 'bg-muted', icon: Bell };

export default function NotificationDrawer({ accessToken }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // Unread count — same as before
  useEffect(() => {
    if (!accessToken) return;
    api.getUnreadCount(accessToken)
      .then((count) => setUnread(count ?? 0))
      .catch(() => {});
  }, [accessToken]);

  // Load notifications when the drawer opens — same as before,
  // just driven by the Drawer's own open state instead of a dropdown
  useEffect(() => {
    if (!notifOpen || !accessToken) return;
    setNotifLoading(true);
    api.getNotifications(accessToken)
      .then(setNotifs)
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [notifOpen, accessToken]);

  const markAllRead = async () => {
    await api.markAllNotificationsRead(accessToken).catch(() => {});
    setUnread(0);
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  };

  return (
    <Drawer direction="right" open={notifOpen} onOpenChange={setNotifOpen}>
      <DrawerTrigger asChild>
        <button
          className="relative p-3 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 text-[10px] font-bold tabular-nums"
            >
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-primary" />
            <DrawerTitle>Notifications</DrawerTitle>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline font-semibold cursor-pointer">
              Mark all read
            </button>
          )}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-border px-4 pb-4">
          {notifLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
          ) : notifs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">No notifications yet</p>
          ) : (
            notifs.map((n) => {
              const meta = NOTIF_META[n.type] || defaultMeta;
              const Icon = meta.icon;
              return (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 py-3 transition-colors ${n.read ? 'opacity-60' : 'bg-primary/[0.02]'}`}
                >
                  <Avatar className="size-7">
                    <AvatarFallback className={`${meta.bg} ${meta.color}`}>
                      <Icon size={13} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${n.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}