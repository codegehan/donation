import bcrypt from "bcryptjs";
import { db } from "../firebase/firebaseConfig.js";

// Get command line arguments
const args = process.argv.slice(2);

// Parse arguments
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : null;
};

async function createUser() {
  try {
    const userData = {
      name: getArg("--name") || "New User",
      email: getArg("--email"),
      password: getArg("--password") || "password123",
      role: getArg("--role") || "donor",
      phone: getArg("--phone") || "",
    };

    // Validate required fields
    if (!userData.email) {
      console.error("❌ Error: Email is required. Use --email flag");
      console.log("\nUsage:");
      console.log("  node scripts/createUser.js --email user@example.com [options]");
      console.log("\nOptions:");
      console.log("  --name       User's full name (default: 'New User')");
      console.log("  --email      User's email (required)");
      console.log("  --password   User's password (default: 'password123')");
      console.log("  --role       User's role: admin, donor, volunteer, relief_worker (default: 'donor')");
      console.log("  --phone      User's phone number (optional)");
      console.log("\nExample:");
      console.log('  node scripts/createUser.js --email admin@test.com --name "Admin" --role admin --password admin123');
      process.exit(1);
    }

    // Validate role
    const validRoles = ["admin", "donor", "volunteer", "relief_worker"];
    if (!validRoles.includes(userData.role)) {
      console.error(`❌ Error: Invalid role '${userData.role}'. Must be one of: ${validRoles.join(", ")}`);
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await db
      .collection("users")
      .where("email", "==", userData.email)
      .get();

    if (!existingUser.empty) {
      console.log("❌ User already exists with email:", userData.email);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const userRef = await db.collection("users").add({
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
    });

    console.log("✅ User created successfully!");
    console.log("👤 Name:", userData.name);
    console.log("📧 Email:", userData.email);
    console.log("🔑 Password:", userData.password);
    console.log("👔 Role:", userData.role);
    console.log("📱 Phone:", userData.phone || "N/A");
    console.log("🆔 User ID:", userRef.id);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating user:", error.message);
    process.exit(1);
  }
}

createUser();
