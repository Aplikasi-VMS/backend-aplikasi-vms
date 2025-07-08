import prisma from '../lib/prisma_client.js';
import crypto from 'crypto';

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

export const getAllVisitors = async (req, res, next) => {
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

    const total = await prisma.visitor.count({
      where: whereCondition,
    });

    const visitors = await prisma.visitor.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        idcardNum: true,
        imgBase64: true,
        type: true,
        passtime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const filteredVisitors = search
      ? visitors.filter(visitor =>
        visitor.name.toLowerCase().includes(search.toLowerCase()))
      : visitors;

    res.json({
      success: true,
      data: filteredVisitors,
      page: parseInt(page),
      limit: take,
      total
    });
  } catch (error) {
    next(error);
  }
};


export const addVisitor = async (req, res, next) => {
  try {
    const { name, idcardNum, imgBase64, type, passtime } = req.body;

    const newVisitor = await prisma.visitor.create({
      data: { name, idcardNum, imgBase64, type, passtime }
    });

    res.status(201).json({ success: true, data: newVisitor });
  } catch (error) {
    next(error);
  }
};

export const updateVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, idcardNum, imgBase64, type, passtime, md5 } = req.body;

    const updatedVisitor = await prisma.visitor.update({
      where: { id: parseInt(id) },
      data: { name, idcardNum, imgBase64, type, passtime, md5 }
    });

    res.json({ success: true, data: updatedVisitor });
  } catch (error) {
    next(error);
  }
};

export const deleteVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.visitor.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Visitor deleted' });
  } catch (error) {
    next(error);
  }
};

export const getVisitorById = async (req, res, next) => {
  const { id } = req.params;
  try {

    const visitor = await prisma.visitor.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    return res.json({
      success: 'true',
      data: visitor
    })
  } catch (error) {
    next(error);
  }
}

export const getPersonList = async (req, res, next) => {
  try {
    const { groupId, deviceKey, page, pageSize } = req.body;

    if (!groupId || !deviceKey || !page || !pageSize) {
      return res.status(400).json({
        msg: "Missing required parameters (groupId, deviceKey, page, pageSize)",
        result: 0,
        success: false,
      });
    }

    const device = await prisma.device.findUnique({
      where: { deviceKey }
    });

    if (!device) {
      return res.status(400).json({
        msg: "Invalid deviceKey",
        result: 0,
        success: false,
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const visitors = await prisma.visitor.findMany({
      skip,
      take: parseInt(pageSize),
      orderBy: { id: 'asc' },
    });

    if (visitors.length === 0) {
      return res.json({
        msg: "sukses",
        result: 1,
        success: true,
        total: 0,
        data: [],
      });
    }

    const formatted = visitors.map(v => {
      const nameMd5 = md5(v.name || "");
      const imgMd5 = md5(v.imgBase64 || "");
      const typeMd5 = md5(v.type.toString());
      const passtimeMd5 = md5(v.passtime || "");

      const finalMd5 = md5(nameMd5 + imgMd5 + typeMd5 + passtimeMd5);

      return {
        idcardNum: v.idcardNum,
        name: v.name || "",
        imgBase64: v.imgBase64 || "",
        type: v.type,
        passtime: v.passtime || "",
        md5: finalMd5,
      };
    });

    res.json({
      msg: "sukses",
      result: 1,
      success: true,
      total: formatted.length,
      data: formatted,
    });

  } catch (error) {
    console.error("getPersonList error:", error);
    next(error);
  }
};

export const getPersonInfo = async (req, res, next) => {
  try {
    const { groupId, deviceKey, idcardNum } = req.body;

    if (!groupId || !deviceKey || !idcardNum) {
      return res.status(400).json({
        msg: "Missing required parameters (groupId, deviceKey, idcardNum)",
        result: 0,
        success: false,
      });
    }

    const device = await prisma.device.findUnique({
      where: { deviceKey }
    });

    if (!device) {
      return res.status(400).json({
        msg: "Invalid deviceKey",
        result: 0,
        success: false,
      });
    }

    const visitor = await prisma.visitor.findUnique({
      where: { idcardNum },
    });

    if (!visitor) {
      return res.status(404).json({
        msg: "Visitor not found",
        result: 0,
        success: false,
      });
    }

    const nameMd5 = md5(visitor.name || "");
    const imgMd5 = md5(visitor.imgBase64 || "");
    const typeMd5 = md5(visitor.type.toString());
    const passtimeMd5 = md5(visitor.passtime || "");

    const finalMd5 = md5(nameMd5 + imgMd5 + typeMd5 + passtimeMd5);

    res.json({
      msg: "sukses",
      result: 1,
      success: true,
      data: {
        idcardNum: visitor.idcardNum,
        name: visitor.name || "",
        imgBase64: visitor.imgBase64 || "",
        type: visitor.type,
        passtime: visitor.passtime || "",
        md5: finalMd5,
      },
    });

  } catch (error) {
    console.error("getPersonInfo error:", error);
    next(error);
  }
};
