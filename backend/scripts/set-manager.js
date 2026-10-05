// One-time setup: replaces ALL staff accounts with a single manager account.
// Credentials come from environment variables so they never live in the code
// (or in GitHub):
//
//   PowerShell:
//     $env:MONGODB_URI='mongodb+srv://...'
//     $env:MANAGER_USER='Your Name'
//     $env:MANAGER_PASS='your-password'
//     npm run set-manager
//
// Restart the backend afterwards so any old login sessions are cleared.
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { Staff } from "../models.js";

const { MONGODB_URI, MANAGER_USER, MANAGER_PASS } = process.env;

if (!MONGODB_URI || !MANAGER_USER || !MANAGER_PASS) {
  console.error("Set MONGODB_URI, MANAGER_USER and MANAGER_PASS first (see the comment at the top of this file).");
  process.exit(1);
}
if (MANAGER_PASS.length < 6) {
  console.error("MANAGER_PASS must be at least 6 characters.");
  process.exit(1);
}

try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const removed = await Staff.deleteMany({});
  await Staff.create({
    _id: `staff-${nanoid(8)}`,
    username: MANAGER_USER.trim(),
    passwordHash: bcrypt.hashSync(MANAGER_PASS, 10),
    role: "manager",
    createdAt: new Date().toISOString()
  });
  console.log(`Done. Removed ${removed.deletedCount} old staff account(s); created manager "${MANAGER_USER.trim()}".`);
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
