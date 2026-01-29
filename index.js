import express from "express";
import admin from "firebase-admin";
import cron from "node-cron";

// 🔐 Load Firebase credentials from ENV (Render-safe)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const messaging = admin.messaging();

const app = express();
app.use(express.json());

// ------------------------------------------------
// 🧪 TEST ENDPOINT (manual test)
// ------------------------------------------------
app.get("/test", async (req, res) => {
  try {
    const adminDoc = await db
      .collection("admin_tokens")
      .doc("main_admin")
      .get();

    if (!adminDoc.exists) {
      return res.status(404).send("Admin token not found");
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

    res.send("Test notification sent");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// ------------------------------------------------
// 🔔 CRON JOB – RUNS EVERY MINUTE
// ------------------------------------------------
cron.schedule("* * * * *", async () => {
  console.log("⏰ Cron running...");

  try {
    const now = admin.firestore.Timestamp.now();

    const snapshot = await db
      .collection("inquiries")
      .where("reminderSent", "==", false)
      .where("reminderAt", "<=", now)
      .get();

    if (snapshot.empty) {
      console.log("✅ No reminders to send");
      return;
    }

    const adminDoc = await db
      .collection("admin_tokens")
      .doc("main_admin")
      .get();

    if (!adminDoc.exists) {
      console.log("❌ Admin token missing");
      return;
    }

    const { token } = adminDoc.data();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // 🔔 Send notification
      await messaging.send({
        token,
        notification: {
          title: "📞 Inquiry Reminder",
          body: `${data.name} • ${data.course}`,
        },
        android: { priority: "high" },
      });

      // ✅ Mark as sent
      await doc.ref.update({
        reminderSent: true,
      });

      console.log(`🔔 Reminder sent for ${data.name}`);
    }
  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }
});

// ------------------------------------------------
// 🚀 START SERVER
// ------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
