/** First focusable element on every page; targets the <main> rendered by MainContent. */
export function SkipLink() {
  return (
    <a
      className="sr-only fixed left-4 top-4 z-[100] rounded-md border-[1.5px] border-foreground bg-card px-4 py-3 font-sans text-sm font-bold text-foreground focus:not-sr-only focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      href="#main-content"
    >
      Saltar al contenido principal
    </a>
  );
}
