// routes/cloud.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const ensureAuthenticated = require("../config/auth").userlogin;

const Day = require("../models/Day"); // Mongoose model
const Visit = require("../models/visiter");
const secureRoute = (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("cloud/signin");
    }
    next();
  };
  
//-------------------------------------
// Ensure "uploads" folder
//-------------------------------------
const baseUploadPath = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(baseUploadPath)) {
  fs.mkdirSync(baseUploadPath);
}

//-------------------------------------
// Multer Setup
//-------------------------------------
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // The user picks day from <select name="chosenDay">
      const dayId = req.body.chosenDay;
      if (!dayId) {
        return cb(new Error("No day selected!"), "");
      }

      // Fetch from DB
      const theDay = await Day.findById(dayId);
      if (!theDay) {
        return cb(new Error("Day not found in DB!"), "");
      }

      // Create folder if needed
      const dayFolderPath = path.join(baseUploadPath, theDay.name);
      if (!fs.existsSync(dayFolderPath)) {
        fs.mkdirSync(dayFolderPath, { recursive: true });
      }

      cb(null, dayFolderPath);
    } catch (err) {
      cb(err, "");
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

function fileFilter(req, file, cb) {
  // Allowed: pdf, doc, docx, mp4, jpg, jpeg, png, gif
  const allowedTypes = /pdf|doc|docx|mp4|jpg|jpeg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Allowed: pdf, doc, docx, mp4, jpg, jpeg, png, gif"), false);
  }
}

const upload = multer({ storage, fileFilter });

//-------------------------------------
// ROUTES
//-------------------------------------

// (A) GET /cloud -> Index: List all days from DB
router.get("/",ensureAuthenticated, async (req, res) => {
  try {
    const days = await Day.find().sort({ createdAt: 1 });
    res.render("storage/index", { days });
  } catch (err) {
    console.error("Error in GET /cloud:", err);
    res.status(500).send("Server error");
  }
});

// (B) GET /cloud/createDay -> form
router.get("/createDay",ensureAuthenticated, (req, res) => {
  res.render("storage/createDay");
});

// (B) POST /cloud/createDay -> create new day
router.post("/createDay",ensureAuthenticated, async (req, res) => {
  try {
    const { newDayName } = req.body;
    if (!newDayName) {
      return res.status(400).send("Day name required");
    }
    // Minimal validation
    const isValidName = /^[a-zA-Z0-9_-]+$/.test(newDayName);
    if (!isValidName) {
      return res.status(400).send("Invalid day name");
    }

    // Create in DB
    const dayDoc = await Day.create({ name: newDayName });
    // Ensure folder
    const dayFolderPath = path.join(baseUploadPath, newDayName);
    if (!fs.existsSync(dayFolderPath)) {
      fs.mkdirSync(dayFolderPath, { recursive: true });
    }

    res.redirect("/cloud");
  } catch (err) {
    console.error("Error POST /cloud/createDay:", err);
    res.status(500).send("Could not create day. Maybe name already exists?");
  }
});

// (C) GET /cloud/upload -> form
router.get("/upload",ensureAuthenticated, async (req, res) => {
  try {
    // get all days from DB
    const days = await Day.find().sort({ createdAt: 1 });
    res.render("storage/upload", { days });
  } catch (err) {
    console.error("Error GET /cloud/upload:", err);
    res.status(500).send("Server error");
  }
});

// (C) POST /cloud/upload -> handle upload
router.post("/upload",ensureAuthenticated, upload.single("myfile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No valid file or file type not allowed.");
  }
  // success
  res.redirect("/cloud");
});

// (D) GET /cloud/setDefault/:id -> Mark one day as default
router.post("/setDefault/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Unset all defaults
    await Day.updateMany({}, { isDefault: false });
    // Set this one
    const updated = await Day.findByIdAndUpdate(id, { isDefault: true }, { new: true });
    if (!updated) {
      return res.status(404).send("Day not found");
    }
    res.redirect("/cloud"); // go back to index
  } catch (err) {
    console.error("Error in setDefault:", err);
    res.status(500).send("Server error");
  }
});

// (E) GET /cloud/default -> Show only the default day’s files
router.get("/default", async (req, res) => {
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
    res.render("storage/defaultDay", {
      dayName: defaultDay.name,
      files
    });
  } catch (err) {
    console.error("Error in GET /cloud/default:", err);
    res.status(500).send("Server error");
  }
});
router.get("/secure", secureRoute, (req, res) => {
    res.render("cloud/secure", { user: req.session.user });
  });
  
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Could not log out. Please try again.");
      }
      res.redirect("/signin");
    });
  });
  
router.post("/login", async (req, res) => {
    const { id, password } = req.body;
  console.log(req.body)
    try {
      const visit = await Visit.findById(id);
        console.log(req.body)
      if (!visit) {
        return res.status(404).render("signin", { error: "Visitor not found" });
      }
  
      const isMatch = await bcrypt.compare(password, visit.password);
  
      if (!isMatch) {
        return res.status(400).render("/signin", { error: "Invalid password" });
      }
  
      // Set session variables
      req.session.user = { id: visit._id, name: visit.name };
      // Redirect to secure page
      res.status(200).json("");
    } catch (error) {
      console.error(error);
      res.status(500).render("signin", { error: "Internal Server Error" });
    }
  });
  
  // Change Password Route (POST)
  router.post("/change-password/:id", async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await Visit.findByIdAndUpdate(id, { password: hashedPassword });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while updating the password" });
    }
});

// (F) GET /cloud/view/:dayName/:filename -> inline view (video, image, pdf)
router.get("/view/:dayName/:filename",ensureAuthenticated, (req, res) => {
  const { dayName, filename } = req.params;
  const filePath = path.join(baseUploadPath, dayName, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const ext = path.extname(filename).toLowerCase();
  const readStream = fs.createReadStream(filePath);

  // Set content-type for inline view
  if (ext === ".pdf") {
    res.setHeader("Content-Type", "application/pdf");
  } else if (ext === ".mp4") {
    res.setHeader("Content-Type", "video/mp4");
  } else if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
    // basic image content
    if (ext === ".jpg" || ext === ".jpeg") {
      res.setHeader("Content-Type", "image/jpeg");
    } else if (ext === ".png") {
      res.setHeader("Content-Type", "image/png");
    } else if (ext === ".gif") {
      res.setHeader("Content-Type", "image/gif");
    }
  } else {
    // doc/docx or unknown => fallback
    res.setHeader("Content-Type", "application/octet-stream");
  }

  readStream.pipe(res);
});

module.exports = router;
