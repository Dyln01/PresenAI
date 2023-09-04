const fs = require('fs');
const colors = require('colornames');
const { addTitle, addDesc, addImage, themeHandler } = require('./functions/index.js');
const path = require('path');

module.exports = async function createSlide(slide, slideNum, title, desc, image, theme, isContent, info, wantsEndSlide, endTitle, maxSlides) {

    if (theme !== undefined || theme !== null) {
        await themeHandler(theme, slide, slideNum, title, desc, image, isContent, info, wantsEndSlide, endTitle, maxSlides).then((res) => {
            console.log(res);
        })
    } else {
        if (title !== undefined && title !== null && desc !== undefined && desc !== null) {
            if (slideNum === 0) {
        
                let fonts = JSON.parse(fs.readFileSync(path.join(__dirname, './json/fonts.json'), { encoding: 'utf8' })).fonts;
                let num = Math.floor(Math.random() * fonts.length);
            
                let font = fonts[num];
            
                addTitle(title.toString(), slide, 0, font);
            
                slideNum += 1;
          
              } else {
            
                let fonts = JSON.parse(fs.readFileSync(path.join(__dirname, './json/fonts.json'), { encoding: 'utf8' })).fonts;
                let num = Math.floor(Math.random() * fonts.length);
            
                let font = fonts[num];
            
                addTitle(title.toString(), slide, 1, font, 'red');
            
                addDesc(desc, slide, 0, font);
        
                if (image !== undefined && image !== null) {
                    addImage(image.toString(), slide, {
                        rounding: false,
                        size: 2,
                        rotation: 0,
                        shadow: {
                            type: "inner",
                            opacity: 0.5,
                            blur: 20,
                            color: "000000",
                            offset: 20,
                            angle: 320
                        }
                    }, info.isData);
                };
            
                // slide.addImage({ path: imagePath, x: 6.2, y: 1.5, sizing: { type: 'contain', w: 4, h: 4 }, shadow: {
                //   type: 'outer',
                //   opacity: .25,
                //   blur: 20,
                //   color: '000000',
                //   offset: 20,
                //   angle: 320,
                // } });
            };
        } else {
            new Error("No Title Or Description");
        };
    };
};