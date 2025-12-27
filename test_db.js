require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
console.log("Testing connection to:", uri.replace(/:([^:@]{1,})@/, ':****@')); // Hide password

mongoose.connect(uri)
    .then(() => {
        console.log("✅ SUCCESS: Connected to MongoDB!");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ ERROR: Could not connect.");
        console.error(err);
        process.exit(1);
    });
