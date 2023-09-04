const { PrismaClient } = require('@prisma/client');
const e = require('cors');

const prisma = new PrismaClient();

module.exports = async function removePptxLeft(id) {
    return new Promise(async (resolve, reject) => {
        try {
            if (id) {
                let user = await prisma.user.findUnique({
                    where: {
                        id: id,
                    },
                });

                if (user) {
                    let left = parseInt(user.pptxLeft) - 1;

                    if (left <= 0) {
                        resolve('No pptx left.');
                    };

                    let updatedUser = await prisma.user.update({
                        where: {
                            id: id,
                        },
                        data: {
                            pptxLeft: left,
                        },
                    });

                    if (updatedUser) {
                        resolve(updatedUser);
                    } else {
                        resolve("Couldn't update user.");
                    };
                } else {
                    resolve('No user found with credentials.');
                };
            } else {
                resolve('No credentials found.');
            };
        } catch (err) {
            console.log(err);
        };
    });
};