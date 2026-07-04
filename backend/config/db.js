import mongoose from 'mongoose';

export const connectDB = async () => {
  const connUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sb_stocks';
  
  let retries = 5;
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(connUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
      retries -= 1;
      console.log(`Retries left: ${retries}. Waiting 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.error('Failed to connect to MongoDB after multiple attempts. Exiting...');
  process.exit(1);
};
