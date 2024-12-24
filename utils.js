const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require('fs');
const path = require('path');

// Function to generate QR code and return it as a PDF
const generateQRCodePDF = async (url) => {
  try {
    // Generate QR code as a buffer
    const qrCodeBuffer = await QRCode.toBuffer(url);

    // Create a new PDF document
    const doc = new PDFDocument();

    // Create a buffer to store the PDF data
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      return pdfData;
    });

    // Add the QR code image to the PDF
    doc.image(qrCodeBuffer, {
      fit: [250, 250],
      align: "center",
      valign: "center",
    });

    // Finalize the PDF and end the stream
    doc.end();

    // Wait for the PDF generation to finish
    return new Promise((resolve, reject) => {
      doc.on("finish", () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on("error", reject);
    });
  } catch (err) {
    throw new Error("Failed to generate QR Code PDF");
  }
};
const generateQRCode = async (url) => {
  try {
    return await QRCode.toBuffer(url);
  } catch (err) {
    throw new Error("Failed to generate QR Code");
  }
};

/**
 * Generates a QR code image and saves it to the specified path.
 * @param {string} url - The URL to encode in the QR code.
 * @param {string} filePath - The path where the QR code image should be saved.
 */
const generateQRCodeToFile = async (url, filePath) => {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(url);
    fs.writeFileSync(path.resolve(filePath), qrCodeBuffer);
  } catch (err) {
    throw new Error(`Failed to generate QR Code at ${filePath}. Error: ${err}`);
  }
};


module.exports = {
  generateQRCodePDF,
  generateQRCode,
  generateQRCodeToFile
}
