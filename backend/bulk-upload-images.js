import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// ---------- CONFIG ----------
const MONGODB_URI = process.env.MONGODB_URI;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const IMAGES_ROOT = "C:\\Users\\GOLDEN K TECHNOLOGY\\OneDrive\\Desktop\\Projects\\savora\\SAVORA PICS";

if (!MONGODB_URI || !CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Missing one of: MONGODB_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  process.exit(1);
}

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

// ---------- MANUAL FILE → DISH NAME MAP ----------
// Left side: relative path from IMAGES_ROOT (with forward slashes)
// Right side: exact dish name as stored in MongoDB
const FILE_TO_DISH = {
  "DESSERTS/CHOCOLATE CAKE.jpg": "CHOCOLATE CAKE",
  "DESSERTS/FRUIT SALAD.jpg": "FRUIT SALAD ",
  "DESSERTS/ICE CREAM.jpg": "ICE CREAM ",
  "DRINKS/CHOCOLATE MILSHAKE.jpg": "CHOCOLATE MILKSHAKE ",
  "DRINKS/FANTA CITRON.jpg": "FANTA CITRON",
  "DRINKS/Fresh Passion Fruit Juice.jpg": "FRESH PASSION FRUIT JUICE",
  "DRINKS/GINGER TEA.jpg": "GINGER TEA",
  "DRINKS/ORANGE FANTA.jpg": "FANTA ORANGE",
  "DRINKS/STRAWBERRY MIKSHAKE.jpg": "STRAWBERRY MILKSHAKE",
  "GRILLS/BEEF BROCHETTES.jpg": "BEEF BROCHETTES",
  "GRILLS/GOAT MEAT SKEWERS.jpg": "GOAT MEAT SKEWERS",
  "GRILLS/GRILLED PORK RIBS.jpg": "GRILLED PORK RIBS",
  "GRILLS/GRILLED T-BONE STEAK.jpg": "T-BONE GRILLED STEAK",
  "GRILLS/GRILLED TILAPIA WITH FRIES.jpg": "GRILLED TILAPIA",
  "MAIN/AKABENZI.jpg": "AKABENZI",
  "MAIN/BEEF BURGER.jpg": "BEEF BURGER",
  "MAIN/BEEF PIZZA.jpg": "BEEF PIZZA",
  "MAIN/BEEF SHAWARMA.jpg": "BEEF SHAWARMA",
  "MAIN/BEEF STEW AND RICE.jpg": "BEEF STEW AND RICE",
  "MAIN/CHICKEN ALFREDO.jpg": "CHICKEN ALFREDO",
  "MAIN/CHICKEN BURGER.jpg": "CHICKEN BURGER",
  "MAIN/CHICKEN CURRY WITH RICE.jpg": "CHICKEN CURRY WITH RICE  ",
  "MAIN/FRIIED CHICKEN.jpg": "FRIED CHICKEN ",
  "MAIN/isombe and ugali.jpg": "ISOMBE AND UGALI MEAL",
  "MAIN/MATOKE PLATTER.jpg": "MATOKE PLATTER ",
  "MAIN/PEPPERONI PIZZA.jpg": null, // no matching dish — will be skipped
  "MAIN/RICE AND ISOMBE.jpg": "ISOMBE WITH RICE",
  "MAIN/Spaghetti-Bolognese.jpg": "SPHAGETTI BOLO-GNESSE",
  "SIDES/CAPATI.jpg": "CHAPATI",
  "SIDES/FRIES.jpg": "CRISPY FRIES",
  "SIDES/GRILLED CORN.jpg": "GRILLED CORN",
  "SIDES/KACHUMBARI.jpg": "KACHUMBARI",
  "STARTERS/CHICKEN SAMBUSA.jpg": null, // no matching dish — will be skipped
  "STARTERS/CHICKEN STRIPS.jpg": "CHICKEN STRIPS",
  "STARTERS/SAMBUSA BEEF.jpg": "BEEF SAMBUSA",
  "STARTERS/TOMATO AVOCADO SALAD.jpg": "TOMATO AVOCADO SALAD ",
  "STARTERS/VEGETABLE SPRING ROLLS.jpg": "VEGETABLE SPRING ROLLS",
};

// ---------- DB MODEL ----------
await mongoose.connect(MONGODB_URI);
const Dish = mongoose.model(
  "Dish",
  new mongoose.Schema(
    { _id: String },
    { strict: false, _id: false, versionKey: false }
  ),
  "dishes"
);

// ---------- RUN ----------
const results = { uploaded: 0, updated: 0, skipped: 0, errors: [] };

for (const [relPath, dishName] of Object.entries(FILE_TO_DISH)) {
  if (!dishName) {
    console.log(`⏭️  SKIP (no dish): ${relPath}`);
    results.skipped++;
    continue;
  }

  const absPath = path.join(IMAGES_ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    console.log(`❌ MISSING FILE: ${absPath}`);
    results.errors.push(`Missing file: ${absPath}`);
    continue;
  }

  const dish = await Dish.findOne({ name: dishName });
  if (!dish) {
    console.log(`❌ NO DISH: "${dishName}" (from ${relPath})`);
    results.errors.push(`No dish named "${dishName}"`);
    continue;
  }

  try {
    console.log(`📤 Uploading ${relPath} → dish "${dishName}"`);
    const upload = await cloudinary.uploader.upload(absPath, {
      folder: "savora/dishes",
      resource_type: "image",
    });
    dish.set("image", upload.secure_url);
    await dish.save();
    console.log(`   ✅ Saved: ${upload.secure_url}`);
    results.uploaded++;
    results.updated++;
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}`);
    results.errors.push(`${relPath}: ${err.message}`);
  }
}

console.log("\n========== SUMMARY ==========");
console.log(`Uploaded + updated: ${results.updated}`);
console.log(`Skipped (no dish):  ${results.skipped}`);
console.log(`Errors:             ${results.errors.length}`);
if (results.errors.length) {
  console.log("\nErrors:");
  results.errors.forEach((e) => console.log("  - " + e));
}

await mongoose.disconnect();
process.exit(0);