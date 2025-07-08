import express from 'express';
import { getVisitorStats, getDeviceUsage, getUserRoles } from '../controllers/stats.controller.js';

const router = express.Router();

router.get('/visitors/stats', getVisitorStats);
router.get('/devices/stats', getDeviceUsage);
router.get('/users/stats', getUserRoles);

export default router;
