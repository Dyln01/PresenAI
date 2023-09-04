const nodemailer = require('nodemailer');
const errLogger = require('./errLogger');

require('dotenv').config({
    path: './.env',
});

const transport = nodemailer.createTransport({
    host: 'you smtp server',
    port: 'you smtp server port',
    auth: {
        user: process.env.MG_USER_INFO,
        pass: process.env.MG_PASS_INFO,
    },
    debug: true,
});

module.exports = async function verifyEmail(email, url) {
    return new Promise(async (resolve, reject) => {
        try {
            await transport.sendMail({
                from: '"PresenAI DONTREPLY" <noreply@presenai.com>',
                to: email,
                subject: 'Verify Email From PresenAI ',
                html: `Copy and Paste or click this link to verify your email: <a href=http://${url}>${url}</href>`,
            }).then((res) => {
                
                resolve(true);
            }).catch(async (err) => {
                await errLogger(err);
    
                resolve('Error while trying to send verification email.');
            });
        } catch (err) {
            console.log(err);
            await errLogger(err);

            resolve('Error while trying to send verification email.');
        };
    });
};