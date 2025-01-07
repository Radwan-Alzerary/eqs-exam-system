const router = require("express").Router();
const User = require("../models/user");
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;
const Visit = require("../models/visiter");

router.get("/", ensureAuthenticated, async (req, res) => {
  res.render("dashboard" );
});
router.get("/qr", async (req, res) => {
  res.render("qr-reder" );
});
router.get("/qr/check", async (req, res) => {
  const url = req.body.qrData

  const parts = url.split('/');
  const lastPart = parts[parts.length - 1]; // Extracts the last segment
  console.log(lastPart)
  const visiter = await Visit.findById(lastPart)
  res.json(visiter)
});

// GET /admin/approve -> Show unapproved visitors
router.get("/admin/approve", ensureAuthenticated, async (req, res) => {
  try {
    const unapprovedVisits = await Visit.find({ approved: false });
    const approvedVisits = await Visit.find({ approved: true });
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
    visit.enterprise =""
    await visit.save();

    res.json({ success: true, message: "Visitor empty successfully" });
  } catch (error) {
    console.error("Error in POST /admin/empty/:id:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});



router.get("/visitor", async (req, res) => {
  const visits = await Visit.find({registered:true,coming:true}).sort({ enterprise: 1 });
  res.render("visitorList",{visits} );
});
const cloudRouter = require("./cloud");
router.use("/cloud", cloudRouter);



module.exports = router;
