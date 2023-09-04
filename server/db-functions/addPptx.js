const bcrypt = require('bcrypt');
const errLogger = require('../functions/errLogger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async function addPptx(info) {
    return new Promise(async (resolve, reject) => {
        try {
            if (info.id) {
                let user = await prisma.user.findUnique({
                    where: {
                        id: parseInt(info.id),
                    },
                });

                if (user) {
                    if (info.amount) {
                        let updatedUser = await prisma.user.update({
                            where: {
                                id: parseInt(user.id),
                            },
                            data: {
                                pptxLeft: Math.floor(parseInt(user.pptxLeft) + parseInt(info.amount)),
                            },
                        });
    
                        if (updatedUser) {
                            resolve(updatedUser);
                        } else {
                            resolve('Error while adding presentations.');
                        };
                    } else {
                        resolve('No amount given');
                    };
                } else {
                    resolve('Error while adding presentations.');
                };
            } else {
                resolve('Error while adding presentations.');
            };
        } catch (err) {
            await errLogger(err);

            resolve('Error while adding presentations.');
        };
    });
};