export default function DishSkeleton() {
  return (
    <div className="dish-row dish-row-skeleton" aria-hidden="true">
      <div className="dish-row-img skeleton-box" />
      <div className="dish-row-body">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-text" />
        <div className="skeleton-line skeleton-price" />
      </div>
    </div>
  );
}