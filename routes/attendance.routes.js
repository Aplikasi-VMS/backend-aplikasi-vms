import express from 'express';
import { dataUpload } from '../controllers/attendance.controller.js';

const attendanceRouter = express.Router();

attendanceRouter.post('/dataUpload', dataUpload);

export default attendanceRouter;
