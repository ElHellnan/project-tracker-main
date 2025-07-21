const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple in-memory store for demo (will reset on each function call)
let users = [
  {
    id: '1',
    email: 'test@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkkR.9ePLFa1.ZK', // password123
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date().toISOString()
  }
];

let projects = [
  {
    id: '1',
    name: 'My First Project',
    description: 'Welcome to your project tracker!',
    color: '#3B82F6',
    owner: {
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    },
    members: [],
    boards: [
      {
        id: '1',
        name: 'Main Board',
        columns: [
          {
            id: '1',
            name: 'To Do',
            tasks: [
              { id: '1', title: 'Welcome Task', description: 'Start using your project tracker!' }
            ]
          },
          {
            id: '2',
            name: 'In Progress',
            tasks: []
          },
          {
            id: '3',
            name: 'Done',
            tasks: []
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-project-tracker-2024';

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  const { httpMethod, path: requestPath, body, headers } = event;
  
  console.log('Function called:', { httpMethod, requestPath });
  
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
    console.log('API Path:', apiPath);
    
    let response;

    // Health check
    if (apiPath === '/health' && httpMethod === 'GET') {
      response = {
        success: true,
        message: 'Project Tracker API is running on Netlify!',
        timestamp: new Date().toISOString(),
        database: 'In-Memory',
        path: apiPath
      };
    }
    
    // User registration
    else if (apiPath === '/auth/register' && httpMethod === 'POST') {
      console.log('Registration attempt');
      const requestData = JSON.parse(body || '{}');
      const { email, password, username, firstName, lastName } = requestData;
      
      console.log('Registration data:', { email, username, firstName, lastName });
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Email and password are required' })
        };
      }
      
      // Check if user exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'User already exists' })
        };
      }
      
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        id: Date.now().toString(),
        email,
        password: hashedPassword,
        username: username || email.split('@')[0],
        firstName: firstName || 'User',
        lastName: lastName || 'Name',
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      const { password: _, ...userWithoutPassword } = newUser;
      console.log('Registration successful for:', email);
      
      response = {
        success: true,
        data: { user: userWithoutPassword, token },
        message: 'Registration successful'
      };
    }
    
    // User login
    else if (apiPath === '/auth/login' && httpMethod === 'POST') {
      console.log('Login attempt');
      const requestData = JSON.parse(body || '{}');
      const { email, password } = requestData;
      
      console.log('Login attempt for:', email);
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Email and password are required' })
        };
      }
      
      const user = users.find(u => u.email === email);
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
      console.log('Fetching projects');
      response = { success: true, data: projects };
    }
    
    // Get users
    else if (apiPath === '/users' && httpMethod === 'GET') {
      console.log('Fetching users');
      const publicUsers = users.map(({ password, ...user }) => user);
      response = { success: true, data: publicUsers };
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
        details: 'Internal server error occurred'
      }),
    };
  }
};