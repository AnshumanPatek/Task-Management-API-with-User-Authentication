const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups and cleanup
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Static method to hash token
refreshTokenSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to find valid token
refreshTokenSchema.statics.findValidToken = async function (token) {
  const hashedToken = this.hashToken(token);
  return this.findOne({
    token: hashedToken,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

// Static method to revoke all user tokens
refreshTokenSchema.statics.revokeAllUserTokens = async function (userId) {
  return this.updateMany(
    { user: userId, isRevoked: false },
    { isRevoked: true }
  );
};

// Instance method to revoke token
refreshTokenSchema.methods.revoke = async function () {
  this.isRevoked = true;
  return this.save();
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;

