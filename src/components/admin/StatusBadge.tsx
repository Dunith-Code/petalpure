const styles: Record<string, string> = {
  PENDING: "bg-blush-100 text-rose-600",
  PROCESSING: "bg-sage-100 text-ink",
  SHIPPED: "bg-sage-100 text-ink",
  DELIVERED: "bg-sage-500 text-white",
  CANCELLED: "bg-blush-50 text-muted line-through",
  PAID: "bg-sage-100 text-ink",
  FAILED: "bg-blush-100 text-rose-600",
};

export default function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[value] ?? "bg-blush-50"}`}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </span>
  );
}