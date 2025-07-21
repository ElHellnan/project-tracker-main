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
    lastName: 'User',
    createdAt: new Date().toISOString()
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
        { id: '1', name: 'To Do', tasks: [] },
        { id: '2', name: 'In Progress', tasks: [] },
        { id: '3', name: 'Done', tasks: [] }
      ]
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const JWT_SECRET = 'simple-secret-key';
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const authHeader = event.headers.authorization || event.headers.Authorization || '';

    // Get user from token
    let currentUser = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUser = users.find(u => u.id === decoded.userId);
      } catch (e) {
        console.log('Token verification failed:', e.message);
      }
    }

    let response;

    // Health check
    if (path === '/health' && method === 'GET') {
      response = {
        success: true,
        message: 'API working!',
        timestamp: new Date().toISOString()
      };
    }
    
    // Register
    else if (path === '/auth/register' && method === 'POST') {
      const { email, password, firstName, lastName } = body;
      
      if (users.find(u => u.email === email)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'User exists' })
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: generateId(),
        email,
        password: hashedPassword,
        username: email.split('@')[0],
        firstName: firstName || 'User',
        lastName: lastName || 'Name',
        createdAt: new Date().toISOString()
      };

      users.push(user);
      const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
      
      response = {
        success: true,
        data: { 
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
          token 
        },
        message: 'Registration successful'
      };
    }
    
    // Login
    else if (path === '/auth/login' && method === 'POST') {
      const { email, password } = body;
      const user = users.find(u => u.email === email);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Invalid credentials' })
        };
      }

      const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
      response = {
        success: true,
        data: { 
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
          token 
        },
        message: 'Login successful'
      };
    }
    
    // Logout
    else if (path === '/auth/logout' && method === 'POST') {
      response = { success: true, message: 'Logged out' };
    }
    
    // Get projects (requires auth)
    else if (path === '/projects' && method === 'GET') {
      if (!currentUser) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }
      
      const userProjects = projects.filter(p => p.ownerId === currentUser.id);
      response = { success: true, data: userProjects };
    }
    
    // Create project (requires auth)
    else if (path === '/projects' && method === 'POST') {
      if (!currentUser) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }
      
      const { name, description, color } = body;
      const project = {
        id: generateId(),
        name: name || 'New Project',
        description: description || '',
        color: color || '#3B82F6',
        ownerId: currentUser.id,
        owner: { 
          username: currentUser.username, 
          firstName: currentUser.firstName, 
          lastName: currentUser.lastName 
        },
        members: [{ userId: currentUser.id, role: 'OWNER' }],
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
    
    // Delete project (requires auth)
    else if (path.startsWith('/projects/') && method === 'DELETE') {
      if (!currentUser) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }
      
      const projectId = path.split('/')[2];
      const project = projects.find(p => p.id === projectId);
      
      if (!project || project.ownerId !== currentUser.id) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Project not found' })
        };
      }
      
      projects = projects.filter(p => p.id !== projectId);
      response = { success: true, message: 'Project deleted' };
    }
    
    // Create task (requires auth)
    else if (path === '/tasks' && method === 'POST') {
      if (!currentUser) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }
      
      const { title, description, columnId, priority } = body;
      const task = {
        id: generateId(),
        title: title || 'New Task',
        description: description || '',
        columnId,
        priority: priority || 'MEDIUM',
        assigneeId: currentUser.id,
        createdAt: new Date().toISOString()
      };
      
      // Add task to the right column
      for (const project of projects) {
        for (const board of project.boards) {
          const column = board.columns.find(c => c.id === columnId);
          if (column) {
            column.tasks.push(task);
            break;
          }
        }
      }
      
      response = { success: true, data: task };
    }
    
    // Delete task (requires auth)
    else if (path.startsWith('/tasks/') && method === 'DELETE') {
      if (!currentUser) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Unauthorized' })
        };
      }
      
      const taskId = path.split('/')[2];
      let found = false;
      
      for (const project of projects) {
        for (const board of project.boards) {
          for (const column of board.columns) {
            const taskIndex = column.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
              column.tasks.splice(taskIndex, 1);
              found = true;
              break;
            }
          }
        }
      }
      
      if (!found) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Task not found' })
        };
      }
      
      response = { success: true, message: 'Task deleted' };
    }
    
    else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'Endpoint not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};