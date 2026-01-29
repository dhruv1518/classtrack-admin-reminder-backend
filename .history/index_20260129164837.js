import express from "express";
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

const app = express();
app.use(express.json());

// 🔐 Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const messaging = admin.messaging();

// 🧪 TEST ENDPOINT
app.get("/test", async (req, res) => {
  try {
    const adminDoc = await db
      .collection("admin_tokens")
      .doc("main_admin")
      .get();

    if (!adminDoc.exists) {
      return res.status(404).send("❌ Admin token not found");
    }

    const { token } = adminDoc.data();

    await messaging.send({
      token,
      notification: {
        title: "🧪 Test Notification",
        body: "Admin reminder backend is working 🚀",
      },
      android: { priority: "high" },
    });

    res.send("✅ Test notification sent");
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// 🚀 Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
