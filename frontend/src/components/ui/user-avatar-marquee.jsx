import { useMemo } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import {LogoLoop} from "./Logoloop";

const FALLBACK_USERS = [
  { id: "1", name: "Aarav Sharma", verified: true },
  { id: "2", name: "Priya Patel", verified: true },
  { id: "3", name: "Rohan Verma", verified: false },
  { id: "4", name: "Ananya Iyer", verified: true },
  { id: "5", name: "Vikram Malhotra", verified: true },
  { id: "6", name: "Neha Gupta", verified: false },
  { id: "7", name: "Karan Mehta", verified: true },
  { id: "8", name: "Sanya Malhotra", verified: true },
];

export function UserAvatarMarquee({ users = [] }) {
  const activeUsers = useMemo(() => {
    if (!users?.length) {
      return FALLBACK_USERS;
    }

    return users
      .map((loan, index) => {
        const borrower = loan?.borrowerId;

        return {
          id: borrower?._id || `user-${index}`,
          name: borrower?.fullName || "Active Member",
          avatar: borrower?.avatarUrl || null,
          verified: borrower?.identityVerified ?? false,
        };
      })
      .filter(Boolean);
  }, [users]);

  const avatarLogos = useMemo(() => {
    return activeUsers.map((user) => ({
      title: user.name,

      node: (
        <div
          style={{
            width: "78px",
            height: "78px",
            flexShrink: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Outer avatar ring */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              padding: "3px",
              background:
                "linear-gradient(135deg, #059669, #10b981, #34d399)",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {/* Actual avatar */}
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                overflow: "hidden",
                background: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid white",
                boxSizing: "border-box",
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#047857",
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* Online indicator */}
            <span
              style={{
                position: "absolute",
                right: "-1px",
                bottom: "-1px",
                width: "15px",
                height: "15px",
                borderRadius: "50%",
                background: "#22c55e",
                border: "3px solid white",
                boxSizing: "border-box",
              }}
            />

            {/* Verified badge */}
            {user.verified && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#059669",
                  boxShadow: "0 1px 5px rgba(0,0,0,0.15)",
                }}
              >
                <ShieldCheck size={14} strokeWidth={2.5} />
              </span>
            )}
          </div>
        </div>
      ),
    }));
  }, [activeUsers]);

  return (
    <div className="w-full mt-6 mb-2 relative">
      {/* Section label */}
      <div className="flex items-center justify-center gap-2 mb-3.5 text-muted-foreground text-xs font-bold tracking-widest uppercase">
        <Sparkles size={14} className="text-primary animate-pulse" />
        <span>Active Marketplace Community</span>
      </div>

      <LogoLoop
        logos={avatarLogos}
        speed={45}
        direction="left"
        logoHeight={78}
        gap={70}
        hoverSpeed={0}
        fadeOut
        ariaLabel="Active marketplace community"
      />
    </div>
  );
}

export default UserAvatarMarquee;