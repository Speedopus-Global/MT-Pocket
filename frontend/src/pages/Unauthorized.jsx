import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background text-foreground px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
        <ShieldOff size={28} />
      </div>
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        This area is restricted to MT Pocket administrators. If you believe this is an error, contact support.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}