import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'securepassword123';

    console.log(`Checking if admin user '${adminUsername}' exists...`);

    let admin = await prisma.user.findUnique({
        where: { username: adminUsername }
    });

    if (!admin) {
        console.log('Admin user not found. Creating via secure seed...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        admin = await prisma.user.create({
            data: {
                username: adminUsername,
                password: hashedPassword,
                role: 'admin'
            }
        });
        console.log(`Admin user '${adminUsername}' created successfully.`);
    } else {
        console.log('Admin user already exists. Skipping creation.');
    }
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
