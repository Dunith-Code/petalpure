import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z.string().min(1, "Enter your password").max(128),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
});

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("https://") || v.startsWith("/"), "Image must be an https URL or a /path");

export const variantSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Each variant needs a label (e.g. 50ml)").max(40),
  sku: z
    .string()
    .trim()
    .min(2, "SKU must be at least 2 characters")
    .max(40)
    .transform((v) => v.toUpperCase()),
  price: z.coerce
    .number()
    .positive("Price must be greater than 0")
    .max(10_000_000)
    .transform((n) => Math.round(n * 100) / 100),
  stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").max(1_000_000),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Product name is required").max(120),
    brand: z.string().trim().max(60).optional(),
    description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
    categoryId: z.string().min(1, "Choose a category"),
    images: z.array(imageUrl).max(6, "Maximum 6 images").default([]),
    isActive: z.boolean().default(true),
    variants: z.array(variantSchema).min(1, "Add at least one variant").max(20),
  })
  .refine((p) => new Set(p.variants.map((v) => v.sku)).size === p.variants.length, {
    message: "Each variant needs a unique SKU",
    path: ["variants"],
  });

  export const stockSchema = z.object({
    stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").max(1_000_000),
  });

  export const orderUpdateSchema = z
  .object({
    status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
  })
  .refine((d) => d.status || d.paymentStatus, { message: "Nothing to update" });

  export const cartValidateSchema = z.object({
    items: z
      .array(
        z.object({
          variantId: z.string().min(1).max(40),
          qty: z.coerce.number().int().min(1).max(99),
        }),
      )
      .min(1)
      .max(50),
  });


  export const checkoutSchema = z.object({
    customerName: z.string().trim().min(2, "Please enter your name").max(80),
    email: z
      .union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email address").max(254)])
      .optional(),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .refine((v) => /^(\+94|0)\d{9}$/.test(v), "Enter a valid phone number, e.g. 0771234567"),
    address: z.string().trim().min(5, "Enter your delivery address").max(200),
    city: z.string().trim().min(2, "Enter your city").max(60),
    paymentMethod: z.enum(["WHATSAPP"]), // PayHere is added in the next step
    items: cartValidateSchema.shape.items,
  });

  export type CheckoutInput = z.output<typeof checkoutSchema>;