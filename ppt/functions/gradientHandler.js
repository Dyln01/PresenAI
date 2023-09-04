const path = require('path');
const index = require('./index.js');

module.exports = async function gradientHandler(slide, themeI, files) {
    if (themeI.theme.toString() === 'random') {
        slide.addImage({
            path: path.join(path.join(__dirname, '../gradients/'), files[Math.floor(Math.random() * files.length)]),
            h: '100%',
            w: '100%',
        });
    } else {
        if (!files.includes((themeI.theme.toString() + '.png').toString())) {
            let splittedGradientName = themeI.theme.split('-');
            index.gradient(splittedGradientName[0], splittedGradientName[1]);
        };

        slide.addImage({
            path: path.join(path.join(__dirname, '../gradients/'), (themeI.theme.toString() + '.png').toString()),
            h: '100%',
            w: '100%',
        });
    };
};