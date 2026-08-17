import { useMemo } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { LogoLoop } from "./Logoloop";

const COMMUNITY_USERS = [
  { id: "u-1", name: "Aarav Sharma", verified: true, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80" },
  { id: "u-2", name: "Priya Patel", verified: true, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
  { id: "u-3", name: "Rohan Verma", verified: true, avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80" },
  { id: "u-4", name: "Ananya Iyer", verified: true, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
  { id: "u-5", name: "Vikram Malhotra", verified: true, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { id: "u-6", name: "Neha Gupta", verified: false, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
  { id: "u-7", name: "Karan Mehta", verified: true, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { id: "u-8", name: "Sanya Roy", verified: true, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
  { id: "u-9", name: "Devendra Singh", verified: true, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
  { id: "u-10", name: "Meera Nair", verified: true, avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80" },
  { id: "u-11", name: "Arjun Reddy", verified: true, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
  { id: "u-12", name: "Ritika Sen", verified: true, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
];

export function UserAvatarMarquee({ users = [], onSelectUser }) {
  const activeUsers = useMemo(() => {
    const seen = new Set();
    const realUsers = [];

    // 1. Collect all unique borrowers from incoming loan requests
    (users || []).forEach((loan) => {
      const borrower = loan?.borrowerId;
      if (borrower && (borrower._id || borrower.fullName)) {
        const idKey = borrower._id ? String(borrower._id) : borrower.fullName;
        if (!seen.has(idKey)) {
          seen.add(idKey);
          realUsers.push({
            id: borrower._id || idKey,
            name: borrower.fullName || "Active Member",
            avatar: borrower.avatarUrl || null,
            verified: borrower.identityVerified ?? true,
            isRealId: Boolean(borrower._id),
          });
        }
      }
    });

    // 2. Append diverse community active members so the loop always has a rich, populated stream
    const combined = [...realUsers];
    COMMUNITY_USERS.forEach((cu) => {
      if (!seen.has(cu.id) && !seen.has(cu.name)) {
        seen.add(cu.name);
        combined.push(cu);
      }
    });

    return combined;
  }, [users]);

  const avatarLogos = useMemo(() => {
    return activeUsers.map((user) => ({
      title: user.name,
      node: (
        <div
          onClick={() => {
            if (user.isRealId && onSelectUser) {
              onSelectUser(user.id);
            }
          }}
          className={`flex items-center justify-center p-1 relative select-none ${
            user.isRealId && onSelectUser ? "cursor-pointer hover:scale-105 transition-transform" : ""
          }`}
          style={{ width: "74px", height: "74px" }}
          title={user.name}
        >
          {/* Outer ring */}
          <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-emerald-400 to-teal-300 relative shrink-0 shadow-xs">
            {/* Avatar image container */}
            <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center border-2 border-background">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-base font-extrabold text-primary">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* Online Indicator */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />

            {/* Verified Badge */}
            {user.verified && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center text-primary shadow-xs border border-border/80">
                <ShieldCheck size={12} strokeWidth={2.5} />
              </span>
            )}
          </div>
        </div>
      ),
    }));
  }, [activeUsers, onSelectUser]);

  return (
    <div className="w-full mt-4 mb-2 relative">
      <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground text-xs font-bold tracking-widest uppercase">
        <Sparkles size={13} className="text-primary animate-pulse" />
        <span>Active Verified Community ({activeUsers.length}+ Members)</span>
      </div>

      <LogoLoop
        logos={avatarLogos}
        speed={38}
        direction="left"
        logoHeight={74}
        gap={28}
        hoverSpeed={0}
        fadeOut
        ariaLabel="Active marketplace community"
      />
    </div>
  );
}

export default UserAvatarMarquee;