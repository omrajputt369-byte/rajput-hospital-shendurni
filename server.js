require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rajputHospitalDB';

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Fail faster if no connection
        });
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        throw err;
    }
};

// Ensure DB is connected for every request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(503).json({ success: false, message: 'Database Connection Failed: ' + err.message });
    }
});

// Schema Definition
const appointmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    reason: { type: String },
    date: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// API Routes

// Test DB Connection Endpoint
// Test DB Connection Endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        await connectDB();

        // Try to perform a real write operation
        const testDoc = await Appointment.create({
            name: 'Connection Test',
            phone: '0000000000',
            reason: 'Verifying Write Access',
            date: new Date()
        });

        // If successful, delete it immediately
        await Appointment.findByIdAndDelete(testDoc._id);

        res.json({
            success: true,
            message: 'Database is Connected AND Writable!',
            details: 'Successfully created and deleted a test appointment.'
        });
    } catch (err) {
        console.error('Test DB Error:', err);
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

// GET: Fetch all appointments
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ date: -1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// POST: Book appointment
app.post('/api/appointments', async (req, res) => {
    const { name, phone, reason } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
    }

    try {
        console.log('Attempting to connect to DB for booking...');
        await connectDB();
        console.log('DB Connection Active. Saving appointment...');

        const newAppointment = new Appointment({ name, phone, reason });
        await newAppointment.save();

        console.log('Appointment saved successfully.');
        res.json({ success: true, message: 'Appointment booked successfully!' });
    } catch (err) {
        console.error('Booking Error:', err);
        res.status(500).json({ success: false, message: 'Failed to book appointment: ' + err.message });
    }
});

// DELETE: Delete an appointment
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const result = await Appointment.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        res.json({ success: true, message: 'Appointment deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting appointment' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
