import bcrypt from "bcryptjs";
import { db } from "../firebase/firebaseConfig.js";

async function createAdminUser() {
  try {
    const adminData = {
      name: "Clint k",
      email: "clint@disaster-relief.com",
      password: "password",
      role: "admin",
      phone: "+1234567890",
    };

    // Check if admin already exists
    const existingAdmin = await db
      .collection("users")
      .where("email", "==", adminData.email)
      .get();

    if (!existingAdmin.empty) {
      console.log("❌ Admin user already exists with email:", adminData.email);
      console.log("📧 Email:", adminData.email);
      console.log("🔑 Password: admin123");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create admin user
    const userRef = await db.collection("users").add({
      ...adminData,
      password: hashedPassword,
      createdAt: new Date(),
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", adminData.email);
    console.log("🔑 Password: admin123");
    console.log("🆔 User ID:", userRef.id);
    console.log("\n⚠️  Please change the password after first login!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
}

createAdminUser();
