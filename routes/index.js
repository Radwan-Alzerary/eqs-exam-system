const router = require("express").Router();
const isfulladmin = require("../config/auth").isfulladmin;
const isCashire = require("../config/auth").isCashire;
const ensureAuthenticated = require("../config/auth").userlogin;
const Visit = require("../models/visiter");

router.use("/admin", require("./users"));
router.use("/visit", require("./visit"));
router.use("/", require("./routes"));

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

module.exports = router;
