import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../firebase/firebaseConfig.js";

const JWT_SECRET = "MyS3cR3+K3y4aPI";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { collection = "users", data } = req.body;

    if (!data || !data.email || !data.password) { return res.status(400).json({ success: false, message: "Missing 'email' or 'password' field." }); }

    const existingUser = await db.collection(collection).where("email", "==", data.email).get();

    if (!existingUser.empty) { return res.status(409).json({ success: false, message: "Email already registered." }); }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userRef = await db.collection(collection).add({...data, password: hashedPassword, createdAt: new Date() });

    const newUserDoc = await userRef.get();
    const userData = newUserDoc.data();
    
    // Remove password from response
    const { password, ...cleanData } = userData;
    
    // Generate JWT token
    const token = jwt.sign({ id: newUserDoc.id, email: userData.email }, JWT_SECRET, { expiresIn: "3d" });

    res.json({ success: true, message: "User registered successfully.", token, data: { id: newUserDoc.id, ...cleanData } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post("/login", async (req, res) => {
  try {
    const { collection = "users", data } = req.body;

    if (!data || !data.email || !data.password) { return res .status(400).json({ success: false, message: "Email and password are required." });}

    const userSnapshot = await db.collection(collection).where("email", "==", data.email).get();

    if (userSnapshot.empty) { return res.status(404).json({ success: false, message: "User not found." }); }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(data.password, userData.password);
    if (!isMatch) { return res.status(401).json({ success: false, message: "Invalid password." }); }

    const { password, ...cleanData } = userData;
    const token = jwt.sign({ id: userDoc.id, email: userData.email }, JWT_SECRET, { expiresIn: "3d" });

    res.json({ success: true, message: "Login successful.", token, data: { id: userDoc.id, ...cleanData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.post("/add", async (req, res) => {
  try {
    const { collection, data } = req.body;

    if (!collection || !data) { return res.status(400).json({ error: "Both 'collection' and 'data' fields are required in the request body." }); }
    
    const docRef = await db.collection(collection).add(data);
    res.json({ success: true, message: `Document added to '${collection}' collection successfully. Doc id: ${docRef.id}` });
  } catch (error) {
    res.status(500).json({ success: false, message: `Error transaction.` });
  }
});

router.get("/get", async (req, res) => {
  try {
    const { collection, id } = req.query;
    if (!collection || !id) { return res.status(400).json({ success: false, message: "Missing 'collection' or 'id' query parameter." }); }

    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) { return res.status(404).json({ success: false, message: `No document found with ID '${id}' in collection '${collection}'.` });
    }
    res.json({ success: true, message: "Successfully retrieved.", data: { id: doc.id, ...doc.data() } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get("/getAll", async (req, res) => {
  try {
    const { collection } = req.query;
    if (!collection) { return res.status(400).json({ success: false, message: "Missing 'collection' query parameter." }); }

    const snapshot = await db.collection(collection).get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({ success: true, message: `Successfully retrieved all documents from '${collection}'.`, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put("/update", async (req, res) => {
  try {
    const { collection, id, data } = req.body;

    if (!collection || !id || !data) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: 'collection', 'id', or 'data'." 
      });
    }

    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: `No document found with ID '${id}' in collection '${collection}'.` 
      });
    }

    await docRef.update(data);
    const updatedDoc = await docRef.get();

    res.json({ 
      success: true, 
      message: `Document updated in '${collection}' collection successfully.`,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const { collection, id } = req.query;

    if (!collection || !id) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing 'collection' or 'id' query parameter." 
      });
    }

    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: `No document found with ID '${id}' in collection '${collection}'.` 
      });
    }

    await docRef.delete();
    res.json({ 
      success: true, 
      message: `Document deleted from '${collection}' collection successfully.` 
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Management Endpoints
router.get("/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => {
      const userData = doc.data();
      // Remove password from response
      const { password, ...cleanData } = userData;
      return { id: doc.id, ...cleanData };
    });

    res.json({ success: true, message: "Successfully retrieved all users.", users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await userRef.delete();
    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    if (!role) {
      return res.status(400).json({ success: false, message: "Role is required." });
    }

    const validRoles = ["admin", "relief_worker", "volunteer", "donor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}` 
      });
    }

    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await userRef.update({ 
      role,
      updatedAt: new Date()
    });

    const updatedDoc = await userRef.get();
    const userData = updatedDoc.data();
    const { password, ...cleanData } = userData;

    res.json({ 
      success: true, 
      message: "User role updated successfully.",
      user: { id: updatedDoc.id, ...cleanData }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// File Upload Endpoints
router.post("/uploadProof", async (req, res) => {
  try {
    const { trackingId, fileName, fileType, uploadedBy, uploadedById, uploadedAt, fileData } = req.body;

    if (!trackingId || !fileName) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: 'trackingId' and 'fileName'." 
      });
    }

    // Verify tracking document exists
    const trackingRef = db.collection("tracking").doc(trackingId);
    const trackingDoc = await trackingRef.get();

    if (!trackingDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: `Tracking document with ID '${trackingId}' not found.` 
      });
    }

    // Store proof metadata in Firestore with base64 image data if provided
    const proofRef = await db.collection("proofOfDistribution").add({
      trackingId,
      fileName,
      fileType,
      uploadedBy,
      uploadedById,
      uploadedAt,
      fileData: fileData || null, // Store base64 image data
      createdAt: new Date(),
      status: "uploaded"
    });

    res.json({ 
      success: true, 
      message: "Proof of distribution uploaded successfully.",
      proofId: proofRef.id
    });
  } catch (error) {
    console.error("Error uploading proof:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;