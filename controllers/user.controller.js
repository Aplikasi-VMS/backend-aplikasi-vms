import prisma from '../lib/prisma_client.js';
import bcrypt from 'bcrypt';

export const getAllUsers = async (req, res, next) => {
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

    const total = await prisma.user.count({
      where: whereCondition,
    });

    const users = await prisma.user.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const filteredUsers = search
      ? users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()))
      : users;

    res.json({
      success: true,
      data: filteredUsers,
      page: parseInt(page),
      limit: take,
      total
    });
  } catch (error) {
    next(error);
  }
};


export const addUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        role,
        ...(hashedPassword && { password: hashedPassword })
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ success: true, data: user })
  } catch (error) {
    next(error);
  }
}
