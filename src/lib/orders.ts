export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"] as const;
export const PAYMENT_METHODS = ["PAYHERE", "WHATSAPP"] as const;

export type OrderStatusT = (typeof ORDER_STATUSES)[number];
export type PaymentStatusT = (typeof PAYMENT_STATUSES)[number];

export const NEXT_STATUSES: Record<OrderStatusT, OrderStatusT[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const STATUS_LABEL: Record<OrderStatusT, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};