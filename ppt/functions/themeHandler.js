const fs = require('fs');
const colors = require('colornames');
const path = require('path');
const addTitle = require('./addTitle');
const addDesc = require('./addDesc');
const addImage = require('./addImage');
const errLogger = require('../../server/functions/errLogger');

let styles = JSON.parse(fs.readFileSync(path.join(__dirname, '../json/styles.json'), { encoding: 'utf8' }));
let fonts = JSON.parse(fs.readFileSync(path.join(__dirname, '../json/fonts.json'), { encoding: 'utf8' })).fonts;

let stylesNames = [];

styles.forEach((r) => {
    stylesNames.push(r.name);
});

class addItem {
    static async main(title, slide, slideNum, themeStyles, wantsEndSlide) {
       try {
        let font = themeStyles.font.toString();
        let color = themeStyles.color.toString();

        if (themeStyles.startColor) {
            color = themeStyles.startColor.toString();
        }

        if (font.toString() === 'random') {
            font = fonts[Math.floor(Math.random() * fonts.length)];
        };

        await addTitle(title, slide, slideNum, font, color);
       } catch (err) {
        await errLogger(err);
       };
    };

    static async description(title, desc, slide, slideNum, themeStyles, isContent, image, extra) {
       try {
        let font = themeStyles.font.toString();
        let color = themeStyles.color.toString();

        if (font.toString() === 'random') {
            font = fonts[Math.floor(Math.random() * fonts.length)];
        };

        await addTitle(title, slide, slideNum, font, color);
                
        await addDesc(desc, slide, slideNum, themeStyles.font.toString(), themeStyles.color.toString(), isContent);


        if (isContent) {
            if (slideNum !== 1) {
                if (image !== undefined && image !== null) {
                    let fileBase64 = Buffer.from(fs.readFileSync(image)).toString('base64');
                    let fileType = path.extname(image);
    
                    let finishedBase64 = `data:image/${fileType.toString()};base64,${fileBase64.toString()}`
    
                    await addImage(finishedBase64, slide, themeStyles.image, true);
                }; 
            };
        } else {
            if (image !== undefined && image !== null) {
                let fileBase64 = Buffer.from(fs.readFileSync(image)).toString('base64');
                let fileType = path.extname(image);

                let finishedBase64 = `data:image/${fileType.toString()};base64,${fileBase64.toString()}`

                await addImage(finishedBase64, slide, themeStyles.image, true);
            };   
        };
       } catch (err) {
        await errLogger(err);
       };
    };
};

module.exports = async function themeHandler(theme, slide, slideNum, title, desc, image, isContent, extra, wantsEndSlide, endTitle, maxSlides) {

    console.log(title);
    console.log(desc);
    console.log(image);

    if (title !== undefined && title !== null && desc !== undefined && desc !== null) {
        if (theme.name) {

            let themeStyles = theme;

            if (!themeStyles.wantGradient) {

                if (slideNum === 0) {
                    if (theme.wantsStartImage) {
                        slide.background = { path: path.join(__dirname, themeStyles.startPath.toString()) };
                    } else {
                        if (themeStyles.hasImage) {
                            slide.background = { path: path.join(__dirname, themeStyles.path.toString()) };
                        } else {
                            if (themeStyles.theme.toString().includes('#')) {
                                slide.background = { fill: themeStyles.theme.toString().replace('#', ''), };
                            } else {
                                slide.background = { fill: colors(themeStyles.theme.toString()).replace('#', ''), };
                            };
                        };
                    };
                } else {
                    if (themeStyles.hasImage) {
                        slide.background = { path: path.join(__dirname, themeStyles.path.toString()) };
                    } else {
                        if (themeStyles.theme.toString().includes('#')) {
                            slide.background = { fill: themeStyles.theme.toString().replace('#', ''), };
                        } else {
                            slide.background = { fill: colors(themeStyles.theme.toString()).replace('#', ''), };
                        };
                    };
                };
            };

            if (slideNum === 0) {

                await addItem.main(title, slide, slideNum, themeStyles);

            } else if (slideNum === 1) {

                await addItem.description(title, desc, slide, slideNum, themeStyles, isContent, image, extra);

            } else if (slideNum === maxSlides - 1 && wantsEndSlide) {
                await addItem.main(endTitle, slide, slideNum, themeStyles, wantsEndSlide);
            } else {

                await addItem.description(title, desc, slide, slideNum, themeStyles, isContent, image, extra);

            };

        } else if ((!theme.name && theme.theme) || (!theme.name && theme.path)) {
            let themeStyles = theme;


            if (!themeStyles.wantGradient) {

                if (slideNum === 0) {
                    if (theme.wantsStartImage) {
                        slide.background = { path: path.join(__dirname, themeStyles.startPath.toString()) };
                    } else {
                        if (themeStyles.hasImage) {
                            slide.background = { path: path.join(__dirname, themeStyles.path.toString()) };
                        } else {
                            if (themeStyles.theme.toString().includes('#')) {
                                slide.background = { fill: themeStyles.theme.toString().replace('#', ''), };
                            } else {
                                slide.background = { fill: colors(themeStyles.theme.toString()).replace('#', ''), };
                            };
                        };
                    };
                } else {
                    if (themeStyles.hasImage) {
                        slide.background = { path: path.join(__dirname, themeStyles.path.toString()) };
                    } else {
                        if (themeStyles.theme.toString().includes('#')) {
                            slide.background = { fill: themeStyles.theme.toString().replace('#', ''), };
                        } else {
                            slide.background = { fill: colors(themeStyles.theme.toString()).replace('#', ''), };
                        };
                    };
                };
            };

            if (slideNum === 0) {

                await addItem.main(title, slide, slideNum, themeStyles);

            } else if (slideNum === 1) {

                await addItem.description(title, desc, slide, slideNum, themeStyles, isContent, image, extra);

            } else if (slideNum === maxSlides - 1 && wantsEndSlide) {
                console.log('Called 177');
                await addItem.main(endTitle, slide, slideNum, themeStyles, wantsEndSlide);
            } else {

                await addItem.description(title, desc, slide, slideNum, themeStyles, isContent, image, extra);

            };
        } else {
            return new Error(`No Theme Named ${theme.toString()}`);
        };
    } else {
        return new Error("No Title Or Description");
    };
};