import mongoose from "mongoose";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Set MONGODB_URI env var first");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);

const Dish = mongoose.model("Dish", new mongoose.Schema({}, { strict: false }), "dishes");

const dishes = await Dish.find({});
let fixed = 0;
let needsUpload = 0;

for (const d of dishes) {
  const img = d.get("image") || "";

  // Case 1: broken prefix + Cloudinary URL → strip prefix
  const brokenPrefix = "https://savora-restaurant-ordering-system.onrender.comhttps://";
  if (img.startsWith(brokenPrefix)) {
    const fixedUrl = "https://" + img.slice(brokenPrefix.length);
    d.set("image", fixedUrl);
    await d.save();
    console.log(`✅ FIXED: ${d.get("name")}`);
    console.log(`   → ${fixedUrl}`);
    fixed++;
  }
  // Case 2: still the old /uploads/ path → file gone, needs re-upload
  else if (img.includes("/uploads/")) {
    console.log(`⚠️  NEEDS UPLOAD: ${d.get("name")} — file gone, re-upload from manager`);
    needsUpload++;
  }
}

console.log(`\n📊 Summary: ${fixed} fixed, ${needsUpload} need manual re-upload.`);
await mongoose.disconnect();