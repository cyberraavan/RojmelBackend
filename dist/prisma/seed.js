"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'securepassword123';
    console.log(`Checking if admin user '${adminUsername}' exists...`);
    let admin = await prisma.user.findUnique({
        where: { username: adminUsername }
    });
    if (!admin) {
        console.log('Admin user not found. Creating via secure seed...');
        const hashedPassword = await bcrypt_1.default.hash(adminPassword, 10);
        admin = await prisma.user.create({
            data: {
                username: adminUsername,
                password: hashedPassword,
                role: 'admin'
            }
        });
        console.log(`Admin user '${adminUsername}' created successfully.`);
    }
    else {
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
