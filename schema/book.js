const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    unique_id: {
        type: String,
        required: true,
        unique: true,
    },
    image_url: {
        type: String,
    },
    pdf_url: {
        type: String,
    },
    video_url: {
        type: String,
    },
    series: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Series",
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
    },
    rate:{
        type:String
    }
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
