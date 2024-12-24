const express = require("express");
const multer = require("multer");
const path = require("path");
const Book = require("../schema/book");
const Class = require("../schema/class");
const { v4: uuidv4 } = require("uuid"); // Import uuid
const router = express.Router();
const {generateQRCodeToFile} = require('../utils');
// Multer setup with dynamic storage options based on unique_id
const getMulterStorage = (unique_id) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.mimetype === "application/pdf") {
                cb(null, "public/uploads/pdfs");
            } else if (file.mimetype.startsWith("image")) {
                cb(null, "public/uploads/images");
            } else {
                cb(null, "public/uploads/misc");
            }
        },
        filename: function (req, file, cb) {
            // Use the unique_id generated in the POST request
            cb(null, unique_id + path.extname(file.originalname));
        },
    });
};

// Multer setup with file size limit of 100 MB
const getMulterUpload = (unique_id) => {
    return multer({
        storage: getMulterStorage(unique_id),
        limits: { fileSize: 1000 * 1024 * 1024 }, // 100 MB in bytes
    });
};

// Get all books
router.get("/", async (req, res) => {
    try {
        const books = await Book.find({}).populate('series').populate('class');
        
        // Remove 'public' from image_url and pdf_url
        const booksWithoutPublic = books.map(book => ({
            ...book._doc, // Using _doc to access the plain JavaScript object
            image_url: book.image_url?.replace('public', ''),
            pdf_url: book.pdf_url?.replace('public', '')
        }));
        res.send(booksWithoutPublic);
    } catch (error) {
        console.error(error); // Use console.error for better error reporting
        res.status(500).send(error);
    }
});

// Upload a new book
router.post("/", async (req, res) => {
    // Generate unique_id here
    const unique_id = uuidv4();

    // Set up multer for this request with the unique_id
    const upload = getMulterUpload(unique_id).fields([
        { name: "pdf_url", maxCount: 1 },
        { name: "image_url", maxCount: 1 },
        { name: "video_url", maxCount: 1 },
    ]);

    // Call the multer middleware to handle the file upload
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).send({ error: err.message });
        } else if (err) {
            console.log(err)
            return res.status(400).send({ error: "File upload error"});
        }

        const { name, series, class: classId,rate } = req.body;
        try {
            // Validate that the class belongs to the series
            const classInstance = await Class.findById(classId);
            if (!classInstance || classInstance.series.toString() !== series) {
                return res.status(400).send({
                    error: "Class does not belong to the specified series",
                });
            }

            // Construct file paths using unique_id
            const pdfPath = req.files.pdf_url
                ? req.files.pdf_url[0].path.replace('public\\', '')
                : undefined;
            const imagePath = req.files.image_url
                ? req.files.image_url[0].path.replace('public\\', '')
                : undefined;
            const videoPath = req.files.video_url
                ? req.files.video_url[0].path.replace('public\\', '')
                : undefined;

            if(pdfPath)
            {
                const filepath = process.env.domain + '/uploads/pdfs/' + unique_id+ path.extname(pdfPath);

                generateQRCodeToFile(filepath,'public/uploads/qr/pdf/'+unique_id+'.png')
            }
            if(videoPath)
            {

                const filepath = process.env.domain + '/uploads/misc/' + unique_id + path.extname(videoPath);

                generateQRCodeToFile(filepath,'public/uploads/qr/video/'+unique_id+'.png')
            }

            // Create the book entry
            const book = new Book({
                name,
                unique_id, // Store unique_id in the database
                series,
                class: classId,
                pdf_url: pdfPath,
                image_url: imagePath,
                video_url: videoPath,
                rate:rate?rate:''
            });

            await book.save();
            res.status(201).send(book);
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    });
});

// Update an existing book
router.patch("/:id", async (req, res) => {
    const { name, unique_id, series, class: classId } = req.body;

    // Find the existing book entry to get its unique_id
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).send({ error: "Book not found" });
    }

    // Set up multer for this request with the existing unique_id
    const upload = getMulterUpload(book.unique_id).fields([
        { name: "pdf_url", maxCount: 1 },
        { name: "image_url", maxCount: 1 },
        { name: "video_url", maxCount: 1 },
    ]);

    // Call the multer middleware to handle the file upload
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).send({ error: err.message });
            console.log(err)
        } else if (err) {
            console.log(err)
            return res.status(400).send({ error: "File upload error" });
        }

        try {
            // Validate that the class belongs to the series
            const classInstance = await Class.findById(classId);
            if (!classInstance || classInstance.series.toString() !== series) {
                return res.status(400).send({
                    error: "Class does not belong to the specified series",
                });
            }

            // Construct file paths using unique_id
            const pdfPath = req.files.pdf_url
                ? path.join(
                      "uploads/pdfs",
                      `${book.unique_id}${path.extname(req.files.pdf_url[0].originalname)}`
                  )
                : undefined;
            const imagePath = req.files.image_url
                ? path.join(
                      "uploads/images",
                      `${book.unique_id}${path.extname(req.files.image_url[0].originalname)}`
                  )
                : undefined;

            // Update the book entry
            const updatedBook = await Book.findByIdAndUpdate(
                req.params.id,
                {
                    name,
                    series,
                    class: classId,
                    pdf_url: pdfPath || undefined, // Only update if a new file is uploaded
                    image_url: imagePath || undefined, // Only update if a new file is uploaded
                },
                { new: true, runValidators: true }
            );

            res.send(updatedBook);
        } catch (error) {
            res.status(400).send(error);
        }
    });
});

// Delete an existing book
router.delete("/:id", async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).send({ error: "Book not found" });
        }

        // Optionally, you can also delete the associated files from the file system here

        res.send(book);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
