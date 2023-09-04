const fs = require('fs');
const path = require('path');
const admZip = require('adm-zip');
const bourne = require('@hapi/bourne');
const stringSimilarity = require('string-similarity');
const { PrismaClient } = require('@prisma/client');
const errLogger = require('../functions/errLogger');

const prisma = new PrismaClient();

module.exports = async function exportPptx(info, name, type) {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await prisma.user.findUnique({
                where: {
                    id: info.id,
                },
           });

           if (user) {
                let allPptxByUser = await prisma.pptx.findMany({
                    where: {
                        userId: info.id,
                    },
                });

                let names = [];
                let pptxByNameArr = [];
        
                allPptxByUser.forEach((res) => {
                    let splitted = res.name.split('-')[0];

                    names.push(splitted); 

                    let json = bourne.safeParse(JSON.stringify({
                        [splitted]: res,
                    }));

                    pptxByNameArr.push(json);
                });

                let bestMatch = stringSimilarity.findBestMatch(name, names);
                let bestMatchPptx = pptxByNameArr.find(e => e.hasOwnProperty(bestMatch.bestMatch.target))[bestMatch.bestMatch.target];

                if (bestMatchPptx) {
                    let bestMatchPptxPath = bestMatchPptx.path;

                    if (bestMatchPptxPath) {
                        if (type.toString() === 'pptx') {

                            let pptxReadStream = fs.createReadStream(bestMatchPptxPath);

                            if (pptxReadStream) {
                                resolve(pptxReadStream);
                            } else {
                                resolve("Couldn't find presentation with given name.");
                            };

                        } else if (type.toString() === 'image') {
                            
                            let oldBestMatchPptxPath = path.join(...bestMatchPptxPath.toString().split(path.sep).slice(0, -1));

                            bestMatchPptxPath = path.join(oldBestMatchPptxPath, '/images');

                            let pptxImageFiles = fs.readdirSync(bestMatchPptxPath);
                            let zipper = new admZip();

                            if (pptxImageFiles && pptxImageFiles.length > 0) {

                                let files = fs.readdirSync(bestMatchPptxPath);

                                if (!files || files.length <= 0)  {
                                    resolve("Couldn't find presentation with given name.");
                                } else {

                                    for (let file of files) {
                                        zipper.addLocalFile(path.join(bestMatchPptxPath, file.toString()))
                                    };

                                    let buffer = zipper.toBuffer();

                                    fs.writeFileSync('../some_zip.zip', buffer);

                                    resolve(buffer);
                                };
                            } else {
                                resolve("Couldn't find presentation with given name.");
                            };
    
                        } else if (type.toString() === 'pdf') {

                            bestMatchPptxPath = path.join(path.dirname(bestMatchPptxPath), bestMatchPptxPath.toString().split(path.sep).at(-1).replace('.pptx', '.pdf'));

                            console.log(bestMatchPptxPath);

                            let pptxReadStream = fs.createReadStream(bestMatchPptxPath);

                            if (pptxReadStream) {
                                resolve(pptxReadStream);
                            } else {
                                resolve("Couldn't find presentation with given name.");
                            };
    
                        } else {
                            resolve("Invalid format to export. Please choose a valid format.");
                        };
                    } else {
                        resolve("Couldn't find presentation with given name.");
                    };
                } else {
                    resolve("Couldn't find presentation with given name.");
                };
           } else {
                resolve('Undefined user.');
           };
        } catch (err) {
            await errLogger(err);

            resolve("Couldn't export presentation.");
        };
    });
};