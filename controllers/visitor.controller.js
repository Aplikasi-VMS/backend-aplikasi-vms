import prisma from '../lib/prisma_client.js';

export const getAllVisitors = async (req, res, next) => {
  try {
    const visitors = await prisma.visitor.findMany();
    res.json({ success: true, data: visitors });
  } catch (error) {
    next(error);
  }
};

export const addVisitor = async (req, res, next) => {
  try {
    const { name, idcardNum, imgBase64, type, passtime, md5 } = req.body;

    const newVisitor = await prisma.visitor.create({
      data: { name, idcardNum, imgBase64, type, passtime, md5 }
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
      data : visitor
    })
  } catch (error) {
    next(error);
  }
}