const express = require("express");
const router = express.Router();
const streamController = require("../controllers/streamController");

router.post("/start", streamController.startStream);
router.put("/stop/:streamId", streamController.stopStream);
router.get("/active", streamController.getActiveStreams);
router.post("/add-viewer", streamController.addViewer);
router.post("/remove-viewer", streamController.removeViewer);

module.exports = router;
