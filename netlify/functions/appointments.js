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
        console.log('✅ Connected to MongoDB');
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

// Netlify Function Handler
exports.handler = async (event, context) => {
    // Set context to prevent function from waiting for empty event loop
    context.callbackWaitsForEmptyEventLoop = false;

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        await connectDB();

        // GET: Fetch all appointments
        if (event.httpMethod === 'GET') {
            const appointments = await Appointment.find().sort({ date: -1 });
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(appointments)
            };
        }

        // POST: Create new appointment
        if (event.httpMethod === 'POST') {
            const { name, phone, reason } = JSON.parse(event.body);

            if (!name || !phone) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Name and Phone are required.'
                    })
                };
            }

            const newAppointment = new Appointment({ name, phone, reason });
            await newAppointment.save();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Appointment booked successfully!'
                })
            };
        }

        // DELETE: Delete appointment by ID
        if (event.httpMethod === 'DELETE') {
            const id = event.path.split('/').pop();

            const result = await Appointment.findByIdAndDelete(id);

            if (!result) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Appointment not found'
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Appointment deleted'
                })
            };
        }

        // Method not allowed
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Method not allowed'
            })
        };

    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Server error: ' + error.message
            })
        };
    }
};
