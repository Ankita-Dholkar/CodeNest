import express from 'express';
import { getAllProjects, getProject, createProject, deleteProject } from '../controllers/projectController.js';

const router = express.Router();

router.get('/', getAllProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.delete('/:id', deleteProject);

export default router;
