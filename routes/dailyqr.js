// Import necessary modules
const express = require("express");
const router = express.Router();
const DailyQr = require("../models/dailyQr");
const QRCode = require("qrcode");

// Routes for CRUD operations

// GET all QR records
router.get("/", async (req, res) => {
    try {
      const qrList = await DailyQr.find();
  
      // Generate QR codes for each record
      const qrListWithQrCodes = await Promise.all(
        qrList.map(async (qr) => {
          const url = `${qr.id}`;
          const qrCodeData = await QRCode.toDataURL(url);
          return { ...qr._doc, qrCodeData }; // Spread qr._doc to include other fields
        })
      );
  
      res.render("dailyqr/index", { qrList: qrListWithQrCodes });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  
// GET form to create a new QR record
router.get("/new", (req, res) => {
  res.render("dailyqr/new");
});

router.get("/check", (req, res) => {
    res.render("dailyqr/read");
  });
  

// POST a new QR record
router.post("/", async (req, res) => {
    const { QrValue, startTime, endTime, active } = req.body;

    // Function to convert time to Baghdad time
    const convertToBaghdadTime = (time) => {
        if (!time) return null;
        return new Date(
            new Date(time).toLocaleString("en-US", { timeZone: "Asia/Baghdad" })
        );
    };

    const newQr = new DailyQr({
        QrValue,
        startTime: convertToBaghdadTime(startTime),
        endTime: convertToBaghdadTime(endTime),
        active: active === "true", // Checkbox sends 'true' when checked
    });

    try {
        await newQr.save();
        res.redirect("/dailyqr");
    } catch (err) {
        res.status(500).send(err.message);
    }
});
  
// GET form to edit an existing QR record
router.get("/edit/:id", async (req, res) => {
  try {
    const qrRecord = await DailyQr.findById(req.params.id);
    res.render("dailyqr/edit", { qrRecord });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PUT (update) an existing QR record
router.post("/edit/:id", async (req, res) => {
  const { QrValue, startTime, endTime, active } = req.body;
  try {
    await DailyQr.findByIdAndUpdate(req.params.id, { QrValue, startTime, endTime, active });
    res.redirect("/dailyqr");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE a QR record
router.get("/delete/:id", async (req, res) => {
  try {
    await DailyQr.findByIdAndDelete(req.params.id);
    res.redirect("/dailyqr");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
