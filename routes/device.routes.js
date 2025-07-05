import express from 'express';
import { authorize, authorizeRole } from '../middlewares/auth.middleware.js';
import { getAllDevices, addDevice, updateDevice, deleteDevice, getDeviceById } from '../controllers/device.controller.js';

const deviceRouter = express.Router();

deviceRouter.use(authorize);

deviceRouter.get('/', authorizeRole('SUPERUSER', 'ADMIN'), getAllDevices);
deviceRouter.get('/:id', authorizeRole('SUPERUSER', 'ADMIN'), getDeviceById);
deviceRouter.post('/', authorizeRole('SUPERUSER', 'ADMIN'), addDevice);
deviceRouter.put('/:id', authorizeRole('SUPERUSER', 'ADMIN'), updateDevice);
deviceRouter.delete('/:id', authorizeRole('SUPERUSER', 'ADMIN'), deleteDevice);

export default deviceRouter;
