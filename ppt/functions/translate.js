const t = require('free-translation');

module.exports = async function translate(text, from, to) {
    if (from === 'en' && to === 'en') {
        return text;
    } else {
        let translation = await t.translate({ from: from, to: to, textArray: [text] });

        return translation[0];
    };
};