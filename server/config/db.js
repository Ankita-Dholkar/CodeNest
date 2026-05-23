import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
    if (attempt < MAX_RETRIES) {
      console.log(`   ↳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }
    console.error('   ↳ Max retries reached. Exiting.');
    console.error('   ↳ Check: Is your IP whitelisted in MongoDB Atlas Network Access?');
    process.exit(1);
  }
};

export default connectDB;
