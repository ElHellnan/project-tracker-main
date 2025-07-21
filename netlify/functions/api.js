const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let prisma;

// Initialize Prisma only once
const initPrisma = () => {
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || "file:./data/prod.db"
          }
        },
        log: ['error']
      });
    } catch (error) {
      console.error('Failed to initialize Prisma:', error);
      throw error;
    }
  }
  return prisma;
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-project-tracker';

exports.handler = async (event, context) => {
  // Prevent function from timing out
  context.callbackWaitsForEmptyEventLoop = false;
  
  const { httpMethod, path: requestPath, body, headers } = event;
  
  console.log('Function called:', { httpMethod, requestPath, body: body?.substring(0, 100) });
  
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Initialize Prisma
    const db = initPrisma();
    
    const apiPath = requestPath.replace('/.netlify/functions/api', '');
    console.log('API Path:', apiPath);
    
    let response;

    // Health check
    if (apiPath === '/health' && httpMethod === 'GET') {
      response = {
        success: true,
        message: 'Project Tracker API is running on Netlify!',
        timestamp: new Date().toISOString(),
        database: 'SQLite',
        path: apiPath
      };
    }
    
    // User registration
    else if (apiPath === '/auth/register' && httpMethod === 'POST') {
      console.log('Registration attempt');
      const requestData = JSON.parse(body || '{}');
      const { email, password, username, firstName, lastName } = requestData;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Email and password are required' })
        };
      }
      
      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'User already exists' })
        };
      }
      
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          username: username || email.split('@')[0],
          firstName: firstName || 'User',
          lastName: lastName || 'Name',
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          createdAt: true
        }
      });
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      console.log('Registration successful for:', email);
      response = {
        success: true,
        data: { user, token },
        message: 'Registration successful'
      };
    }
    
    // User login
    else if (apiPath === '/auth/login' && httpMethod === 'POST') {
      console.log('Login attempt');
      const requestData = JSON.parse(body || '{}');
      const { email, password } = requestData;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Email and password are required' })
        };
      }
      
      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          password: true
        }
      });
      
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Invalid credentials' })
        };
      }
      
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Invalid credentials' })
        };
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      const { password: _, ...userWithoutPassword } = user;
      console.log('Login successful for:', email);
      response = {
        success: true,
        data: { user: userWithoutPassword, token },
        message: 'Login successful'
      };
    }
    
    // Get projects
    else if (apiPath === '/projects' && httpMethod === 'GET') {
      const projects = await db.project.findMany({
        include: {
          owner: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          },
          members: true,
          boards: {
            include: {
              columns: {
                include: {
                  tasks: true
                }
              }
            }
          }
        }
      });
      response = { success: true, data: projects };
    }
    
    // Get users
    else if (apiPath === '/users' && httpMethod === 'GET') {
      const users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          createdAt: true
        }
      });
      response = { success: true, data: users };
    }
    
    else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false, 
          message: `Endpoint not found: ${apiPath}`,
          availableEndpoints: ['/health', '/auth/register', '/auth/login', '/projects', '/users']
        })
      };
    }

    console.log('Response ready:', response.success);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify(response),
    };
    
  } catch (error) {
    console.error('API Error:', error);
    console.error('Stack:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        details: 'Check function logs for more information'
      }),
    };
  }
};