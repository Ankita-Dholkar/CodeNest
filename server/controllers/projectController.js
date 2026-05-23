import Project from '../models/Project.js';
import File from '../models/File.js';

// Default starter files for new React project
const defaultFiles = [
  { path: '/App.js', content: `export default function App() {\n  return (\n    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>\n      <h1>Hello from CodeNest 🚀</h1>\n    </div>\n  );\n}`, language: 'javascript' },
  { path: '/index.js', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);`, language: 'javascript' },
  { path: '/styles.css', content: `* { box-sizing: border-box; margin: 0; padding: 0; }`, language: 'css' },
];

// GET /api/projects
export const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const files = await File.find({ projectId: project._id });
    res.json({ project, files });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
export const createProject = async (req, res, next) => {
  try {
    const { name, description, template } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Project name is required' });
    const project = await Project.create({ name: name.trim(), description, template });
    // Seed with default starter files
    const seededFiles = defaultFiles.map((f) => ({ ...f, projectId: project._id }));
    await File.insertMany(seededFiles);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await File.deleteMany({ projectId: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};
