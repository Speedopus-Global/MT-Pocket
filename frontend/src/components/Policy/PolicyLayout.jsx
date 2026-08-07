export default function PolicyLayout({ children }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:max-w-6xl lg:px-10">
        {children}
      </div>
      <div className="h-[10vh]" />
    </main>
  );
}
