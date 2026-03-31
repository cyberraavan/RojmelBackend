import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

type CreateUserBody = {
  username: string;
  password: string;
  role?: string;
};

const ensureAdmin = (req: AuthRequest, res: Response): boolean => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin privileges required' });
    return false;
  }
  return true;
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { username, password, role = 'admin' } = req.body as CreateUserBody;

    if (role !== 'admin' && role !== 'viewer') {
      res.status(400).json({ success: false, message: 'Invalid role specified' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { id } = req.params as { id: string };

    // Optionally prevent deleting yourself
    if (req.user?.id === id) {
      res.status(400).json({ success: false, message: 'You cannot delete your own user account' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

