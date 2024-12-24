const express = require("express");
const Series = require("../schema/series");
const Class = require("../schema/class");
const router = express.Router();

// Get all series
router.get("/", async (req, res) => {
    try {
        const series = await Series.find({});
        res.status(201).send(series); // Success response (unchanged)
    } catch (error) {
        res.status(400).json({ error: error.message }); // Error response as JSON
    }
});

// Get all series with class
router.get("/withClass", async (req, res) => {
    try {
        const series = await Series.find({}).populate('classes').exec();
        res.status(201).send(series); // Success response (unchanged)
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message }); // Error response as JSON
    }
});

// Create a new series
router.post("/", async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).json({ error: 'Request body must contain a name' }); // Error response as JSON
        }
        const series = new Series(req.body);
        await series.save();
        res.status(201).send(series); // Success response (unchanged)
    } catch (error) {
        res.status(400).json({ error: error.message }); // Error response as JSON
    }
});

// Update an existing series
router.patch("/:id", async (req, res) => {
    try {
        const series = await Series.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!series) {
            return res.status(404).send(); // Success response (unchanged)
        }
        res.send(series); // Success response (unchanged)
    } catch (error) {
        res.status(400).json({ error: error.message }); // Error response as JSON
    }
});

// Delete a series
router.delete("/:id", async (req, res) => {
    try {
        let series = await Series.findById(req.params.id);
        if (series.classes.length !== 0) {
            return res.status(400).json({ error: 'Series must be deleted from all classes first' }); // Error response as JSON
        }
        if (!series) {
            return res.status(404).send(); // Success response (unchanged)
        }
        series = await Series.findByIdAndDelete(req.params.id);
        res.send(series); // Success response (unchanged)
    } catch (error) {
        res.status(500).json({ error: error.message }); // Error response as JSON
    }
});

module.exports = router;
