import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const demoSeller = await prisma.user.upsert({
    where: { email: "demo.seller@smartestate.ai" },
    update: {},
    create: {
      fullName: "Layla Al-Hashimi",
      email: "demo.seller@smartestate.ai",
      passwordHash,
      role: "seller",
    },
  });

  const demoBuyer = await prisma.user.upsert({
    where: { email: "demo.buyer@smartestate.ai" },
    update: {},
    create: {
      fullName: "Omar Khalil",
      email: "demo.buyer@smartestate.ai",
      passwordHash,
      role: "buyer",
    },
  });

  const listings = [
    {
      title: "Modern Abdoun apartment with Boulevard view",
      propertyType: "apartment",
      price: 165000,
      location: "Abdoun, West Amman",
      areaName: "Abdoun",
      bedrooms: 3,
      bathrooms: 2,
      size: 175,
      floor: "4",
      buildingAge: "5",
      description:
        "A bright, recently renovated 3-bedroom apartment near Abdoun Boulevard. Features open-plan living, smart climate, and underground parking.",
      extras: [
        "Underground parking",
        "Smart thermostat",
        "Balcony",
        "Concierge",
      ],
      images: [
        {
          src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop",
          label: "Living Room",
        },
        {
          src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&auto=format&fit=crop",
          label: "Kitchen",
        },
      ],
      aiPricing: "yes",
      estimatedYield: 6.4,
      demandScore: 8.7,
      aiConfidence: 0.86,
      nearbyDevelopment:
        "Walking distance to Abdoun Boulevard, City Mall (10m drive), Park Plaza Hotel.",
      sellerNote: "Open to scheduled visits this weekend.",
    },
    {
      title: "Spacious Dabouq villa with garden",
      propertyType: "villa",
      price: 420000,
      location: "Dabouq, West Amman",
      areaName: "Dabouq",
      bedrooms: 5,
      bathrooms: 4,
      size: 510,
      floor: "ground + first",
      buildingAge: "8",
      description:
        "A stately family villa in upper Dabouq with private garden, double parking, and a separate guest suite. Quiet street, established neighbours.",
      extras: ["Private garden", "Maid quarters", "Double parking", "Solar water"],
      images: [
        {
          src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&auto=format&fit=crop",
          label: "Front Facade",
        },
        {
          src: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=1600&auto=format&fit=crop",
          label: "Garden",
        },
      ],
      aiPricing: "no",
      estimatedYield: 4.8,
      demandScore: 7.4,
      aiConfidence: 0.71,
      nearbyDevelopment:
        "Close to Dabouq schools cluster and the Aljardaneh roundabout commercial strip.",
      sellerNote: "Owner relocating, motivated seller.",
    },
  ];

  for (const data of listings) {
    const slug = slugify(data.title);
    await prisma.listing.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        ownerId: demoSeller.id,
        title: data.title,
        propertyType: data.propertyType,
        price: data.price,
        location: data.location,
        areaName: data.areaName,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        size: data.size,
        floor: data.floor,
        buildingAge: data.buildingAge,
        description: data.description,
        extrasJson: JSON.stringify(data.extras),
        imagesJson: JSON.stringify(data.images),
        aiPricing: data.aiPricing,
        estimatedYield: data.estimatedYield,
        demandScore: data.demandScore,
        aiConfidence: data.aiConfidence,
        nearbyDevelopment: data.nearbyDevelopment,
        sellerNote: data.sellerNote,
        status: "available",
        verified: true,
      },
    });
  }

  console.log(
    `Seeded users: ${demoSeller.email}, ${demoBuyer.email} (password: password123)`
  );
  console.log(`Seeded ${listings.length} listings.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
