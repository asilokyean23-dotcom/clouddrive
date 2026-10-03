type Props = {
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  open?: boolean;
};

export function FolderIcon({
  color = "#6366f1",
  className,
  size = "md",
  open,
}: Props) {
  const dim =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-lg ${className ?? ""}`.trim()}
      style={{ width: undefined }}
      aria-hidden
    >
      <svg
        viewBox="0 0 40 40"
        className={`${dim}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.95} />
            <stop offset="100%" stopColor={color} stopOpacity={0.65} />
          </linearGradient>
        </defs>
        <path
          d="M3 11.5c0-1.4 1.1-2.5 2.5-2.5h9.3c.7 0 1.4.3 1.8.9l2.4 3.4c.4.6 1.1.9 1.8.9h13c1.4 0 2.5 1.1 2.5 2.5v12.8c0 1.4-1.1 2.5-2.5 2.5h-32C4.2 29.5 3 28.4 3 27V11.5z"
          fill={`url(#grad-${color.replace("#", "")})`}
        />
        <path
          d={open ? "M3 13.5h34v3H3z" : "M3 14h34v15.5H3z"}
          fill="#ffffff"
          fillOpacity={open ? 0.18 : 0.28}
        />
      </svg>
    </span>
  );
}