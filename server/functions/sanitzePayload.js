const bourne = require('@hapi/bourne');
const xssSanitizer = require('perfect-express-sanitizer');
const errLogger = require('./errLogger');

module.exports = async function sanitize(payload) {
   return new Promise(async (resolve, reject) => {
        try {
            let cleanedPayload = {};

        let nPayload;

        if (typeof payload !== 'object') {
            nPayload = bourne.safeParse(payload);
        } else {
            nPayload = payload;
        };
        
        for (let key in nPayload) {
            let name = key;
            let value = nPayload[key];

            let cleanedName = await xssSanitizer.sanitize.prepareSanitize(name, { xss: true, noSql: true, sql: true, level: 5 });
            let cleanedValue = await xssSanitizer.sanitize.prepareSanitize(value, { xss: true, noSql: true, sql: true, level: 5 });

            if (cleanedName !== null && cleanedValue !== null) {

                if (cleanedName === null) {
                    errCode = 'Invalid payload detected';
                    resolve(h.redirect('/login'));
                };

                if (cleanedValue === null) {
                    errCode = 'Invalid payload detected';
                    resolve(h.redirect('/login'));
                };

                cleanedPayload[cleanedName] = cleanedValue;
            } else {
                resolve('invalid payload.');
            };
        };

        resolve(cleanedPayload);
        } catch (err) {

            console.log(payload);

            if (!err.message.toString().includes('JSON at position 0')) {
                await errLogger(err);

                console.log('DEBUG:' + err);
            };

            resolve('Invalid Payload');
        };
   });
};