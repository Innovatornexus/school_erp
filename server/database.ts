import mongoose from 'mongoose';

if (!process.env.MONGODB_CONNECTION_STRING) {
  console.error("MONGODB_CONNECTION_STRING environment variable is not set");
  process.exit(1);
}

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING!, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    console.log("Starting with connection retry...");
    // Don't exit immediately, just log the error
  }
};

// Initialize connection
connectToDatabase();

export { mongoose };
export type Database = typeof mongoose;