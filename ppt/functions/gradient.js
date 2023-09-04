const fs = require('fs');
const path = require('path');
const colorNames = require('colornames');
const { createCanvas } = require('canvas');

// Object.defineProperty(Array.prototype, 'splitter', {
//     value: function(chunkSize) {
//         var array = this;
//         return [].concat.apply([],
//             array.map(function(elem, i) {
//                 return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
//             })
//         );
//     }
// });

// function randomSort(a, b) {
//     return Math.random() - 0.5
// }

module.exports = async function gradient(color1, color2) {
    let fileName = `${color1.toString()}-${color2.toString()}.png`;

    if (fs.readdirSync(path.join(__dirname, '../gradients')).includes(fileName.toLocaleLowerCase().toString())) {
        console.log('Gradient file already exists');

        return path.join('./gradients/', fileName.toLocaleLowerCase().toString());
    };

    let digit1 = colorNames(color1);
    let digit2 = colorNames(color2);

    let canvas = createCanvas(1280, 720);
    let context = canvas.getContext('2d');

    let gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, digit1);
    gradient.addColorStop(1, digit2);

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    let outStream = fs.createWriteStream(path.join(path.join(__dirname, '../gradients') + fileName.toLocaleLowerCase().toString()));
    let canvasStream = canvas.createPNGStream();

    canvasStream.pipe(outStream);

    // outStream.on('finish', () => {
    //     console.log(`Made gradient background named ${fileName.toLocaleLowerCase().toString()} in gradients folder`);

    //     return path.join('./gradients/', fileName.toLocaleLowerCase().toString());
    // });
};