import { PORT } from "./config/env.js";
import express from "express";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import deviceRouter from "./routes/device.routes.js";
import cors from "cors";
import visitorRouter from "./routes/visitor.routes.js";
import prisma from "./lib/prisma_client.js";
import attendanceRouter from "./routes/attendance.routes.js";

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/auth',authRouter)
app.use('/api/users', userRouter);
app.use('/api/devices', deviceRouter);
app.use('/api/visitors', visitorRouter);
app.use('/api/attendances', attendanceRouter);
app.use('/api/stats', )

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});


process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
