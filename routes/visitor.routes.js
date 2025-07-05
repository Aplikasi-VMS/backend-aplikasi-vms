import express from 'express';
import { authorize, authorizeRole } from '../middlewares/auth.js';
import { getAllVisitors, addVisitor, updateVisitor, deleteVisitor } from '../controllers/visitor.controller.js';

const router = express.Router();

router.use(authorize); 

router.get('/', authorizeRole('SUPERUSER', 'ADMIN', 'RECEPTIONIST'), getAllVisitors);
router.post('/', authorizeRole('SUPERUSER', 'ADMIN'), addVisitor);
router.put('/:id', authorizeRole('SUPERUSER', 'ADMIN'), updateVisitor);
router.delete('/:id', authorizeRole('SUPERUSER'), deleteVisitor);

export default router;
