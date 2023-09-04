const colors = require('colornames');

module.exports = async function addTitle(title, slide, type, font, color) {
  
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

    console.log('Title: ', title);

    if (type === 0) {
        slide.addText(title.toString(), { 
            fontFace: font.toString(),
            bold: true,
            x: '10%', 
            y: '50%', 
            color: cColor, 
            fontSize: 48, 
            align: 'center',
            valign: 'middle', 
        });
    } else {
        slide.addText(title.toString(), { 
            fontFace: font.toString(),
            bold: true,
            x: .6, 
            y: .8,
            margin: 0.5,
            color: cColor, 
            fontSize: 38
        });
    };
};