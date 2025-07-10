import prisma from '../lib/prisma_client.js';

export const dataUpload = async (req, res, next) => {
  try {
    const {
      groupId,
      deviceKey,
      idcardNumber,
      recordId,
      imgBase64,
      time,
      type,
      extra
    } = req.body;

    const device = await prisma.device.findUnique({
      where: { deviceKey }
    });

    if (!device) {
      return res.status(400).json({
        result: 0,
        success: false,
        msg: "Invalid deviceKey"
      });
    }

    const visitor = await prisma.visitor.findUnique({
      where: { idcardNum: idcardNumber }
    });


    await prisma.attendance.create({
      data: {
        visitorId: visitor ? visitor.id : null,
        deviceId: device.id,
        groupId,
        recordId,
        imgBase64,
        time: new Date(parseInt(time)),
        type,
        extra: extra
      }
    });

    res.json({
      result: 1,
      success: true,
      msg: "Diterima dengan sukses"
    });

  } catch (error) {
    console.error("Upload attendance error:", error);
    res.status(500).json({
      result: 0,
      success: false,
      msg: "Failed to save attendance"
    });
  }
};

export const getAllAttendances = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const whereCondition = search
      ? {
        OR: [
          {
            visitor: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            device: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      }
      : {};

    const total = await prisma.attendance.count({
      where: whereCondition,
    });

    const attendances = await prisma.attendance.findMany({
      where: whereCondition,
      include: {
        visitor: true,
        device: true,
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: attendances,
      page: parseInt(page),
      limit: take,
      total,
    });
  } catch (error) {
    console.error('getAllAttendances error:', error);
    next(error);
  }
};

export const deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: id },
    });

    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Absensi tidak ditemukan.',
      });
    }

    await prisma.attendance.delete({
      where: { id: id },
    });

    res.json({
      success: true,
      message: 'Absensi berhasil dihapus.',
    });
  } catch (error) {
    console.error('deleteAttendance error:', error);
    next(error);
  }
};