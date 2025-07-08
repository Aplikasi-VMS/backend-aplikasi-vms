import prisma from '../lib/prisma_client.js';

export const getAllDevices = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const whereCondition = search
      ? {
        name: {
          contains: search,
        }
      }
      : {};
    const total = await prisma.device.count({
      where: whereCondition
    });

    const devices = await prisma.device.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const filteredDevices = search
      ? devices.filter(device =>
        device.name.toLowerCase().includes(search.toLowerCase()))
      : devices;

    res.json({
      success: true,
      data: filteredDevices,
      page: parseInt(page),
      limit: take,
      total
    });
  } catch (error) {
    next(error);
  }
};

export const addDevice = async (req, res, next) => {
  try {
    const { name, deviceKey, groupId, location } = req.body;

    const newDevice = await prisma.device.create({
      data: { name, deviceKey, groupId, location }
    });

    res.status(201).json({ success: true, data: newDevice });
  } catch (error) {
    next(error);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, deviceKey, groupId, location } = req.body;

    const updatedDevice = await prisma.device.update({
      where: { id: parseInt(id) },
      data: { name, deviceKey, groupId, location }
    });

    res.json({ success: true, data: updatedDevice });
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.device.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Device deleted' });
  } catch (error) {
    next(error);
  }
};

export const getDeviceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const device = await prisma.device.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ success: true, data: device })
  } catch (error) {
    next(error);
  }
}

