export default function TrackSkeleton() {
  return (
    <div className="container" style={{ paddingTop: 40, maxWidth: 480 }} aria-hidden="true">
      <div className="skeleton-line skeleton-text" style={{ width: "40%", margin: "0 auto 12px" }} />
      <div className="skeleton-line skeleton-title" style={{ width: "60%", height: 28, margin: "0 auto 16px" }} />
      <div className="skeleton-line skeleton-text" style={{ width: "50%", margin: "0 auto 24px" }} />

      <div className="skeleton-box" style={{ width: "100%", height: 80, borderRadius: 12, marginBottom: 20 }} />

      <div className="card-surface" style={{ padding: 18 }}>
        <div className="skeleton-line skeleton-title" style={{ width: "45%", marginBottom: 14 }} />
        <div className="skeleton-line skeleton-text" style={{ width: "80%", marginBottom: 8 }} />
        <div className="skeleton-line skeleton-text" style={{ width: "70%", marginBottom: 8 }} />
        <div className="skeleton-line skeleton-text" style={{ width: "60%", marginBottom: 14 }} />
        <div className="skeleton-line skeleton-price" style={{ width: "25%" }} />
      </div>
    </div>
  );
}