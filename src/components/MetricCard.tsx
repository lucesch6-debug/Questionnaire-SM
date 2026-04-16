type MetricTone = "default" | "accent" | "success";

type MetricCardProps = {
  label: string;
  value: string;
  tone?: MetricTone;
};

export function MetricCard({
  label,
  value,
  tone = "default",
}: MetricCardProps) {
  const toneClass = tone === "default" ? "" : ` metric-card--${tone}`;

  return (
    <div className={`metric-card${toneClass}`}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
    </div>
  );
}
