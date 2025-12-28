const mongoose = require('mongoose');

let cachedDb = null;

// MongoDB Connection
const connectDB = async () => {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    try {
        const MONGO_URI = process.env.MONGO_URI;

        if (!MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set');
        }

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false
        });

        cachedDb = mongoose.connection;
        return cachedDb;
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        throw err;
    }
};

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    reason: { type: String },
    date: { type: Date, default: Date.now }
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

// Netlify Function Handler for DELETE by ID
exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'DELETE') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        await connectDB();

        // Extract ID from path (e.g., /.netlify/functions/delete-appointment/123abc)
        const pathParts = event.path.split('/');
        const id = pathParts[pathParts.length - 1];

        if (!id || id === 'delete-appointment') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Appointment ID is required' })
            };
        }

        const result = await Appointment.findByIdAndDelete(id);

        if (!result) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ success: false, message: 'Appointment not found' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Appointment deleted' })
        };

    } catch (error) {
        console.error('Delete Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'Server error: ' + error.message })
        };
    }
};
