import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient({
  datasource: {
    url: "file:./data/prod.db"
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const handler = async (event, context) => {
  const { httpMethod, path, body, headers } = event;
  
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
    const apiPath = path.replace('/.netlify/functions/api', '');
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
    
    // Authentication endpoints
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
      
      if (!user || !bcrypt.compareSync(password, user.password)) {
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
        user: userWithoutPassword,
        token,
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
      response = { success: false, message: 'Endpoint not found' };
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
        error: error.message
      }),
    };
  }
};