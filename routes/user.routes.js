import express from 'express';
import { authorize, authorizeRole } from '../middlewares/auth.middleware.js';
import { getAllUsers, addUser, updateUser, deleteUser, getUserById } from '../controllers/user.controller.js';

const userRouter = express.Router();

userRouter.use(authorize);

userRouter.get('/', authorizeRole('SUPERUSER', ), getAllUsers);
userRouter.get('/:id', authorizeRole('SUPERUSER', ), getUserById);
userRouter.post('/', authorizeRole('SUPERUSER'), addUser);
userRouter.put('/:id', authorizeRole('SUPERUSER'), updateUser);
userRouter.delete('/:id', authorizeRole('SUPERUSER'), deleteUser);

export default userRouter;
