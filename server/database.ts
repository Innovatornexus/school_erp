import mongoose from 'mongoose';

if (!process.env.MONGODB_CONNECTION_STRING) {
  console.error("MONGODB_CONNECTION_STRING environment variable is not set");
  process.exit(1);
}

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING!);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

// Initialize connection
connectToDatabase();

export { mongoose };
export type Database = typeof mongoose;