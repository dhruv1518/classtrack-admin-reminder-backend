import express from "express";
import admin from "firebase-admin";

const app = express();
app.use(express.json());

/* -----------------------------------------
   🔐 Firebase Admin Initialization (SAFE)
------------------------------------------ */

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT env variable not set");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const messaging = admin.messaging();

/* -----------------------------------------
   🧪 TEST NOTIFICATION (ADMIN ONLY)
------------------------------------------ */

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
      android: {
        priority: "high",
      },
    });

    res.send("✅ Test notification sent to admin");
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).send(error.message);
  }
});

/* -----------------------------------------
   🚀 START SERVER
------------------------------------------ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
