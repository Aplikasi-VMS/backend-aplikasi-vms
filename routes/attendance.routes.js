import express from 'express';
import { dataUpload, getAllAttendances, deleteAttendance } from '../controllers/attendance.controller.js';
import { authorize, authorizeRole } from '../middlewares/auth.middleware.js';

const attendanceRouter = express.Router();

attendanceRouter.post('/dataUpload', dataUpload);

attendanceRouter.use(authorize);
attendanceRouter.get('/report', authorizeRole('SUPERUSER', 'RECEPTIONIST'), getAllAttendances);
attendanceRouter.delete('/report',authorizeRole('SUPERUSER', 'RECEPTIONIST'), deleteAttendance);

export default attendanceRouter;
