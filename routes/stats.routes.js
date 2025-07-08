import express from 'express';
import { getVisitorStats, getDeviceUsage, getUserRoles } from '../controllers/stats.controller.js';

const statsRouter = express.Router();

statsRouter.get('/visitors/', getVisitorStats);
statsRouter.get('/devices/', getDeviceUsage);
statsRouter.get('/users/', getUserRoles);

export default statsRouter;
