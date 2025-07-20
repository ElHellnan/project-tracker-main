import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { authService } from '../services/authService.js';
import { 
  validateRequest, 
  registerSchema, 
  loginSchema, 
  updateUserSchema, 
  changePasswordSchema 
} from '../utils/validation.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRequest(registerSchema), asyncHandler(async (req, res) => {
  try {
    const { user, token } = await authService.registerUser(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed',
    });
  }
}));

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), asyncHandler(async (req, res) => {
  try {
    const { user, token } = await authService.loginUser(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user,
      token,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
    });
  }
}));

// POST /api/auth/logout
router.post('/logout', asyncHandler(async (req, res) => {
  // For JWT-based auth, logout is handled client-side by removing the token
  // In the future, we could implement token blacklisting here
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}));

// GET /api/auth/me
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    user: req.user,
  });
}));

// PUT /api/auth/me - Update user profile
router.put('/me', authenticateToken, validateRequest(updateUserSchema), asyncHandler(async (req, res) => {
  try {
    const user = await authService.updateUser(req.user!.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Profile update failed',
    });
  }
}));

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password change failed',
    });
  }
}));

// DELETE /api/auth/me - Delete user account
router.delete('/me', authenticateToken, asyncHandler(async (req, res) => {
  try {
    await authService.deleteUser(req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Account deletion failed',
    });
  }
}));

export default router;