const palette = ["#0b70c9", "#f0b429", "#13a383", "#805ad5", "#e36a5c", "#46617f"];

export function SalesPieChart({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  let offset = 0;
  const stops = entries.map(([category, count], index) => {
    const start = offset;
    offset += (count / total) * 100;
    return { category, count, color: palette[index % palette.length], start, end: offset };
  });
  const gradient = stops.map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`).join(", ");
  return (
    <figure className="sales-chart">
      <div className="sales-donut" role="img" aria-label={`Sales by category: ${entries.map(([category, count]) => `${category.replaceAll("-", " ")} ${count}`).join(", ")}`} style={{ background: `conic-gradient(${gradient})` }}>
        <span>{total}<small>sales</small></span>
      </div>
      <figcaption>
        <strong>Recorded sales by category</strong>
        <ul>{stops.map((slice) => <li key={slice.category}><span style={{ backgroundColor: slice.color }} aria-hidden="true" />{slice.category.replaceAll("-", " ")}<b>{slice.count}</b></li>)}</ul>
      </figcaption>
    </figure>
  );
}
