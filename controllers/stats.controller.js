import prisma from '../lib/prisma_client.js';
import { startOfMonth, endOfMonth } from 'date-fns';

export const getVisitorStats = async (req, res, next) => {
    try {
        const currentYear = new Date().getFullYear();
        const data = [];

        for (let month = 0; month < 12; month++) {
            const start = startOfMonth(new Date(currentYear, month));
            const end = endOfMonth(new Date(currentYear, month));

            const count = await prisma.visitor.count({
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
            });

            data.push({ month: start.toLocaleString('default', { month: 'short' }), total: count });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getDeviceUsage = async (req, res, next) => {
    try {
        const usage = await prisma.attendance.groupBy({
            by: ['deviceId'],
            _count: { id: true },
            orderBy: { deviceId: 'asc' },
        });

        const data = await Promise.all(
            usage.map(async u => {
                const device = await prisma.device.findUnique({ where: { id: u.deviceId } });
                return {
                    device: device?.name || `Device ${u.deviceId}`,
                    total: u._count.id,
                };
            })
        );

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getUserRoles = async (req, res, next) => {
    try {
        const roles = await prisma.user.groupBy({
            by: ['role'],
            _count: { id: true },
        });

        const data = roles.map(r => ({
            role: r.role,
            total: r._count.id,
        }));

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
