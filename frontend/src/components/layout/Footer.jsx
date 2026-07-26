export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
 
        {/* Product column */}
        <div>
          {/* How it works, Trust & Safety, FAQ */}
        </div>
 
        {/* Company column */}
        <div>
          {/* About, Contact */}
        </div>
 
        {/* Legal column */}
        <div>
          {/* Terms & Conditions, Privacy Policy */}
        </div>
 
        {/* Connect column */}
        <div>
          {/* Support email, social links */}
        </div>
 
      </div>
 
      {/* Bottom bar — copyright + facilitator disclaimer, kept visible on every page */}
      <div className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-4 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
          <span>{/* © {new Date().getFullYear()} MT Pocket */}</span>
          <span>{/* MT Pocket is a facilitator platform — not a bank or NBFC. We never handle your money or set loan terms. */}</span>
        </div>
      </div>
    </footer>
  );
}