export function CommandHint({ children }: { children: string }) {
  return (
    <kbd className="border-border bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
      {children}
    </kbd>
  );
}
