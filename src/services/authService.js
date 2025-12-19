const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenUtils');

/**
 * Register a new user
 */
const register = async (userData) => {
  const { username, email, password } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw ApiError.conflict('Email already exists', [
        { field: 'email', message: 'Email is already registered' },
      ]);
    }
    throw ApiError.conflict('Username already exists', [
      { field: 'username', message: 'Username is already taken' },
    ]);
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  });

  // Generate tokens
  const tokens = generateTokens(user._id);

  // Save refresh token
  await saveRefreshToken(user._id, tokens.refreshToken);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    tokens,
  };
};

/**
 * Login user
 */
const login = async (email, password) => {
  // Find user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.invalidCredentials('Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw ApiError.invalidCredentials('Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokens(user._id);

  // Save refresh token
  await saveRefreshToken(user._id, tokens.refreshToken);

  return { tokens };
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token JWT
  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Check if token exists in database and is not revoked
  const storedToken = await RefreshToken.findValidToken(refreshToken);

  if (!storedToken) {
    throw ApiError.unauthorized('Refresh token is invalid or expired');
  }

  // Check if user still exists
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  // Revoke old refresh token
  await storedToken.revoke();

  // Generate new tokens
  const tokens = generateTokens(user._id);

  // Save new refresh token
  await saveRefreshToken(user._id, tokens.refreshToken);

  return { tokens };
};

/**
 * Logout user - revoke refresh token
 */
const logout = async (refreshToken) => {
  if (!refreshToken) {
    return; // Silently ignore if no token provided
  }

  const hashedToken = RefreshToken.hashToken(refreshToken);
  await RefreshToken.findOneAndUpdate(
    { token: hashedToken },
    { isRevoked: true }
  );
};

/**
 * Logout from all devices - revoke all refresh tokens
 */
const logoutAll = async (userId) => {
  await RefreshToken.revokeAllUserTokens(userId);
};

/**
 * Get current user profile
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

/**
 * Helper: Save refresh token to database
 */
const saveRefreshToken = async (userId, token) => {
  const hashedToken = RefreshToken.hashToken(token);
  
  // Calculate expiration (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token: hashedToken,
    user: userId,
    expiresAt,
  });
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  getCurrentUser,
};

