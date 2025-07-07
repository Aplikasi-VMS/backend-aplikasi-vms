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

    await prisma.attendance.create({
      data: {
        groupId,
        deviceKey,
        idcardNumber,
        recordId,
        imgBase64,
        time,
        type,
        extra
      },
    });

    res.json({
      result: 1,
      success: true,
      msg: "Diterima dengan sukses"
    });

  } catch (error) {
    console.error("Data upload error:", error);
    res.status(500).json({
      result: 0,
      success: false,
      msg: "Upload failed"
    });
  }
};
