const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { exist } = require('joi');
const { resolve } = require('path');

const prisma = new PrismaClient();

module.exports = async function updateAccountStatus (info, type) {
    return new Promise(async (resolve, reject) => {
        try {
            
            let password = info.password;
            let exists;

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

                if (password === exists.password && exists.item === info.item) {
                    let updatedUser = await prisma.user.update({
                        where: {
                            id: parseInt(exists.id),
                        },
                        data: {
                            accountStatus: true,
                        },
                    });

                    if (updatedUser) {
                        resolve(updatedUser);
                    } else {
                        resolve('Failed to create user.');
                    };
                } else {
                    resolve('Invalid user.');
                };
            } else {
                resolve('Please Create User');
            };
        } catch (err) {
            console.log(err);
        };
    });
};