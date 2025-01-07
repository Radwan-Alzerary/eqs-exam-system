const router = require("express").Router();
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;
const path = require("path");
const Day = require("../models/Day");
const Visit = require("../models/visiter");
const fs = require("fs");

router.use("/admin", require("./users"));
router.use("/visit", require("./visit"));
router.use("/", require("./routes"));
const baseUploadPath = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(baseUploadPath)) {
  fs.mkdirSync(baseUploadPath);
}

router.get("/new", async (req, res) => {
  const newVisit = new Visit();
  newVisit.indstrial = "مؤتمر الصيدلة";
  await newVisit.save();
  res.redirect(`/visit/reg/${newVisit.id}`);
});

router.get("/r/:id", async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) {
    const newVisit = new Visit();
    newVisit.indstrial = "مؤتمر النقابات";
    await newVisit.save();
    res.redirect(`/visit/reg/${newVisit.id}`);
  } else {
    if (visit.registered) {
      res.render("alredySubmint");
    } else {
      res.render("visitRegestery", { visit: visit });
    }
  }
});



router.get("/c/:id", async (req, res) => {
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


module.exports = router;
