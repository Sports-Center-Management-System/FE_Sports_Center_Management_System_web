interface StatCardProps {
  helper: string
  label: string
  value: string
}

export function StatCard({ helper, label, value }: StatCardProps) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  )
}
