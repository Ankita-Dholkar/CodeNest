import File from '../models/File.js';

// GET /api/files/:projectId
export const getFiles = async (req, res, next) => {
  try {
    const files = await File.find({ projectId: req.params.projectId });
    res.json(files);
  } catch (err) {
    next(err);
  }
};

// POST /api/files
export const createFile = async (req, res, next) => {
  try {
    const { projectId, path, content, language } = req.body;
    if (!projectId || !path) return res.status(400).json({ message: 'projectId and path are required' });
    const existing = await File.findOne({ projectId, path });
    if (existing) return res.status(409).json({ message: 'File already exists at this path' });
    const file = await File.create({ projectId, path, content, language });
    res.status(201).json(file);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/files/:id
export const updateFile = async (req, res, next) => {
  try {
    const { content } = req.body;
    const file = await File.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json(file);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/files/:id
export const deleteFile = async (req, res, next) => {
  try {
    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
};
