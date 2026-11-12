import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';

let mongodInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[DB] Connected to MongoDB at: ${uri}`);
      return;
    } catch (err) {
      console.warn(`[DB] Connection to provided MONGODB_URI failed: ${err.message}`);
    }
  }

  // Attempt local mongod or in-memory server
  try {
    const defaultUri = 'mongodb://127.0.0.1:27017/resolveflow';
    await mongoose.connect(defaultUri, { serverSelectionTimeoutMS: 1500 });
    console.log(`[DB] Connected to local MongoDB at: ${defaultUri}`);
  } catch (err) {
    console.warn(`[DB] Local mongod not running (${err.message}). Initializing embedded MongoMemoryServer...`);
    try {
      const opts = {};
      const possibleBinaries = ['/opt/homebrew/bin/mongod', '/usr/local/bin/mongod', '/usr/bin/mongod'];
      for (const bin of possibleBinaries) {
        if (fs.existsSync(bin)) {
          opts.binary = { systemBinary: bin };
          process.env.MONGOMS_SYSTEM_BINARY = bin;
          break;
        }
      }

      mongodInstance = await MongoMemoryServer.create(opts);
      const memUri = mongodInstance.getUri();
      await mongoose.connect(memUri);
      console.log(`[DB] Connected to Embedded MongoDB at: ${memUri}`);
    } catch (memErr) {
      console.error('[DB] Failed to start MongoMemoryServer:', memErr);
      throw memErr;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[DB] Error during disconnect:', err);
  }
};
