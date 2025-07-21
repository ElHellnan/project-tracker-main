const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Initialize Prisma with correct database path
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, '..', 'data', 'prod.db')}`
    }
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-project-tracker';

exports.handler = async (event, context) => {
  const { httpMethod, path: requestPath, body, headers } = event;
  
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
    const apiPath = requestPath.replace('/.netlify/functions/api', '');
    let response;

    // Health check
    if (apiPath === '/health' && httpMethod === 'GET') {
      response = {
        success: true,
        message: 'Project Tracker API is running on Netlify!',
        timestamp: new Date().toISOString(),
        database: 'SQLite'
      };
    }
    
    // User registration
    else if (apiPath === '/auth/register' && httpMethod === 'POST') {
      const { email, password, username, firstName, lastName } = JSON.parse(body);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
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
      const user = await prisma.user.create({
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
      
      response = {
        success: true,
        data: { user, token },
        message: 'Registration successful'
      };
    }
    
    // User login
    else if (apiPath === '/auth/login' && httpMethod === 'POST') {
      const { email, password } = JSON.parse(body);
      
      const user = await prisma.user.findUnique({
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
      
      if (!user || !await bcrypt.compare(password, user.password)) {
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
      response = {
        success: true,
        data: { user: userWithoutPassword, token },
        message: 'Login successful'
      };
    }
    
    // Get projects
    else if (apiPath === '/projects' && httpMethod === 'GET') {
      const projects = await prisma.project.findMany({
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
      const users = await prisma.user.findMany({
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
        body: JSON.stringify({ success: false, message: `Endpoint not found: ${apiPath}` })
      };
    }

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
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};