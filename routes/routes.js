const router = require("express").Router();
const User = require("../models/user");
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;
const Visit = require("../models/visiter");
const DailyQr = require("../models/dailyQr");

router.get("/", ensureAuthenticated, async (req, res) => {
  res.render("dashboard");
});
router.get("/qr", async (req, res) => {
  res.render("qr-reder");
});
router.post("/qr/check", async (req, res) => {
  try {
    const url = req.body.qrData;
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1]; // Extract the last segment

    console.log("Extracted ID:", lastPart);

    // Validate the last part as a MongoDB ObjectId

    // Check if the visit exists
    const visitExists = await Visit.findById(lastPart);
    if (!visitExists) {
      return res.status(404).json({ error: "Visit not found" });
    }

    // Update the document
    const visit = await Visit.findByIdAndUpdate(
      lastPart,
      { $push: { Logins: Date.now() } },
      { new: true } // Return the updated document
    );

    console.log("Updated Visit:", visit);
    res.json(visit);
  } catch (error) {
    console.error("Error in /qr/check:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/qr/usercheck", async (req, res) => {
  try {
    const url = req.body.qrData;
    const user = req.session.user;
    console.log(url);
    console.log(user);

    const qrDays = await DailyQr.findById(url);

    // Get the current time and adjust to Baghdad timezone (UTC+3)
    const currentTime = new Date();
    const baghdadTime = new Date(currentTime.getTime() + 3 * 60 * 60 * 1000); // Add 3 hours
    if (qrDays.startTime && qrDays.endTime) {
      const isValid = currentTime >= qrDays.startTime && currentTime <= qrDays.endTime;

      if (isValid) {
        // Update the document
        const visit = await Visit.findByIdAndUpdate(
          user.id,
          { $push: { Logins: Date.now() } },
          { new: true } // Return the updated document
        );


        return res.json(visit);
      } else {
        return res.json({ message: "The current time is outside the valid range.", isValid });
      }
    } else {
      return res.json({ message: "Start time or end time is not defined.", isValid: false });
    }

    // Additional validation and updates can be added here
    res.json("visit");
  } catch (error) {
    console.error("Error in /qr/usercheck:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GET /admin/approve -> Show unapproved visitors
router.get("/admin/approve", ensureAuthenticated, async (req, res) => {
  try {
    const unapprovedVisits = await Visit.aggregate([
      { $match: { approved: false } },
      { $addFields: { numberAsInt: { $toInt: "$number" } } },
      { $sort: { numberAsInt: 1 } } // Sort in ascending order
    ]);

    const approvedVisits = await Visit.aggregate([
      { $match: { approved: true } },
      { $addFields: { numberAsInt: { $toInt: "$number" } } },
      { $sort: { numberAsInt: 1 } } // Sort in ascending order
    ]);
    res.render("admin/approve", { unapprovedVisits, approvedVisits });
  } catch (error) {
    console.error("Error in GET /admin/approve:", error);
    res.status(500).send("Server Error");
  }
});

// POST /admin/approve/:id/doapprove - Approve a visitor
router.post("/admin/approve/:id/doapprove", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findById(id);

    if (!visit) {
      return res.status(404).json({ success: false, message: "Visit not found" });
    }

    visit.approved = true;
    await visit.save();

    res.json({ success: true, message: "Visitor approved successfully" });
  } catch (error) {
    console.error("Error in POST /admin/approve/:id/doapprove:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST /admin/unapprove/:id - Unapprove a visitor
router.post("/admin/unapprove/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findById(id);

    if (!visit) {
      return res.status(404).json({ success: false, message: "Visit not found" });
    }

    visit.approved = false;
    await visit.save();

    res.json({ success: true, message: "Visitor unapproved successfully" });
  } catch (error) {
    console.error("Error in POST /admin/unapprove/:id:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// POST /admin/unapprove/:id - Unapprove a visitor
router.post("/admin/empty/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findById(id);

    if (!visit) {
      return res.status(404).json({ success: false, message: "Visit not found" });
    }
    visit.name = ""
    visit.nickname = ""
    visit.registered = false
    visit.approved = false
    visit.password = ""
    visit.email = ""
    visit.enterprise = ""
    await visit.save();

    res.json({ success: true, message: "Visitor empty successfully" });
  } catch (error) {
    console.error("Error in POST /admin/empty/:id:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});



router.get("/visitor", async (req, res) => {
  const visits = await Visit.find({ registered: true, coming: true }).sort({ enterprise: 1 });
  res.render("visitorList", { visits });
});
const cloudRouter = require("./cloud");
router.use("/cloud", cloudRouter);



module.exports = router;
