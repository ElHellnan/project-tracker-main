const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory data
let users = [
  {
    id: '1',
    email: 'test@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkkR.9ePLFa1.ZK',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User'
  }
];

let projects = [
  {
    id: '1',
    name: 'Sample Project',
    description: 'Your first project',
    color: '#3B82F6',
    ownerId: '1',
    owner: { username: 'testuser', firstName: 'Test', lastName: 'User' },
    members: [{ userId: '1', role: 'OWNER' }],
    boards: [{
      id: '1',
      name: 'Main Board',
      columns: [
        { id: '1', name: 'To Do', tasks: [{ id: '1', title: 'Sample Task', description: 'Test task' }] },
        { id: '2', name: 'In Progress', tasks: [] },
        { id: '3', name: 'Done', tasks: [] }
      ]
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const JWT_SECRET = 'simple-secret';
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    let body = {};
    
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      body = {};
    }

    let response;

    // Health
    if (path === '/health' && method === 'GET') {
      response = { success: true, message: 'Working!', users: users.length, projects: projects.length };
    }
    
    // Register
    else if (path === '/auth/register' && method === 'POST') {
      const { email, password, firstName = 'User', lastName = 'Name' } = body;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Email and password required' })
        };
      }
      
      if (users.find(u => u.email === email)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'User already exists' })
        };
      }

      const user = {
        id: generateId(),
        email,
        password: await bcrypt.hash(password, 8),
        username: email.split('@')[0],
        firstName,
        lastName
      };

      users.push(user);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      response = {
        success: true,
        data: { 
          user: { id: user.id, email, firstName, lastName, username: user.username },
          token 
        }
      };
    }
    
    // Login
    else if (path === '/auth/login' && method === 'POST') {
      const { email, password } = body;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Email and password required' })
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
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Invalid credentials' })
        };
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      response = {
        success: true,
        data: { 
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, username: user.username },
          token 
        }
      };
    }
    
    // Logout
    else if (path === '/auth/logout' && method === 'POST') {
      response = { success: true };
    }
    
    // Projects - NO AUTH REQUIRED FOR NOW
    else if (path === '/projects' && method === 'GET') {
      response = { success: true, data: projects };
    }
    
    // Create project - NO AUTH REQUIRED FOR NOW
    else if (path === '/projects' && method === 'POST') {
      const { name = 'New Project', description = '', color = '#3B82F6' } = body;
      
      const project = {
        id: generateId(),
        name,
        description,
        color,
        ownerId: '1',
        owner: { username: 'user', firstName: 'User', lastName: 'Name' },
        members: [{ userId: '1', role: 'OWNER' }],
        boards: [{
          id: generateId(),
          name: 'Main Board',
          columns: [
            { id: generateId(), name: 'To Do', tasks: [] },
            { id: generateId(), name: 'In Progress', tasks: [] },
            { id: generateId(), name: 'Done', tasks: [] }
          ]
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      projects.push(project);
      response = { success: true, data: project };
    }
    
    // Delete project
    else if (path.startsWith('/projects/') && method === 'DELETE') {
      const projectId = path.split('/')[2];
      projects = projects.filter(p => p.id !== projectId);
      response = { success: true };
    }
    
    // Create task
    else if (path === '/tasks' && method === 'POST') {
      const { title = 'New Task', description = '', columnId, priority = 'MEDIUM' } = body;
      
      if (!columnId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Column ID required' })
        };
      }
      
      const task = {
        id: generateId(),
        title,
        description,
        columnId,
        priority,
        createdAt: new Date().toISOString()
      };
      
      // Add to column
      for (const project of projects) {
        for (const board of project.boards) {
          const column = board.columns.find(c => c.id === columnId);
          if (column) {
            column.tasks.push(task);
            response = { success: true, data: task };
            break;
          }
        }
      }
      
      if (!response) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Column not found' })
        };
      }
    }
    
    // Delete task
    else if (path.startsWith('/tasks/') && method === 'DELETE') {
      const taskId = path.split('/')[2];
      
      for (const project of projects) {
        for (const board of project.boards) {
          for (const column of board.columns) {
            const taskIndex = column.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
              column.tasks.splice(taskIndex, 1);
              response = { success: true };
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
    
    else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: `Not found: ${path}` })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify(response)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ success: false, error: error.message, stack: error.stack })
    };
  }
};