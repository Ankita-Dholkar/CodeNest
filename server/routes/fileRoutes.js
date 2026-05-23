import express from 'express';
import { getFiles, createFile, updateFile, deleteFile } from '../controllers/fileController.js';

const router = express.Router();

router.get('/:projectId', getFiles);
router.post('/', createFile);
router.patch('/:id', updateFile);
router.delete('/:id', deleteFile);

export default router;
