import express from 'express';
import { dataUpload, getAllAttendances } from '../controllers/attendance.controller.js';

const attendanceRouter = express.Router();

attendanceRouter.post('/dataUpload', dataUpload);
attendanceRouter.get('/report', getAllAttendances);

export default attendanceRouter;
