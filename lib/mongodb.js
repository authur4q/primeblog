import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside your configuration.");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectMongoDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000, // Fail after 5 seconds instead of 30
    socketTimeoutMS: 45000,         // Close sockets after 45 seconds of inactivity
    maxPoolSize: 10,                // Maintain up to 10 socket connections
  };

  cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
    return mongooseInstance;
  });
}

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectMongoDb;