import { PORT } from "./config/env.js";
import express from "express";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import deviceRouter from "./routes/device.routes.js";
import cors from "cors";
import visitorRouter from "./routes/visitor.routes.js";
import prisma from "./lib/prisma_client.js";
import attendanceRouter from "./routes/attendance.routes.js";
import statsRouter from "./routes/stats.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import morgan from 'morgan';
import logger from "./lib/logger.js";

const app = express();

app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const ms = (duration[0] * 1e3 + duration[1] * 1e-6).toFixed(3);
    res.set('X-Response-Time', ms);
  });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

morgan.token('status-colored', (req, res) => {
  const status = res.statusCode;
  let color = 32;
  if (status >= 500) color = 31;
  else if (status >= 400) color = 33;
  return `\x1b[${color}m${status}\x1b[0m`;
});

app.use(morgan(
  ':method :url :status-colored :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => {
        const status = parseInt(message.split(' ')[2]);
        if (status >= 400) {
          logger.error('HTTP Request Error', { message: message.trim() });
        } else {
          logger.info('HTTP Request', { message: message.trim() });
        }
      }
    },
    skip: (req) => req.path === '/health'
  }
));
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/devices', deviceRouter);
app.use('/api/visitors', visitorRouter);
app.use('/api/attendances', attendanceRouter);
app.use('/api/stats', statsRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use(errorMiddleware);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  logger.info('Server is shutting down...');
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Server received SIGTERM, shutting down...');
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
  process.exit(0);
});