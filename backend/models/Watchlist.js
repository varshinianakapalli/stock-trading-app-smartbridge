import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  symbols: [
    {
      type: String,
      uppercase: true,
      trim: true
    }
  ]
}, {
  timestamps: true
});

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
export default Watchlist;
