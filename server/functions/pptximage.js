const fs = require('fs');
const path = require('path');
const pdf2img = require('pdf2img');
const { exec } = require('child_process');
const errLogger = require('./errLogger');

async function pdf2png(pdfPath, savePath, pptxName) {
    return new Promise(async (resolve, reject) => {
        // pdf2img.setOptions({
        //     type: 'png',
        //     size: 1024,
        //     density: 600,
        //     outputDir: savePath,
        //     outputname: pptxName.replace('.pdf', ''),
        //     page: null,
        // });

        console.log(path.join(savePath, (pptxName.replace('.pdf', '') + '%02d' + '.png')));
    
        let cmd = `powershell -Command "& 'C:\\Program Files\\GraphicsMagick-1.3.40-Q16\\gm.exe' convert -density 150 '${pdfPath}' +adjoin '${path.join(savePath, (pptxName.replace('.pdf', '') + '%02d' + '.png'))}'"`;
    
        await exec(cmd, async (err, stdout, stderr) => {
            if (err) {
                reject(err);
            };
    
            resolve(stdout);
        });
    });
};

module.exports =  async function pptx2images(pptxPath, savePath) {
    return new Promise(async (resolve, reject) => {

        savePath = path.join(savePath, '../');
        savePath = savePath.toString().slice(0, -1);
        
        console.log('pptx2images');
        console.log(savePath);

        let cmd = `powershell -Command "& 'C:\\Program Files\\LibreOffice\\program\\soffice.exe' --headless --convert-to pdf --outdir '${savePath}' '${pptxPath}'"`;

        console.log(cmd);

        await exec(cmd, async (err, stdout, stderr) => {
            if (err) {
                console.log(err);

                await errLogger(err);

                reject('Error while creating presenation');
            };

            console.log(stdout);
            console.log(stderr);

        }).on('close', async (s) => {

            console.log(s);
            
            let imagesSavePath = path.join(savePath, '/images');
            let filenName = pptxPath.split(path.sep).at(-1).replace('.pptx', '.pdf');

            console.log('Save Path: ' + imagesSavePath);

            console.log(path.join(savePath, filenName));

            await pdf2png(path.join(savePath, filenName), imagesSavePath, filenName).catch(async (err) => {
                await errLogger(err);

                resolve('Error while converting presentation.');
            });

            console.log('Done');

            // DONT DELETE THE PDF
            // fs.unlinkSync(path.join(path.join(savePath, filenName)));

            resolve(path.join(savePath, pptxPath.split(path.sep).at(-1).toString()));
        });
    });
};