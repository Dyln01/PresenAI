const fs = require('fs');
const path = require('path');
const errLogger = require('../../server/functions/errLogger');

let styles = JSON.parse(fs.readFileSync(path.join(__dirname, '../json/styles.json'), { encoding: 'utf8' }));
let topic_styles = JSON.parse(fs.readFileSync(path.join(__dirname, '../json/topic_styles.json'), { encoding: 'utf8' }));
let stylesNames = [];

styles.forEach((r) => {
    stylesNames.push(r.name);
});

module.exports = async function themeInfo(themeName) {
    try {
        return new Promise(async (resolve, reject) => {
            if (themeName === 'random') {
             let randomThemeName = stylesNames[Math.floor(Math.random() * stylesNames.length)];
             let themeStyles;
     
             await styles.some((styles) => {
                 if (styles.name.toString() === randomThemeName.toString()) {
                     themeStyles = styles;
     
                     return true;
                 };
             });
     
             resolve(themeStyles);
            } else {
             let themeStyles;

             console.log(topic_styles[themeName]);

             if (typeof topic_styles[themeName] === 'object') {
                themeStyles = topic_styles[themeName];

                resolve(themeStyles);
            } else {
                await styles.every((styles) => {

                    if (styles.name.toString() === themeName.toString()) {
                         themeStyles = styles;
         
                         return true;
                     };
                 });
         
                 resolve(themeStyles);
            };
            };
         });
    } catch (err) {
        await errLogger(err);

        resolve('Error while getting theme.');
    };
};