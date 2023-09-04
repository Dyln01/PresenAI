const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const db = require('../db-functions/index');
const ISO6391 = require('iso-639-1');
const { pptxImage, loadingScreen } = require('../functions/index');
const util = require('util');
const errLogger = require('../functions/errLogger');

async function createPptx(name, creds, info) {

    return new Promise(async (resolve, reject) => {
        try {

            let languageCode = ISO6391.getCode(info.lang)

            if (languageCode) {
                
                let uuidName = name.toLowerCase() + '-' + uuid.v4();
                // let hasSub = await db.hasSub(creds.id);
            
                if (parseInt(creds.pptxLeft) > 0) {
                    let pptxPath = path.join(path.join(__dirname, `../pptxPath/${uuidName}/`), (uuidName + '.pptx'));

                    let content_slide;
                    let end_slide;

                    if (info.content_slide === 'on' || info.content_slide === true) {
                        content_slide = true;
                    } else {
                        content_slide = false;
                    };

                    if (info.end_slide === 'on' || info.end_slide === true) {
                        end_slide = true;
                    } else {
                        end_slide = false;
                    };

                    delete require.cache[require.resolve('../../ppt/main')];

                    let createPres = require('../../ppt/main');

                    await createPres(parseInt(info.max_slides), info.name, languageCode, content_slide, end_slide, info.pptx_level).then(async (presData) => {

                        if (typeof presData === 'string') {
                            resolve("Couldn't create presentation.");
                        } else {
                            if (util.isError(presData)) {
                                resolve("Couldn't create presentation.");
                            } else {
                                fs.mkdirSync(path.join(__dirname, `../pptxPath/${uuidName}`));
                                fs.mkdirSync(path.join(__dirname, `../pptxPath/${uuidName}/images`));
        
                                await presData.writeFile({ fileName: pptxPath, compression: true }).then(async (res) => {
                                    console.log("Presentation saved successfully!");
        
                                    await pptxImage(pptxPath, path.join(__dirname, `../pptxPath/${uuidName}/images`)).then(async (images) => {
        
                                        if (images) {
        
                                            let remove = await db.removePptxLeft(creds.id);
        
                                            if (typeof remove !== 'string') {
                                                let pptx = await db.createPptx({
                                                    id: uuid.v4(),
                                                    userId: creds.id,
                                                    name: info.name,
                                                    path: images,
                                                });
            
                                                resolve(pptx);
                                            } else {
        
                                                await db.removePptxLeft(creds.id);
        
                                                resolve('Error while removing presentation.');
                                            };
                                        } else {
                                            
                                            fs.unlinkSync(path.join(__dirname, `../pptxPath/${uuidName}`));
        
                                            resolve("Couldn't create presentation.");
                                        };
                                    }).catch(async (err) => {
                                        await errLogger(err);
        
                                        fs.unlinkSync(path.join(__dirname, `../pptxPath/${uuidName}`));
        
                                        resolve("Couldn't create presentation.");
                                    });
        
                                }).catch(async (err) => {
        
                                    await errLogger(err);
        
                                    resolve("Couldn't create presentation.");
                                });
                            };
                        };

                    }).catch(async (err) => {

                        console.log('Called');

                        if (Object.entries(err).length > 0) {
                            if (typeof err.message !== 'undefined') {
                                if (!err.message.toString().includes('length of text') || !err.message.toString().includes('Error') || !err.message.toString().includes("Error while getting information.")) {
                                    console.log(err);

                                    await errLogger(err);
                                };

                                if (err.message.toString().includes('length of text') || err.message.toString().includes("Error while getting information.")) {
                                    resolve('Error while getting data for presentation.');
                                }; 
                            } else {
                                await errLogger(err, 'no_messsage');

                                resolve('Error while getting data for presentation');
                            };
                        } else {
                            await errLogger(err);

                            resolve('Error while getting data for presentation.');   
                        };
                    });
                } else {
                    resolve("Not enough presentations left.");
                };
            } else {
             resolve('Invalid language.')
            };
        } catch (err) {
            await errLogger(err);

            resolve('Error while creating presentation.');
        };
    });
};

async function findPptx(userInfo, query) {
    return new Promise(async function(resolve, reject) {
        try {
            let json = {
                userId: userInfo.id,
                name: query,
            };

            let results = await db.findPptx(json, 1);

            if (typeof results !== 'string') {
                resolve(results);
            } else {
                resolve("Error while finding presentations");
            };

        } catch (err) {
            await errLogger(err);

            resolve('Error while finding presentation');
        };
    });
};

async function getPptxByName(userInfo, name) {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await db.getPptxByName(userInfo, name);

            if (typeof result !== 'string') {
                resolve(result);
            } else {
                resolve("Error while finding presentation");
            };
        } catch (err) {
            await errLogger(err);

            resolve('Error while finding presentation');
        };
    });
};

module.exports = {
    createPptx,
    findPptx,
    getPptxByName,
};