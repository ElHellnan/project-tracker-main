import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        bio?: string;
        createdAt: string;
        updatedAt: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Get user details
    const user = await authService.getUserById(decoded.userId);
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyToken(token);
      const user = await authService.getUserById(decoded.userId);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};