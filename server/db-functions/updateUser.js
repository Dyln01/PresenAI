const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { exist } = require('joi');
const { resolve } = require('path');

const prisma = new PrismaClient();

module.exports = async function updateUser (info, type) {
    return new Promise(async (resolve, reject) => {
        try {
            
            let oldPassword = info.oldPassword;
            let newPassword = info.newPassword;
            let exists;
        
            if (oldPassword !== newPassword && newPassword !== oldPassword) {
                if (type === 1) {
                    exists = await prisma.user.findUnique({
                        where: {
                            email: info.email,
                        },
                    });
                } else if (type === 2) {
                    exists = await prisma.user.findUnique({
                        where: {
                            id: info.id,
                        },
                    });
                };

                if (exists !== null && exists !== undefined) {
            
                    await bcrypt.compare(oldPassword, exists.password).then(async (res) => {
                        if (res) {
                            let hashedPassword = await bcrypt.hash(newPassword, 10);
        
                            let updatedUser = await prisma.user.update({
                                where: {
                                    id: parseInt(exists.id),
                                },
                                data: {
                                    id: exists.id,
                                    email: exists.email,
                                    password: hashedPassword,
                                },
                            });
        
                            if (updatedUser) {
                                resolve(updatedUser);
                            } else {
                                resolve('Failed to create user.');
                            };
        
                        } else {
                            resolve('Invalid email or password.');
                        };
                    });
                } else {
                    resolve('Please Create User');
                };
            } else {
                resolve("Password are the same");
            };
        } catch (err) {
            console.log(err);
        };
    });
};