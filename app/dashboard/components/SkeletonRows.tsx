interface Props {
  rows?: number;
  columns?: number;
  columnWidths?: string; // e.g. "80px 1fr 140px 80px"
}

export default function SkeletonRows({ rows = 5, columns = 4, columnWidths }: Props) {
  const gridTemplate = columnWidths ?? `repeat(${columns}, 1fr)`;
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            display: "grid",
            gridTemplateColumns: gridTemplate,
            gap: "1rem",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--app-border)",
            alignItems: "center",
          }}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="dash-skeleton"
              style={{
                height: j === 1 ? 18 : 13,
                width: j === 0 ? "60%" : "100%",
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading data…</span>
    </>
  );
}
