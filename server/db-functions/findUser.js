const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const errLogger = require('../functions/errLogger');

const prisma = new PrismaClient();

module.exports = async function findUser (data, type, param) {

    let info;

    try {
        info = data.value || data;

        if (type === 1) {
            if (info.email === undefined) {
                return 'Invalid credentials.';
            }; 

            if (info.item_input === undefined) {
                return 'Invalid credentials.'; 
            };

            
        } else if (type === 2) {
            if (info.id === undefined) {
                return 'Invalid credentials.';
            };
        };

    } catch (err) {
        await errLogger(err);
    };

    return new Promise(async (resolve, reject) => {
        try {
            let password = info.password;
    
            let exists;

            if (Object.keys(info).length <= 0) {
                resolve('Invalid credentials.');
            };

            if (type === 1) {
                if (info.email === undefined) {
                    resolve('No email or password available.');
                };

                exists = await prisma.user.findUnique({
                    where: {
                        email: info.email,
                    },
                });
            } else if (type === 2) {
                if (info.id === undefined) {
                    resolve('No email or password available.');
                };

                exists = await prisma.user.findUnique({
                    where: {
                        id: parseInt(info.id),
                    },
                });
            };
            
            if (exists !== null && exists !== undefined && info.password !== undefined) {

                if (password === exists.password) {
                    resolve(exists);
                };

                if (param) {
                    if (param.param.toString() === exists.verifyId) {
                        await bcrypt.compare(password, exists.password).then(async (r) => {
                            if (r) {
                                await bcrypt.compare(info.item_input, exists.item).then((res) => {
                                    if (res) {
                                        resolve(exists);
                                    } else {
                                        resolve('Invalid credentials.');
                                    };
                                });
                            } else {
                                resolve('Invalid credentials.');
                            };
                        });   
                    } else {
                        resolve('Invalid credentials for verify link.');
                    };
                } else {
                    await bcrypt.compare(password, exists.password).then(async (r) => {
                        if (r) {
                            await bcrypt.compare(info.item_input, exists.item).then((res) => {
                                if (res) {
                                    resolve(exists);
                                } else {
                                    resolve('Invalid credentials.');
                                };
                            });
                        } else {
                            resolve('Invalid credentials.');
                        };
                    });
                };

                // if (info.item_input !== exists.item_input) {
                //     resolve('Invalid credentials.')
                // };
            } else {
                resolve('Please create user.');
            };
        } catch (err) {
            await errLogger(err);

            resolve('Error while trying to log you in');
        };
    });
};