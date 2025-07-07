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
                extra: extra ? JSON.parse(extra) : undefined
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
