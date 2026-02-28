require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();

// ========================================
// 🔹 MongoDB Connection
// ========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// ========================================
// 🔹 Schema
// ========================================
const healthSchema = new mongoose.Schema({
    metrics: Object,
    overall: Object,
    timestamp: {
        type: Date,
        default: Date.now
    },
    rawData: {
        blood_pressure: [Number],
        heart_rate: [Number],
        glucose: [Number],
        spo2: [Number],
        sleep: [Number],
        steps: [Number],
        eeg: [Number],
        emg: [Number],
        ecg: [Number]
    }
}, { collection: "dynamic_data" });

const DynamicData = mongoose.model("dynamic_data", healthSchema);

// ========================================
// 🔹 Serial Port Setup
// ========================================
const port = new SerialPort({
    path: process.env.SERIAL_PORT,
    baudRate: 115200,
    autoOpen: false
});

// Open port safely
port.open((err) => {
    if (err) {
        return console.error("❌ Serial Open Error:", err.message);
    }
    console.log("✅ Serial Port Opened:", process.env.SERIAL_PORT);
});

// Handle serial errors
port.on("error", (err) => {
    console.error("❌ Serial Error:", err.message);
});

// Parse line by line
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// ========================================
// 🔹 EEG & EMG Buffers
// ========================================
let eegBuffer = [];
let emgBuffer = [];

// ========================================
// 🔹 Serial Data Handling
// ========================================
parser.on("data", async (line) => {

    console.log("📥 RAW:", line);

    // Check for EMG Level format (plain text)
    if (line.includes("EMG Level:")) {
        try {
            const match = line.match(/EMG Level:\s*([\d.]+)/);
            if (match) {
                const value = parseFloat(match[1]) * 10;
                if (!isNaN(value)) {
                    emgBuffer.push(value);
                    console.log(`💪 EMG Buffered: ${value} (Total: ${emgBuffer.length})`);

                    // Save every 100 EMG samples
                    if (emgBuffer.length >= 100) {
                        console.log("⚡ 100 EMG samples collected. Saving to database...");

                        // Get latest document or create new one
                        let lastDoc = await DynamicData.findOne().sort({ timestamp: -1 });

                        if (!lastDoc) {
                            console.log("⚠ No previous document found. Creating initial document...");
                            lastDoc = new DynamicData({
                                metrics: {},
                                overall: {},
                                timestamp: new Date(),
                                rawData: {
                                    blood_pressure: [],
                                    heart_rate: [],
                                    glucose: [],
                                    spo2: [],
                                    sleep: [],
                                    steps: [],
                                    eeg: [],
                                    emg: emgBuffer,
                                    ecg: []
                                }
                            });
                        } else {
                            // Create new document with EMG data
                            lastDoc = new DynamicData({
                                metrics: lastDoc.metrics,
                                overall: lastDoc.overall,
                                timestamp: new Date(),
                                rawData: {
                                    blood_pressure: lastDoc.rawData?.blood_pressure || [],
                                    heart_rate: lastDoc.rawData?.heart_rate || [],
                                    glucose: lastDoc.rawData?.glucose || [],
                                    spo2: lastDoc.rawData?.spo2 || [],
                                    sleep: lastDoc.rawData?.sleep || [],
                                    steps: lastDoc.rawData?.steps || [],
                                    eeg: lastDoc.rawData?.eeg || [],
                                    emg: emgBuffer,
                                    ecg: lastDoc.rawData?.ecg || []
                                }
                            });
                        }

                        await lastDoc.save();
                        console.log("✅ New document with EMG data saved to dynamic_data");

                        emgBuffer = [];
                    }
                }
            }
        } catch (err) {
            console.error("❌ EMG Processing Error:", err.message);
        }
        return;
    }

    // Handle JSON format (for EEG or other data)
    try {
        const data = JSON.parse(line);

        if (data.type === "eeg") {

            const value = parseFloat(data.value);

            if (isNaN(value)) return;

            eegBuffer.push(value * 100);

            console.log(`🧠 EEG Buffered: ${value}`);

            if (eegBuffer.length >= 100) {

                console.log("⚡ 100 EEG samples collected. Creating new document...");

                // Get latest document
                const lastDoc = await DynamicData.findOne().sort({ timestamp: -1 });

                if (!lastDoc) {
                    console.log("⚠ No previous document found.");
                    eegBuffer = [];
                    return;
                }

                // Create new document
                const newDoc = new DynamicData({
                    metrics: lastDoc.metrics,
                    overall: lastDoc.overall,
                    timestamp: new Date(),
                    rawData: {
                        blood_pressure: lastDoc.rawData?.blood_pressure || [],
                        heart_rate: lastDoc.rawData?.heart_rate || [],
                        glucose: lastDoc.rawData?.glucose || [],
                        spo2: lastDoc.rawData?.spo2 || [],
                        sleep: lastDoc.rawData?.sleep || [],
                        steps: lastDoc.rawData?.steps || [],
                        eeg: eegBuffer,
                        emg: lastDoc.rawData?.emg || [],
                        ecg: lastDoc.rawData?.ecg || []
                    }
                });

                await newDoc.save();

                console.log("✅ New document saved to dynamic_data");

                eegBuffer = [];
            }
        }

    } catch (err) {
        // Ignore non-JSON logs (decorative lines like "----")
    }
});

// ========================================
// 🔹 Health Route
// ========================================
app.get("/", (req, res) => {
    res.send("EEG Streaming Backend Running 🚀");
});

// ========================================
app.listen(process.env.PORT, () => {
    console.log(`🚀 Server Running on Port ${process.env.PORT}`);
});