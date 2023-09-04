const fs = require('fs');
const canvas = require('canvas');
const { Image } = require('canvas');
const errLogger = require('../../server/functions/errLogger');

module.exports = async function addImage(imagePath, slide, info, isData) {
   try {
    let type = parseInt(info.size);

    // let image = fs.readFileSync(imagePath);

    // let newImage = new Image();

    // newImage.src = image;

    let width = 3.5;
    let height = 3.5;

    if (isData) {

        if (info !== undefined && info !== null) {
            if (type === 0) {
    
                slide.addImage({ 
                    data: imagePath.toString(), 
                    x: 6.2, 
                    y: 1.2, 
                    sizing: { type: 'contain', w: width, h: height },
                    rotate: parseInt(info.rotation) || 0,
                    rounding: info.rounding || false,
                    // shadow: info.shadow || {
                    //     type: 'none',
                    // },
                });
    
            } else if (type === 1) {
    
                slide.addImage({ 
                    data: imagePath.toString(), 
                    x: 6.2, 
                    y: 1.5, 
                    sizing: { type: 'contain', w: width, h: height }, 
                    rotate: parseInt(info.rotation) || 0, 
                    rounding: info.rounding || false, 
                    // shadow: info.shadow || {
                    //     type: 'none',
                    // },
                });
    
            } else if (type === 2) {
    
                slide.addImage({ 
                    data: imagePath.toString(), 
                    x: 6.2, 
                    y: 1.5,
                    sizing: { type: 'contain', w: width, h: height }, 
                    rotate: parseInt(info.rotation) || 0,
                    rounding: info.rounding || false,
                    // shadow: info.shadow || {
                    //     type: 'none',
                    // },
                });
            };
        };
    } else {
        if (info !== undefined && info !== null) {
            if (type === 0) {
    
                slide.addImage({ 
                    path: imagePath.toString(), 
                    x: 6.2, 
                    y: 1.5, 
                    sizing: { type: 'contain', w: width, h: height },
                    rotate: parseInt(info.rotation) || 0,
                    rounding: info.rounding || false,
                    // shadow: info.shadow || {
                    //     type: 'none',
                    // },
                });
    
            } else if (type === 1) {
    
                slide.addImage({ 
                    path: imagePath.toString(), 
                    x: 6.2, 
                    y: 1.5, 
                    sizing: { type: 'contain', w: width, h: height }, 
                    rotate: parseInt(info.rotation) || 0, 
                    rounding: info.rounding || false, 
                    // shadow: info.shadow || {
                    //     type: 'none',
                    // },
                });
    
            } else if (type === 2) {
    
                slide.addImage({ 
                    path: imagePath.toString(), 
                    x: 6.2, 
                    y: 1.5,
                    sizing: { type: 'contain', w: width, h: height }, 
                    rotate: parseInt(info.rotation) || 0, 
                    rounding: info.rounding || false, 
                    // shadow: info.shadow || {
                    //     type: 'none',
                    // },
                });
            };
        };
    };
   } catch (err) {
    await errLogger(err);
   };
};