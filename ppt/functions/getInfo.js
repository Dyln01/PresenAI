// const wtf = require('wtf_wikipedia');
// const search = require('wikipedia');
// const _ = require('lodash');
// const stringSimilarity = require('string-similarity');
// const summarizeText = require('./test.js');
// const translator = require('./translate.js');
// const getSubject = require('./getSubject.js');
const Jimp = require('jimp');
const fs = require('fs');
// const sharp = require('sharp');
const request = require('request');
const scraper = require('js-google-image-scraper');
const path = require('path');
const errLogger = require('../../server/functions/errLogger.js');
const bourne = require('@hapi/bourne');
const { createCanvas, loadImage } = require('canvas');
const uuid = require('uuid');
const natural = require('natural');
const urlToImage = require('url-to-image');
const imageTypes = require('../json/types.json');
const tokenizer = new natural.WordTokenizer();

require('dotenv').config({
    path: '../../server/.env',
});


Object.defineProperty(Array.prototype, 'splitter', {
    value: function(chunkSize) {
        var array = this;
        return [].concat.apply([],
            array.map(function(elem, i) {
                return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
            })
        );
    }
});

let topicListFileData = fs.readFileSync(path.join(__dirname, '../json/all_topics.json'), {
    encoding: 'utf8',
});
let topicList = bourne.safeParse(topicListFileData);

let exampleListFileData = fs.readFileSync(path.join(__dirname, '../json/all_examples.json'), {
    encoding: 'utf8',
});
let examplesList = bourne.safeParse(exampleListFileData);

async function makeImage(name) {

    return new Promise(async (resolve, reject) => {
       try {
        await scraper(name, 1).then(async (res) => {

            let url = res.urls[0].toString().toLowerCase();

            console.log(url);
        
            let imgExt = path.extname(url);

            if (imgExt.includes('?')) {
                imgExt = imgExt.split('?')[0];
            };

            let imgPath = path.join(__dirname, `../images/${name.toString().trim()}${imgExt.toString()}`);
            // let stream = fs.createWriteStream(imgPath);


            // if (imgExt.includes('gif')) {
            //     imgPath = path.join(__dirname, `../images/${name}.gif`);  
            //     stream = fs.createWriteStream(imgPath); 
            // };

            if (imgExt === null || imgExt === undefined) {
                resolve('undefined');
            };

            let hasImgType = false;

            imageTypes.every((imageType) => {
                if (imageType.toString().includes(imgExt.toString())) {
                    hasImgType = true;

                    return false;
                };


                return true;
            });

            if (!fs.existsSync(path.join(__dirname, `../images/${name.toString().trim()}${imgExt.toString()}`))) {
                await request({
                    url: url,
                    encoding: null,
                }).pipe(fs.createWriteStream(path.join(__dirname, `../images/${name.toString().trim()}${imgExt.toString()}`))).on('close', async () => {
                    let image = path.join(__dirname, `../images/${name.toString().trim()}${imgExt.toString()}`);
                    let fileData = fs.readFileSync(image).toString('base64');
                    let dataURL = `data:image/${imgExt};base64,${fileData}`;

                    resolve(imgPath);

                    // let canvas = createCanvas();
                    // let ctx = canvas.getContext('2d');

                    // await loadImage(path.join(__dirname, `../temp_images/${name.toString().trim()}${imgExt.toString()}`), {}).then((image) => {
                    //     canvas.width = image.width;
                    //     canvas.height = image.height;

                    //     ctx.drawImage(image, 0, 0);

                    //     let dataUriPng = canvas.toDataURL('image/png', 0.8);
                    //     let pngWriteStream = path.join(__dirname, `../images/${name.toString().trim()}.png`);

                    //     fs.writeFileSync(pngWriteStream, Buffer.from(dataUriPng.split(',')[1], 'base64'));

                    //     fs.unlinkSync(path.join(__dirname, `../temp_images/${name.toString().trim()}${imgExt.toString()}`));

                    // }).catch(async (err) => {

                    //     // fs.unlinkSync(path.join(__dirname, `../temp_images/${name.toString().trim()}${imgExt.toString()}`));

                    //     await errLogger(err);
                        
                    //     resolve('undefined');
                    // });
                }).on('error', async (err) => {
                    await errLogger(err);
                    
                    console.log(err);
    
                    console.log('Called 121: getinfo.js');
    
                    resolve('undefined');
                });
               } else {
                resolve(imgPath);
               };
        //     if (imgExt.includes('bmp')) {

        //         await request(url, {
        //             encoding: null,
        //         }).on('error', async (err) => {

        //             await errLogger(err);

        //             resolve('undefined');

        //         }).pipe(sharp().bmp()).on('error', async (err) => {
        //             if (!err.message.toString().includes('buffer')) {
        //                 console.log(err);
        //             };

        //             await errLogger(err);

        //             resolve('undefined');
        //         }).pipe(stream).on('finish', () => {
        //             resolve(imgPath);
        //         });

        //     } else if (imgExt.includes('dib')) {

        //         await request(url, {
        //             encoding: null,
        //         }).on('error', async (err) => {

        //             await errLogger(err);

        //             resolve('undefined');

        //         }).pipe(sharp().dib()).on('error', async (err) => {
        //             if (!err.message.toString().includes('buffer')) {
        //                 console.log(err);
        //             };

        //             await errLogger(err);

        //             resolve('undefined');
        //         }).pipe(stream).on('finish', () => {
        //             resolve(imgPath);
        //         });

        //     } else if (imgExt.includes('emf')) {

        //         await request(url, {
        //             encoding: null,
        //         }).on('error', async (err) => {

        //             await errLogger(err);

        //             resolve('undefined');

        //         }).pipe(sharp().emf()).on('error', async (err) => {
        //             if (!err.message.toString().includes('buffer')) {
        //                 console.log(err);
        //             };

        //             await errLogger(err);

        //             resolve('undefined');
        //         }).pipe(stream).on('finish', () => {
        //             resolve(imgPath);
        //         });

        //     } else if (imgExt.includes('gif')) {

        //         await request(url, {
        //             encoding: null,
        //         }).on('error', async (err) => {

        //             await errLogger(err);

        //             resolve('undefined');

        //         }).pipe(sharp().gif()).on('error', async (err) => {
        //             if (!err.message.toString().includes('buffer')) {
        //                 console.log(err);
        //             };

        //             await errLogger(err);

        //             resolve('undefined');
        //         }).pipe(stream).on('finish', () => {
        //             resolve(imgPath);
        //         });

        //     } else if (imgExt.includes('jpe') || imgExt.includes('jpeg') || imgExt.includes('jpg')) {

        //         await request(url, {
        //             encoding: null,
        //         }).on('error', async (err) => {

        //             await errLogger(err);

        //             resolve('undefined');

        //         }).pipe(sharp().jpeg()).on('error', async (err) => {
        //             if (!err.message.toString().includes('buffer')) {
        //                 console.log(err);
        //             };

        //             await errLogger(err);

        //             resolve('undefined');
        //         }).pipe(stream).on('finish', () => {
        //             resolve(imgPath);
        //         });

        //     } else if (imgExt.includes('png')) {

        //         await request(url, {
        //             encoding: null,
        //         }).on('error', async (err) => {

        //             await errLogger(err);

        //             resolve('undefined');

        //         }).pipe(sharp().png()).on('error', async (err) => {
        //             if (!err.message.toString().includes('buffer')) {
        //                 console.log(err);
        //             };

        //             await errLogger(err);

        //             resolve('undefined');
        //         }).pipe(stream).on('finish', () => {
        //             resolve(imgPath);
        //         });

        //     } else if (imgExt.includes('tif') || imgExt.includes('tiff')) {

        //         await request(url, {
        //             encoding: null,
        //         }).on('error', async (err) => {

        //             await errLogger(err);

        //             resolve('undefined');

        //         }).pipe(sharp().tiff()).on('error', async (err) => {
        //             if (!err.message.toString().includes('buffer')) {
        //                 console.log(err);
        //             };

        //             await errLogger(err);

        //             resolve('undefined');
        //         }).pipe(stream).on('finish', () => {
        //             resolve(imgPath);
        //         });

        //     } else if (imgExt.includes('wmf')) {

        //         await request(url, {
        //             encoding: null,
        //         }).on('error', async (err) => {

        //             await errLogger(err);

        //             resolve('undefined');

        //         }).pipe(sharp().wmf()).on('error', async (err) => {
        //             if (!err.message.toString().includes('buffer')) {
        //                 console.log(err);
        //             };

        //             await errLogger(err);

        //             resolve('undefined');
        //         }).pipe(stream).on('finish', () => {
        //             resolve(imgPath);
        //         });
        //     } else {
        //         resolve('undefined');
        //     };
        // });
        });
       } catch (err) {
        if (err.message.toString().includes('buffer')) {
            console.log('Iamge buffer error');
        } else {
            console.log(err);
        };

        resolve('undefined');
       };
    });
};

module.exports = async function getInfo(chosenTopic, slideLength, isContent, language, wantsEndSlide, level) {
    return new Promise(async (resolve, reject) => {
        try {

            let maxSlides = slideLength;
    
            // if (isContent) {
            //     maxSlides -= 1;
            // };
    
            // if (wantsEndSlide) {
            //     maxSlides -= 1;
            // };

            console.log(maxSlides)

            // `Topic 1: Topic name
            // Information about the topic`

            let le = 'easy';

            if (parseInt(level) === 1 || parseInt(level) === 0) {
                le = 'easy';
            } else if (parseInt(level) === 2) {
                le = 'intermediate';
            } else if (parseInt(level) === 3) {
                le = 'difficult'
            };
    
            fetch("https://api.ai21.com/studio/v1/j2-ultra/complete", {
                    headers: {
                        "Authorization": `Bearer ${process.env.AI21_KEY}`,
                        "Content-Type": "application/json",
                        "Cache-Control": "no-cache",
                    },
                    body: JSON.stringify({
                        "prompt": `Write an essay that is on a language level of ${le} in the language of "${language}". The essay is about "${chosenTopic.toString()}", and the essay should have ${maxSlides.toString()} topics, each with the following format:

                        Topic X: Topic Name

                        Information: Information about the the topic RIGHT HERE (DO NOT USE THE SAME INFORMATION AND DO NEVER USE ASTERISK)

                        For example as Topic 1 (DO NOT USE THIS): "
                        Topic 1: The beginning of World War 2

                        The beginning of World War 2 started because hitler took over countries
                        " But then about the main topic of ${chosenTopic.toString()} and DO NOT USE THE SAME INFORMATION
                                                                
                        Please repeat the above format for each of the ${maxSlides.toString()} topics. DO NOT USE THE SAME TOPIC NAME OR INFORMATION.
                    
                        The essay should be approximately ${(parseInt(maxSlides) * 300).toString()} words long, and each topic should be structured with one line break between each topic.
                    
                        Thank you in advance for your assistance and write it fully.`,
                        "numResults": 1,
                        "epoch": 0,
                        "maxTokens": parseInt(maxSlides * 300) + 300,
                        "temperature": .2,
                        "topKReturn": 10,
                        "topP": 0.8,
                        "countPenalty": {
                          "scale": 0,
                          "applyToNumbers": false,
                          "applyToPunctuations": false,
                          "applyToStopwords": false,
                          "applyToWhitespaces": false,
                          "applyToEmojis": false
                        },
                        "frequencyPenalty": {
                          "scale": 0,
                          "applyToNumbers": false,
                          "applyToPunctuations": false,
                          "applyToStopwords": false,
                          "applyToWhitespaces": false,
                          "applyToEmojis": false
                        },
                        "presencePenalty": {
                          "scale": 0,
                          "applyToNumbers": false,
                          "applyToPunctuations": false,
                          "applyToStopwords": false,
                          "applyToWhitespaces": false,
                          "applyToEmojis": false
                        },
                        "stopSequences":[]
                    }),
                    method: "POST"
                    }).then(res => res.json()).then(async (text) => {
                        let rText = text.completions[0].data.text.toString()
                        let rTextSplitted = rText.trim().split('\n').map(line => line.replace('Information:', '')).filter(e => e);

                        let topics = [];
                        let sections = [];
                        let s = true;
                        
                        let consecutiveAsterisks = 0;
                        let hasMaxSlides = false;

                        for (let i = 0; i < rText.length; i++) {
                            if (rText[i] === '*') {
                                consecutiveAsterisks++;
                                if (consecutiveAsterisks >= parseInt(maxSlides)) {
                                    hasMaxSlides = true;
                                    break;
                                }
                            } else {
                                consecutiveAsterisks = 0;
                            };
                        };

                        console.log(rTextSplitted);

                        if (!hasMaxSlides) {
                            for (let i = 1; i <= maxSlides; i++) {
                                if (rText.includes(`${i}.`)) {
                                    s = true;
                                    break;
                                };
    
                                if (rText.includes(`Topic ${i}`)) {
                                    s = true;
                                    break;
                                };
                            };
        
                            if (s === true) {
                                for (let line of rTextSplitted) {
                                    for (let i = 1; i <= maxSlides; i++) {
        
                                        if (line.length > 0) {
        
                                            if (line.slice(0, 2) === `${i}.`) {
                                                if (line.split(':').length > 0) {
                                                    if (line.split(':')[0].length === line.length) {
                                                        topics.push(line.split(':')[0]);
                                                    } else {
                                                        topics.push(line.split(':')[0]);
                                                    };
                                                };
                                            } else if (line.slice(0, 7).includes(`Topic ${i}`)) {
                                                topics.push(line.split(':')[1]);
                                            };
                                        };
                                    };
                                };

                                // topics.forEach((e, i, arr) => {
                                //     console.log((`Topic ${i.toString()}: ${e.toString()}`));
                                //    rTextSplitted = rTextSplitted.filter(e => !e.includes((`Topic ${i.toString()}:${e.toString()}`)));
                                // });

                                // console.log(rTextSplitted);

                                // rTextSplitted.forEach((e, i, arr) => {
                                //     console.log(i);
                                //     if (typeof arr[i + 1] !== 'undefined') {
                                //         if (!arr[i + 1].toString().includes(`Topic ${(i + 2).toString()}`)) {
                                //             if (!e.toString().includes(`Topic ${(i + 1).toString()}`)) {

                                //                 console.log('Logging topic');
                                //                 console.log((`Topic ${i.toString()}:${topics[i]}`).toString());
                                //                 console.log(e);

                                //                 rTextSplitted = rTextSplitted.filter(e => e !== (`Topic ${(i + 1).toString()}`).toString());
    
                                //                 sections.push(e.toString() + ' ' + arr[i + 1].toString()).toString();
                                //             };
                                //         } else {
                                //             if (!e.toString().includes(`Topic ${(i + 1).toString()}`) ) {

                                //                 console.log('Logging topic');
                                //                 console.log('Not 2');

                                //                 rTextSplitted = rTextSplitted.filter(e => !e.includes(`Topic ${(i + 1).toString()}`).toString());
    
                                //                 sections.push(e.toString()).toString();
                                //             };
                                //         }
                                //     };
                                // });
        
                                // rTextSplitted.forEach((e, i) => {
                                //     topics.some(topic => {
                                //         if (!e.split(':')[0].includes(topic) && isNaN(e.slice(0, 1)) && isNaN(e.slice(6 ,7))) {
                                //             sections.push(e);

                                //             return false;
                                //         } else {
                                //             if (e.split(':').length > 0) {
                                //              sections.push(e.split(':')[1]);   
        
                                //              return false;
                                //             } else {
                                //                 // TODO: get next line
                                //                 sections.push(rTextSplitted[i + 1]); 

                                //                 return false;
                                //             };
                                //         };
                                //     })
                                // });

                                let sums = [];

                                rTextSplitted.forEach((e, i, arr) => {
                                    if (topics.some(w => w.includes(e.split(':')[1]))) {
                                        let format = {
                                            title: e.split(':')[1],
                                            summary: '',
                                        };

                                        console.log(arr[i + 1]);

                                        let splittedSection = arr[i + 1].split(' ').splitter(6);
                
                                        for (let split of splittedSection) {
                    
                                            split.forEach((s, w, arr2) => {
                                                if (w === arr2.length - 1) {
                                                    format.summary += `${s} \n`;
                                                } else {
                                                    format.summary += `${s} `;
                                                };
                                            });
                                        };

                                        sums.push(format);
                                    };
                                });
                                
                                console.log(topics);
                                console.log(sums);
        
                                if (typeof sums !== 'undefined') {
                                    if (topics[0] !== undefined && topics[0] !== null) {
                                        await fetch("https://api.ai21.com/studio/v1/j2-jumbo-instruct/complete", {
                                            headers: {
                                                "Authorization": `Bearer ${process.env.AI21_KEY}`,
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify({
                                                "prompt": `Please get the closest topic out of this list ${topicList} that matches this ${chosenTopic.toString()} topic DO NOT RETURN A TOPIC THAT ISNT IN THE LIST`,
                                                "numResults": 1,
                                                "maxTokens": 2000,
                                                "temperature": 0.3,
                                                "topKReturn": 0,
                                                "topP":1,
                                                "countPenalty": {
                                                "scale": 0,
                                                "applyToNumbers": false,
                                                "applyToPunctuations": false,
                                                "applyToStopwords": false,
                                                "applyToWhitespaces": false,
                                                "applyToEmojis": false
                                                },
                                                "frequencyPenalty": {
                                                "scale": 0,
                                                "applyToNumbers": false,
                                                "applyToPunctuations": false,
                                                "applyToStopwords": false,
                                                "applyToWhitespaces": false,
                                                "applyToEmojis": false
                                                },
                                                "presencePenalty": {
                                                "scale": 0,
                                                "applyToNumbers": false,
                                                "applyToPunctuations": false,
                                                "applyToStopwords": false,
                                                "applyToWhitespaces": false,
                                                "applyToEmojis": false
                                                },
                                                "stopSequences":[]
                                            }),
                                                method: "POST"
                                            }).then(res => res.json()).then(async json => {
                                                let topicText = json.completions[0].data.text;
                                                let topic;

                                                console.log('572');
                                                console.log(topicText);
                                
                                                topicList.every(e => {
                                                    if (topicText.includes(e)) {
                                                        topic = e;

                                                        return false;
                                                    } else {
                                                        return true;
                                                    };
                                                });

                                                console.log(topic)
                                
                                                if (typeof topic === 'string') {
        
                                                    let images = [];
    
                                                    // sections = sections.map(e => {
                                                    //     if (examplesList.some(w => !e.includes(w)) && !e.includes(':')) {
                                                    //         if (!e.startsWith('*')) {
                                                    //             return e;
                                                    //         };
                                                    //     };
                                                    // });
    
                                                    sections = sections.filter(e => e);
    
                                                    // if (sections.length >= Math.round(maxSlides / 2)) {
                                                    //     resolve(new Error('Invalid length of text'));
                                                    // };
    
                                                    console.log('Sections length: ' + sections.length);
                                                    console.log('Max slides: ' + Math.round(maxSlides / 2));
    
                                                    console.log(sections);
        
                                                    for (let i = 0; i < topics.length; i++) {

                                                        console.log('Debug: 3');
                                                        
                                                        if (sums[i] !== undefined) {

                                                            let imagePath = await makeImage((topics[i].replace(`1.`, '') + ' '+ topic));

                                                            console.log(imagePath);
                                                            if (imagePath.toString() === 'undefined') {
                                                                continue;
                                                            }
            
                                                            images.push(imagePath);
    
                                                            // let splittedSection = sums[i].split(' ').splitter(6);
                                    
                                                            // for (let split of splittedSection) {
                                        
                                                            //     split.forEach((s, i, arr) => {
                                                            //         if (i === arr.length - 1) {
                                                            //             jsonFormat.summary += `${s} \n`;
                                                            //         } else {
                                                            //             jsonFormat.summary += `${s} `;
                                                            //         };
                                                            //     });
                                                            // };
            
                                                            // sums.push(jsonFormat);
                                                        } else {
                                                            console.log('Debug: 2');
                                                        };
                                                    };

                                                    console.log(topic);
        
                                                    resolve({
                                                        sums: sums,
                                                        images: images,
                                                        topic: topic,
                                                    });
                                                } else {
                                                    resolve('Error while getting topic');
                                                };
                                            }).catch(async (err) => {
                                                                        
                                                console.log('Debug: ' + err);
    
                                                await errLogger(err);
    
                                                resolve('Error while getting information.');
                                            });
                                    } else {
                                        resolve('Error while getting information.');
                                    };
                                } else {
                                    resolve('Error while getting information.');
                                };
                            } else {
                                console.log(rText);
    
                                resolve('Error while getting information.');
                            };
                        } else {
                            resolve('Error while getting information.');
                        };
                    }).catch(async (err) => {
                        
                        console.log('Debug: ' + err);

                        await errLogger(err);

                        resolve('Error while getting information.');
                    });
        } catch (err) {
                                    
            console.log('Debug: ' + err);

            await errLogger(err);

            resolve('Error while getting information.');
        }; 
    });
};