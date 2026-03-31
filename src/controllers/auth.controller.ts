import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
}

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body as { username?: string; password?: string };

        if (!username || !password) {
            res.status(400).json({ success: false, message: 'Username and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ success: true, token, role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

