const colors = require('colornames');

module.exports = async function addDesc(desc, slide, slideNum, font, color, isContent) {

    let cColor;

    if (color.toString().includes('#')) {
        cColor = color.toString().replace('#', '');
    } else {
        if (color !== undefined) {
            cColor = colors(color.toString()).replace('#', '');
        } else {
            cColor = colors('black').replace('#', '');
        };
    };

    console.log(cColor);

    if (isContent) {
        if (slideNum === 1) {
            let jsonText = [];

            for (let d of desc.split('\n')) {
                jsonText.push({
                    text: d.toString(), options: {
                        fontSize: 18, 
                        bullet: true, 
                        fontFace: font.toString(), 
                        breakLine: true,
                        align: 'left',
                    },
                });
            };


            slide.addText(jsonText, { 
                x: 1.1, 
                y: '50%',
                color: cColor || '#000000', 
            });
        } else {
            slide.addText(desc.toString(), { 
                fontFace: font.toString(), 
                x: .6, 
                y: '50%',
                margin: 1, 
                color: cColor || '#000000', 
                fontSize: 14,
                bullet: false,
             });
        };
    } else {
        slide.addText(desc.toString(), { 
            fontFace: font.toString(), 
            x: 1.1, 
            y: '50%',
            margin: 1,  
            color: cColor || '#000000', 
            fontSize: 14,
            bullet: false,
         });
    };
};