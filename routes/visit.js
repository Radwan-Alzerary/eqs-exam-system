const router = require("express").Router();
const Day = require("../models/Day");
const Visit = require("../models/visiter");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const baseUploadPath = path.join(__dirname, "..", "..", "uploads");

router.get("/", async (req, res) => {
  const visit = new Visit();
  await visit.save();
  res.json(visit);
});
router.post("/generate", async (req, res) => {
  const visit = new Visit();
  if (req.body.indstrial) {
    visit.indstrial = req.body.indstrial;
  }
  await visit.save();
  res.json(visit);
});
router.post("/reg/update", async (req, res) => {
  try {
    console.log(req.body);

    // Find the Visit record by ID
    const visit = await Visit.findById(req.body.id);
    console.log(req.body.id);

    if (!visit) {
      return res.status(404).json({ error: "Visit not found" });
    }

    // Update fields from the request body
    visit.name = req.body.name;
    visit.enterprise = req.body.enterprise;
    visit.inviteFrom = req.body.inviteFrom;
    visit.email = req.body.email;
    visit.CareerTitle = req.body.CareerTitle;
    visit.registeredDate = Date.now();
    visit.registered = true;

    // Update and hash password if provided
    if (req.body.password) {
      visit.password = await bcrypt.hash(req.body.password, 10);
    }

    // Save updated record
    await visit.save();

    // Render the registry complete page
    res.render("regesteryComplte");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/new", async (req, res) => {
  try {
    const visit = new Visit({
      name: req.body.name,
      inviteFrom: req.body.inviteFrom,
      enterprise: req.body.enterprise,
      email: req.body.email,
      CareerTitle: req.body.CareerTitle,
      registeredDate: Date.now(),
      registered: true,
    });

    await visit.save();
    res.render("regesteryComplte");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/manualnew", async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.body);
    const visit = new Visit({
      name: req.body.name,
      nickname: req.body.kneeType,
      indstrial: "مؤتمر النقابات",
      registeredDate: Date.now(),
      registered: true,
    });

    await visit.save();
    res.json("regesteryComplte");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/new", async (req, res) => {
  res.render("newVisit");
});
router.get("/reg/:id", async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    // If no visit found, create a new one
    if (!visit) {
      res.status(404).send("visit not vailed");
    } else {
      console.log(req.session);
      if (!req.session.user) {
        // User is NOT logged in
        if (visit.registered) {
          // The visit is registered, so check if approved
          if (!visit.approved) {
            // If not approved yet, show "please wait" page
            return res.render("pleaseWait", { visit });
          }
          // If approved, show sign-in page
          return res.render("storage/signin", { id: req.params.id });
        } else {
          // If not registered, show registration page
          return res.render("visitRegestery", { visit: visit });
        }
      } else {
        // We have a session user, proceed with existing logic
        try {
          // find the default day
          const defaultDay = await Day.findOne({ isDefault: true });
          if (!defaultDay) {
            return res.status(404).send("No default day found");
          }

          // read files in `uploads/<defaultDay.name>`
          const dayFolderPath = path.join(baseUploadPath, defaultDay.name);
          if (!fs.existsSync(dayFolderPath)) {
            return res
              .status(404)
              .send(`Folder for default day '${defaultDay.name}' does not exist`);
          }

          const files = fs.readdirSync(dayFolderPath);
          return res.render("storage/defaultDay", {
            dayName: defaultDay.name,
            files,
          });
        } catch (err) {
          console.error("Error in GET /cloud/default:", err);
          return res.status(500).send("Server error");
        }
      }

    }

    // If visit is found, proceed
  } catch (error) {
    console.error("Error in GET /reg/:id:", error);
    return res.status(500).send("Server error");
  }
});
router.get("/check", async (req, res) => {
  const visits = await Visit.find({
    registered: true,
    registeredDate: { $gte: new Date("2024-11-10") }, // Filter for dates after 2024/11/10

  }).sort({
    registeredDate: -1, // 1 for ascending order, -1 for descending order
  });

  res.render("visitCheck", { visits });
});
router.post("/comingaccept", async (req, res) => {
  const visits = await Visit.findByIdAndUpdate(req.body.id, {
    coming: true,
    comingDate: Date.now(),
  });
  res.json(visits);
});
router.get("/nameSearch/:name", async (req, res) => {
  const visits = await Visit.find({
    name: { $regex: req.params.name, $options: "i" },
    registeredDate: { $gte: new Date("2024-11-10") }, // Filter for dates after 2024/11/10
  });
  res.json(visits);
});
router.get("/award/", async (req, res) => {
  try {
    const visit = await Visit.aggregate([
      {
        $match: {
          indstrial: "اطفال 2024/5/10",
          registered: true,
          coming: true,
        },
      },
      {
        $sample: { size: 1 },
      },
    ]);
    res.render("award", { visit: visit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/nameSearch/", async (req, res) => {
  const visits = await Visit.find({
    indstrial: "اطفال 2024/5/10",
    registered: true,
  }).sort({
    registeredDate: -1,
  });

  res.json(visits);
});
router.get("/check/:id", async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  console.log(visit);
  if (visit) {
    if (visit.registered) {
      res.render("visitProfile", { visit });
    } else {
      await Visit.findByIdAndUpdate(req.params.id, { registered: true });
      res.render("visitRegestery", { visit: visit });
    }
  } else {
    res.json("error");
  }
});



module.exports = router;