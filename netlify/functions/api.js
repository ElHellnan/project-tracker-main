const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory data stores
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
    ownerId: '1',
    owner: {
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    },
    members: [{ userId: '1', role: 'OWNER' }],
    boards: [
      {
        id: '1',
        name: 'Main Board',
        projectId: '1',
        columns: [
          {
            id: '1',
            name: 'To Do',
            boardId: '1',
            position: 0,
            tasks: [
              { 
                id: '1', 
                title: 'Welcome Task', 
                description: 'Start using your project tracker!',
                columnId: '1',
                position: 0,
                priority: 'MEDIUM',
                status: 'TODO',
                assigneeId: '1',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: '2',
            name: 'In Progress',
            boardId: '1',
            position: 1,
            tasks: []
          },
          {
            id: '3',
            name: 'Done',
            boardId: '1',
            position: 2,
            tasks: []
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let tasks = [];
let comments = [];

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-project-tracker-2024';

// Helper functions
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const getUserFromToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return users.find(u => u.id === decoded.userId);
};

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
      const requestData = JSON.parse(body || '{}');
      const { email, password, username, firstName, lastName } = requestData;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Email and password are required' })
        };
      }
      
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'User already exists' })
        };
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        id: generateId(),
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
      response = {
        success: true,
        data: { user: userWithoutPassword, token },
        message: 'Registration successful'
      };
    }
    
    // User login
    else if (apiPath === '/auth/login' && httpMethod === 'POST') {
      const requestData = JSON.parse(body || '{}');
      const { email, password } = requestData;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Email and password are required' })
        };
      }
      
      const user = users.find(u => u.email === email);
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

    // User logout
    else if (apiPath === '/auth/logout' && httpMethod === 'POST') {
      response = {
        success: true,
        message: 'Logged out successfully'
      };
    }
    
    // Get projects
    else if (apiPath === '/projects' && httpMethod === 'GET') {
      const user = getUserFromToken(headers.authorization);
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }
      
      const userProjects = projects.filter(p => 
        p.ownerId === user.id || p.members.some(m => m.userId === user.id)
      );
      response = { success: true, data: userProjects };
    }

    // Create project
    else if (apiPath === '/projects' && httpMethod === 'POST') {
      const user = getUserFromToken(headers.authorization);
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }

      const requestData = JSON.parse(body || '{}');
      const { name, description, color } = requestData;

      if (!name) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Project name is required' })
        };
      }

      const newProject = {
        id: generateId(),
        name,
        description: description || '',
        color: color || '#3B82F6',
        ownerId: user.id,
        owner: {
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        },
        members: [{ userId: user.id, role: 'OWNER' }],
        boards: [{
          id: generateId(),
          name: 'Main Board',
          projectId: null,
          columns: [
            {
              id: generateId(),
              name: 'To Do',
              boardId: null,
              position: 0,
              tasks: []
            },
            {
              id: generateId(),
              name: 'In Progress',
              boardId: null,
              position: 1,
              tasks: []
            },
            {
              id: generateId(),
              name: 'Done',
              boardId: null,
              position: 2,
              tasks: []
            }
          ]
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update references
      newProject.boards[0].projectId = newProject.id;
      newProject.boards[0].columns.forEach(col => col.boardId = newProject.boards[0].id);

      projects.push(newProject);
      response = { success: true, data: newProject };
    }

    // Delete project
    else if (apiPath.match(/^\/projects\/(.+)$/) && httpMethod === 'DELETE') {
      const user = getUserFromToken(headers.authorization);
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }

      const projectId = apiPath.split('/')[2];
      const project = projects.find(p => p.id === projectId);

      if (!project || project.ownerId !== user.id) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Project not found or access denied' })
        };
      }

      projects = projects.filter(p => p.id !== projectId);
      response = { success: true, message: 'Project deleted successfully' };
    }

    // Create task
    else if (apiPath === '/tasks' && httpMethod === 'POST') {
      const user = getUserFromToken(headers.authorization);
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }

      const requestData = JSON.parse(body || '{}');
      const { title, description, columnId, priority, assigneeId } = requestData;

      if (!title || !columnId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Title and column are required' })
        };
      }

      const newTask = {
        id: generateId(),
        title,
        description: description || '',
        columnId,
        position: 0, // Add to top of column
        priority: priority || 'MEDIUM',
        status: 'TODO',
        assigneeId: assigneeId || user.id,
        creatorId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Find the column and add task
      for (const project of projects) {
        for (const board of project.boards) {
          const column = board.columns.find(c => c.id === columnId);
          if (column) {
            column.tasks.unshift(newTask); // Add to beginning
            break;
          }
        }
      }

      response = { success: true, data: newTask };
    }

    // Delete task
    else if (apiPath.match(/^\/tasks\/(.+)$/) && httpMethod === 'DELETE') {
      const user = getUserFromToken(headers.authorization);
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }

      const taskId = apiPath.split('/')[2];

      // Find and remove task
      for (const project of projects) {
        for (const board of project.boards) {
          for (const column of board.columns) {
            const taskIndex = column.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
              column.tasks.splice(taskIndex, 1);
              response = { success: true, message: 'Task deleted successfully' };
              break;
            }
          }
        }
      }

      if (!response) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Task not found' })
        };
      }
    }
    
    // Get users
    else if (apiPath === '/users' && httpMethod === 'GET') {
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
          availableEndpoints: [
            'GET /health', 
            'POST /auth/register', 
            'POST /auth/login', 
            'POST /auth/logout',
            'GET /projects',
            'POST /projects',
            'DELETE /projects/:id',
            'POST /tasks',
            'DELETE /tasks/:id',
            'GET /users'
          ]
        })
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
        details: 'Internal server error occurred'
      }),
    };
  }
};