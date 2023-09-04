const fs = require('fs');
const bourne = require('@hapi/bourne');
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({
    path: './.env',
});

const transport = nodemailer.createTransport({
    host: process.env.MG_HOST,
    port: parseInt(process.env.MG_PORT),
    auth: {
        user: process.env.MG_USER_ERR,
        pass: process.env.MG_PASS_ERR,
    },
    secure: true,
});

transport.verify(async (err, res) => {
    if (err) {

        console.log(err);

        if (fs.existsSync(path.join(__dirname, '../err_logs.json'))) {
            let fileData = bourne.safeParse(fs.readFileSync(path.join(__dirname, '../err_logs.json'), 'utf8'));
            let errMessage = {
                message: err.message,
                error: err
            };

            if (!fileData.includes(errMessage)) {
                fileData.push(errMessage);

                fs.writeFileSync(path.join(__dirname, '../err_logs.json'), JSON.stringify(fileData), 'utf8');
            };
        } else {
            let fileData = [];
            let errMessage = {
                message: err.message,
                error: err
            };

            fileData.push(errMessage);

            fs.writeFileSync(path.join(__dirname, '../err_logs.json'), JSON.stringify(fileData), 'utf8');
        };
    } else {
        console.log(res);
    }
});

module.exports = async function errLogger(error, type) {
    try {
        console.log(type);
        if (typeof type === 'undefined') {
            if (error.message) {
                await transport.sendMail({
                    from: '"PresenAI ERROR LOGGER" <error@presenai.com>',
                    to: process.env.LOG_MAIL,
                    subject: `New Error: ${error.message.toString()}`,
                    text: JSON.stringify(error),
                });

                return true;
            } else {
                await transport.sendMail({
                    from: '"PresenAI ERROR LOGGER" <error@presenai.com>',
                    to: process.env.LOG_MAIL,
                    subject: `New Error: IDK`,
                    text: JSON.stringify(error),
                });

                return true;
            }
        } else if (type === 'email') {
            await transport.sendMail({
                from: '"PresenAI EMAIL ERROR LOGGER" <error@presenai.com>',
                to: process.env.LOG_MAIL,
                subject: `New Error: ${error.details[0].message.toString()}`,
                text: JSON.stringify(error),
            });

            return true;
        } else if (type === 'report') {
            if (error.name && error.email && error[''] && error.message) {
                let w = await transport.sendMail({
                    from: `"PresenAI REPORT from ${error.name.toString()}" <error@presenai.com>`,
                    to: process.env.LOG_MAIL,
                    subject: `New Report The Type Is ${error[''].toString()}. It is from ${error.email.toString()}`,
                    text: error.message.toString(),
                    attachments: [
                        {
                            filename: 'full_report.json',
                            content: JSON.stringify(error),
                        },
                    ],
                    cc: process.env.MG_USER_ERR,
                });

                console.log(w);

                return true;
            } else {
                return 'Invalid Message. Please try again later.';
            };
        } else if (type === 'no_message') {
            await transport.sendMail({
                from: '"PresenAI ERROR LOGGER" <error@presenai.com>',
                to: process.env.LOG_MAIL,
                subject: `New Error: ${error.toString()}`,
                text: JSON.stringify(error),
            });

            return true;
        };
    } catch (err) {
        if (fs.existsSync(path.join(__dirname, '../err_logs.json'))) {
            let fileData = bourne.safeParse(fs.readFileSync(path.join(__dirname, '../err_logs.json'), 'utf8'));
            let errMessage = {
                message: err.message,
                error: err
            };

            if (!fileData.includes(errMessage)) {
                fileData.push(errMessage);

                fs.writeFileSync(path.join(__dirname, '../err_logs.json'), JSON.stringify(fileData), 'utf8');
            };
        } else {
            let fileData = [];
            let errMessage = {
                message: err.message,
                error: err
            };

            fileData.push(errMessage);

            fs.writeFileSync(path.join(__dirname, '../err_logs.json'), JSON.stringify(fileData), 'utf8');
        };
    };
};