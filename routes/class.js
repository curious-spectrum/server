const express = require("express");
const Class = require("../schema/class");
const Series = require("../schema/series");
const Book = require('../schema/book');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get classes for a series
router.get('/:series', async (req, res) => {
    const { series } = req.params;
    try {
        const existingSeries = await Series.findById(series);
        if (!existingSeries) {
            return res.status(404).json({ error: "Series not found" }); // Error as JSON
        }
        const classInstances = await Class.find({ series: req.params.id });
        res.send(classInstances); // Success response (unchanged)
    } catch (error) {
        res.status(500).json({ error: error.message }); // Error as JSON
    }
});

// Create a new class (only if series ID is provided)
router.post("/", async (req, res) => {
    const { name, series } = req.body;
    try {
        const existingSeries = await Series.findById(series);
        if (!existingSeries) {
            return res.status(404).json({ error: "Series not found" }); // Error as JSON
        }
        const classInstance = new Class({ name, series });
        await classInstance.save();

        // Add the class to the series
        existingSeries.classes.push(classInstance._id);
        await existingSeries.save();

        res.status(201).send(classInstance); // Success response (unchanged)
    } catch (error) {
        res.status(400).json({ error: error.message }); // Error as JSON
    }
});

// Update an existing class
router.patch("/:id", async (req, res) => {
    try {
        const classInstance = await Class.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true },
        );
        if (!classInstance) {
            return res.status(404).json({ error: 'Class not found' }); // Error as JSON
        }
        res.send(classInstance); // Success response (unchanged)
    } catch (error) {
        res.status(400).json({ error: error.message }); // Error as JSON
    }
});

// Delete a class
router.delete("/:id", async (req, res) => {
    try {
        // Find and delete the class instance
        const classInstance = await Class.findById(req.params.id);
        if (!classInstance) {
            return res.status(404).json({ error: 'Class not found' }); // Error as JSON
        }

        // Find the associated book
        const book = await Book.findOne({ class: classInstance._id });
        if (book) {
            // Delete the book’s image and PDF files
            if (book.image_url) {
                const imagePath = path.join(__dirname, '..', book.image_url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            if (book.pdf_url) {
                const pdfPath = path.join(__dirname, '..', book.pdf_url);
                if (fs.existsSync(pdfPath)) {
                    fs.unlinkSync(pdfPath);
                }
            }

            // Delete the book from the database
            await Book.findByIdAndDelete(book._id);
        }

        // Remove the class from the series
        await Series.findByIdAndUpdate(classInstance.series, {
            $pull: { classes: classInstance._id },
        });

        // Delete the class
        await Class.findByIdAndDelete(req.params.id);

        res.json({ message: 'Class and associated book deleted successfully' }); // Success response as JSON
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' }); // Error as JSON
    }
});

module.exports = router;
