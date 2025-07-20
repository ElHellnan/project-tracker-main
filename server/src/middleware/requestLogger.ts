import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);

  // Log request body for POST/PUT requests in development
  if (process.env.NODE_ENV === 'development' && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    console.log('Request body:', sanitizedBody);
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function (body: any) {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${timestamp}] ${logLevel} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // Log error responses in development
    if (process.env.NODE_ENV === 'development' && res.statusCode >= 400) {
      console.log('Response body:', body);
    }
    
    return originalJson.call(this, body);
  };

  next();
};