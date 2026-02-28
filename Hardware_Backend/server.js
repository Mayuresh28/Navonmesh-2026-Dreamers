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
const SERIAL_PATH = process.env.SERIAL_PORT;

if (!SERIAL_PATH) {
    console.error("❌ SERIAL_PORT not set in .env — serial disabled, server still runs.");
}

const port = SERIAL_PATH
    ? new SerialPort({ path: SERIAL_PATH, baudRate: 115200, autoOpen: false })
    : null;

if (port) {
    port.open((err) => {
        if (err) return console.error("❌ Serial Open Error:", err.message);
        console.log("✅ Serial Port Opened:", SERIAL_PATH);
    });
    port.on("error", (err) => console.error("❌ Serial Error:", err.message));
}

// Parse line by line (no-op if port is null)
const parser = port
    ? port.pipe(new ReadlineParser({ delimiter: "\r\n" }))
    : null;

// ========================================
// 🔹 Sensor Buffers
// ========================================
let eegBuffer = [];
let emgBuffer = [];
let ecgBuffer = [];

// Temporary EEG window accumulator (collects Theta/Alpha/Beta/Focus per 1-sec window)
let eegWindow = {};

// ========================================
// 🔹 Helper — flush a sensor buffer to MongoDB
// ========================================
async function flushBuffer(sensorName, buffer) {
    try {
        const lastDoc = await DynamicData.findOne().sort({ timestamp: -1 });

        const baseRaw = {
            blood_pressure: lastDoc?.rawData?.blood_pressure || [],
            heart_rate: lastDoc?.rawData?.heart_rate || [],
            glucose: lastDoc?.rawData?.glucose || [],
            spo2: lastDoc?.rawData?.spo2 || [],
            sleep: lastDoc?.rawData?.sleep || [],
            steps: lastDoc?.rawData?.steps || [],
            eeg: lastDoc?.rawData?.eeg || [],
            emg: lastDoc?.rawData?.emg || [],
            ecg: lastDoc?.rawData?.ecg || []
        };

        // Overwrite only the sensor being flushed
        baseRaw[sensorName] = [...buffer];

        const newDoc = new DynamicData({
            metrics: lastDoc?.metrics || {},
            overall: lastDoc?.overall || {},
            timestamp: new Date(),
            rawData: baseRaw
        });

        await newDoc.save();
        console.log(`✅ ${buffer.length} ${sensorName.toUpperCase()} samples saved to dynamic_data`);
    } catch (err) {
        console.error(`❌ ${sensorName.toUpperCase()} Save Error:`, err.message);
    }
}

// ========================================
// 🔹 Serial Data Handling
// ========================================
if (parser) {
parser.on("data", async (line) => {

    console.log("📥 RAW:", line);

    // ── EMG ── format: "EMG Level: <value>"
    if (line.includes("EMG Level:")) {
        try {
            const match = line.match(/EMG Level:\s*([\d.]+)/);
            if (match) {
                const value = parseFloat(match[1]) * 10;
                if (!isNaN(value)) {
                    emgBuffer.push(value);
                    console.log(`💪 EMG Buffered: ${value} (Total: ${emgBuffer.length})`);

                    if (emgBuffer.length >= 100) {
                        console.log("⚡ 100 EMG samples collected. Saving...");
                        await flushBuffer("emg", emgBuffer);
                        emgBuffer = [];
                    }
                }
            }
        } catch (err) {
            console.error("❌ EMG Processing Error:", err.message);
        }
        return;
    }

    // ── ECG ── format: "ECG Signal: <raw> | BPM: <bpm>"
    if (line.includes("ECG Signal:")) {
        try {
            const match = line.match(/ECG Signal:\s*([\d.]+)\s*\|\s*BPM:\s*([\d.]+)/);
            if (match) {
                const rawSignal = parseFloat(match[1]);
                const bpm = parseFloat(match[2]);

                if (!isNaN(rawSignal)) {
                    // Store raw ECG signal value (0-1023 ADC range)
                    ecgBuffer.push(rawSignal);

                    // Also store BPM once we have a valid reading
                    if (!isNaN(bpm) && bpm > 0) {
                        ecgBuffer._lastBPM = bpm;
                    }

                    console.log(`❤️  ECG Buffered: signal=${rawSignal} bpm=${bpm} (Total: ${ecgBuffer.length})`);

                    if (ecgBuffer.length >= 100) {
                        console.log("⚡ 100 ECG samples collected. Saving...");
                        await flushBuffer("ecg", ecgBuffer);
                        ecgBuffer = [];
                    }
                }
            }
        } catch (err) {
            console.error("❌ ECG Processing Error:", err.message);
        }
        return;
    }

    // ── EEG (text format) ── lines: "Theta: <val>", "Alpha: <val>", "Beta : <val>", "Focus Index: <val>"
    if (line.includes("Theta:")) {
        const m = line.match(/Theta:\s*([\d.]+)/);
        if (m) eegWindow.theta = parseFloat(m[1]);
        return;
    }
    if (line.includes("Alpha:")) {
        const m = line.match(/Alpha:\s*([\d.]+)/);
        if (m) eegWindow.alpha = parseFloat(m[1]);
        return;
    }
    if (line.startsWith("Beta") || line.includes("Beta :") || line.includes("Beta:")) {
        const m = line.match(/Beta\s*:\s*([\d.]+)/);
        if (m) eegWindow.beta = parseFloat(m[1]);
        return;
    }
    if (line.includes("Focus Index:")) {
        const m = line.match(/Focus Index:\s*([\d.]+)/);
        if (m) {
            eegWindow.focus = parseFloat(m[1]);

            // All 4 EEG metrics received — push focus_index as the primary value
            // and store the full band breakdown as a composite number
            if (!isNaN(eegWindow.focus)) {
                // Store focus_index scaled × 100 for consistency with existing EEG handler
                eegBuffer.push(eegWindow.focus * 100);
                console.log(`🧠 EEG Window: θ=${eegWindow.theta} α=${eegWindow.alpha} β=${eegWindow.beta} focus=${eegWindow.focus} (Total: ${eegBuffer.length})`);
            }

            eegWindow = {}; // reset for next window

            if (eegBuffer.length >= 100) {
                console.log("⚡ 100 EEG samples collected. Saving...");
                await flushBuffer("eeg", eegBuffer);
                eegBuffer = [];
            }
        }
        return;
    }

    // ── EEG (legacy JSON format) ── {"type":"eeg","value":<val>}
    try {
        const data = JSON.parse(line);

        if (data.type === "eeg") {
            const value = parseFloat(data.value);
            if (isNaN(value)) return;

            eegBuffer.push(value * 100);
            console.log(`🧠 EEG (JSON) Buffered: ${value} (Total: ${eegBuffer.length})`);

            if (eegBuffer.length >= 100) {
                console.log("⚡ 100 EEG samples collected. Saving...");
                await flushBuffer("eeg", eegBuffer);
                eegBuffer = [];
            }
        }
    } catch (err) {
        // Ignore non-JSON decorative lines (e.g. "------")
    }
});
} // end if (parser)

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