const joi = require('joi');
const request = require('request');
const bcrypt = require('bcrypt');
const extraValidator = require('deep-email-validator');
const { PrismaClient } = require('@prisma/client');
const pay = require('../controllers/payment-controller');
const errLogger = require('../functions/errLogger');

let not_allowed = "(guerrillamail|mailinator|sharklasers|getairmail|maildrop|discard.email|temp-mail|fakeinbox|mintemail|tempmail|trbvm|thisisnotmyrealemail|yopmail|inboxbear)"

const prisma = new PrismaClient();
const disposableEmailPattern = new RegExp(`/^([a-z0-9_\.-]+)@(${not_allowed})\\.$/i`);

let schema = joi.object({
    email: joi.string().email({
        minDomainSegments: 2,
    }).custom((value, helpers) => {
        if (disposableEmailPattern.test(value)) {
            return helpers.error('any.invalid');
        } else {
            return value;
        };
    }),
    password: joi.string().pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@$%^&*])[a-zA-Z\d!@$%^&*]{8,}$/)),
    repeat_password: joi.ref('password'),
}).with('email', 'password').with('password', 'repeat_password');

async function validateEmail(email) {
    return extraValidator.validate(email);
}

module.exports = async function createUser (data) {
    return new Promise(async (resolve, reject) => {
        try {
            let info = data.value || data;
            let email = info.email;
            let password = info.password;
            let repeat_password = info.repeat_password;
            let item = info.item;

            if (!item) {
                resolve('Please choose a item or try a different item.');
            };

            let isValid = validateEmail(email);

            if (!isValid) {
                resolve('Invalid email. Please use a different email.');
            };
    
            if (password === repeat_password && repeat_password === password) {
                let validateRes = schema.validate({
                    email: email,
                    password: password,
                    repeat_password: repeat_password,
                }).value;
    
                if (validateRes) {
                    if (validateRes.error) {
                        
                        if (validateRes.error.message.includes('fails')) {
                            resolve('Please only use symbols like !, @ and so.');
                        };
    
                        resolve('Please use symbols like !, @ and so.');
    
                    } else {
    
                        let hashedPassword = await bcrypt.hash(password.toString(), 10);
                        let hashedItem = await bcrypt.hash(item.toString(), 10);
    
                        try {
                            const res = await prisma.user.create({
                                data: {
                                    email: email,
                                    verifyId: info.uuid,
                                    item: hashedItem,
                                    password: hashedPassword.toString(),
                                    pptxLeft: 5,
                                    ip: info.ip,
                                },
                            });
                            
                            if (res) {
                                
                                await pay.createCustomer(validateRes.email).then((data) => {

                                    if (typeof data === 'string') {
                                        resolve('Failed to create user.');
                                    };

                                    resolve(res);

                                }).catch(async (err) => {
                                    await errLogger(err);

                                    resolve('Failed to create user.');
                                });
                            } else {
                                resolve('Failed to create user.');
                            };
        
                        } catch (err) {
                            if (err.message.toString().includes('email')) {
                                resolve('User with email already exists.');
                            } else if (err.message.toString().includes('ip')) {
                                resolve('You aleeady created an account with a other email.');
                            }
    
                            resolve('Failed to create user.');
                        };
                    };
                } else {
                    resolve("Password aren't same.");
                };
            } else {
                resolve("Password aren't the same. Please try again.");
            };
        } catch (err) {
            await errLogger(err);

            resolve('Failed to create user');
        };
    });
};