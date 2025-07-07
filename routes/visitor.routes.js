import express from 'express';
import { authorizeRole, authorize } from '../middlewares/auth.middleware.js';
import {
    getAllVisitors, addVisitor, updateVisitor,
    deleteVisitor, getVisitorById, getPersonList,
    getPersonInfo
} from '../controllers/visitor.controller.js';

const visitorRouter = express.Router();

visitorRouter.post('/getPersonList', getPersonList);
visitorRouter.post('/getPersonInfo', getPersonInfo);

visitorRouter.use(authorize);

visitorRouter.get('/', authorizeRole('SUPERUSER', 'RECEPTIONIST'), getAllVisitors);
visitorRouter.get('/:id', authorizeRole('SUPERUSER', 'RECEPTIONIST'), getVisitorById);
visitorRouter.post('/', authorizeRole('SUPERUSER', 'RECEPTIONIST'), addVisitor);
visitorRouter.put('/:id', authorizeRole('SUPERUSER', 'RECEPTIONIST'), updateVisitor);
visitorRouter.delete('/:id', authorizeRole('SUPERUSER', 'RECEPTIONIST'), deleteVisitor);


export default visitorRouter;
