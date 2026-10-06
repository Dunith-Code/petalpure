import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env");
  }

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "PetalPure Admin",
      email,
      passwordHash: await argon2.hash(password),
      role: "ADMIN",
    },
  });

  const cats = [
    { name: "Skincare", slug: "skincare" },
    { name: "Hair Care", slug: "hair-care" },
    { name: "Body Care", slug: "body-care" },
    { name: "Face Care", slug: "face-care" },
  ];
  for (const c of cats) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const skincare = await prisma.category.findUniqueOrThrow({ where: { slug: "skincare" } });
  const hair = await prisma.category.findUniqueOrThrow({ where: { slug: "hair-care" } });
  const body = await prisma.category.findUniqueOrThrow({ where: { slug: "body-care" } });

  const products = [
    {
      name: "Rose Hydrating Face Cream", slug: "rose-hydrating-face-cream", brand: "PetalPure",
      description: "Lightweight daily moisturiser with rose extract and hyaluronic acid.",
      categoryId: skincare.id,
      variants: [
        { label: "50ml", sku: "RHFC-50", price: 3200, stock: 40 },
        { label: "100ml", sku: "RHFC-100", price: 5400, stock: 25 },
      ],
    },
    {
      name: "Argan Repair Shampoo", slug: "argan-repair-shampoo", brand: "PetalPure",
      description: "Sulphate-free shampoo that smooths and strengthens dry hair.",
      categoryId: hair.id,
      variants: [
        { label: "250ml", sku: "ARS-250", price: 2400, stock: 60 },
        { label: "500ml", sku: "ARS-500", price: 4100, stock: 30 },
      ],
    },
    {
      name: "Shea Body Lotion", slug: "shea-body-lotion", brand: "PetalPure",
      description: "Rich, fast-absorbing lotion with shea butter and vitamin E.",
      categoryId: body.id,
      variants: [{ label: "300ml", sku: "SBL-300", price: 2800, stock: 50 }],
    },
  ];

  for (const { variants, ...p } of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, images: [], variants: { create: variants } },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());