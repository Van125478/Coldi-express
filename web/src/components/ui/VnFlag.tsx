export function VnFlag({ className = "h-3.5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden="true">
      <rect width="20" height="14" rx="2" fill="#DA251D" />
      <path
        fill="#FFDD00"
        d="M10 2.4 11.1 5.7h3.5l-2.8 2.1 1.1 3.3L10 9.1 7.1 11.1 8.2 7.8 5.4 5.7h3.5L10 2.4Z"
      />
    </svg>
  );
}
