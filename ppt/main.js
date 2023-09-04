delete require.cache[require.resolve('pptxgenjs')];
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const colors = require('colornames');
const pptx = require('pptxgenjs');
// const fetch = require('node-fetch');
const createSlide = require('./slide');
const { getInfo, translate, themeInfo, gradientHandler, getSubject } = require('./functions/index');
const errLogger = require('../server/functions/errLogger');

let pre = new pptx();

// x: 10%, y: 50% For Begin Slide
// x: 1, y: .7 For Not Begin Slide
// Gradient https://github.com/gitbrent/PptxGenJS/issues/102

let arr = new Array(7);
let imageExt = JSON.parse(fs.readFileSync(path.join(__dirname, './json/types.json'), 'utf-8'));

async function wikiImageDownloader(url) {
 try {
  return new Promise(async (resolve, reject) => {
    await fetch(url, {
      redirect: 'follow',
    }).then(async (res) => {
  
      let imageName = decodeURI(res.url.split('/').pop());
      let imagePath = path.join(__dirname, `./images/${imageName}`);

      if (imageExt.some((el) => imageName.includes(el))) {
        if (fs.readdirSync(path.join(__dirname, './images')).includes(imageName)) {
          resolve(imagePath);
        } else {
  
          await fetch(res.url).then(async (res) => {
            let stream = fs.createWriteStream(imagePath);
  
            res.body.pipeTo(stream);
  
            stream.on('error', ((err) => {
              resolve(err);
            }));
          }).catch((err) => {
            console.log(err);
          });
  
          resolve(imagePath);
        };
      } else {

        resolve('');
      };
    });
  });
 } catch (err) {
  console.log(err);
 };
};

module.exports = async function createPres(slideNumber, title, language, isContent, wantEndSlide, level) {
   return new Promise(async (resolve, reject) => {
    
    try {

      console.log(isContent);
      console.log(wantEndSlide);

      console.log('Creating Presentation')

      let customUUID = uuid.v4();
      console.time('Time to make pptx' + '-' + customUUID.toString());
  
      console.time('time' + '-' + customUUID.toString());
  
      let contentT;
      let endT;
      let slideNum = 0;
      let probSubject;

      await getInfo(title, slideNumber, isContent, language, wantEndSlide, level).then(async (info) => {
        console.log(info);
        
        if (typeof info === 'string') {
          resolve('Error while creating presentation.');
        } else {
          probSubject = info.topic;
        let images = new Set();
        let theme = probSubject;
        let themeI = await themeInfo(theme);
    
        if (typeof themeI === 'string') {
          resolve('Error while getting theme.');
        } else {
                // let wantGradient = themeI.wantGradient;
        let title_string = ``;
        let options = {
            shadow: true,
            imageSize: 2,
            isData: false,
        };
  
        console.log('END SLIDE WANT', wantEndSlide);
    
        if (isContent) {
            contentT = await translate('Content', 'en', language);
        };
    
        if (wantEndSlide) {
            endT = await translate('End', 'en', language);
        };
    
        console.timeEnd('time' + '-' + customUUID.toString());
    
        if (isContent) {
            let arr_2 = [...info.sums].splice(1, info.sums.length);
            let count = 0;
    
            for (let sum of arr_2) {
              title_string += `${sum.title} \n`;
            };
        };
    
        for await (let image of info.images) {
          try {
            images.add(image);
          } catch (err) {
              console.log(err);
          };
        };
        
        for await (let w of info.sums) {
            let slide = pre.addSlide();

            console.log('Slide num', slideNum === info.sums.length - 1);
    
            // if (wantGradient) {
            //   gradientHandler(slide, themeI, files);
            // };
    
            if (isContent) {
    
            if (slideNum === 0) {
    
                await createSlide(slide, slideNum, title.toString().toUpperCase(), info.sums[slideNum].summary, null, themeI, isContent, options, wantEndSlide).then(() => {
                slideNum += 1;
            
                return true;
                }).catch(async (err) => {
                  await errLogger(err);
  
                  resolve('Error in slide');
                });
    
            } else if (slideNum === 1) {
    
                await createSlide(slide, slideNum, contentT, title_string, [...images.values()][slideNum], themeI, isContent, options, wantEndSlide).then(() => {
                slideNum += 1;
            
                return true;
                }).catch(async (err) => {
                  await errLogger(err);
  
                  resolve('Error in slide');
                });
    
            } else if (slideNum === info.sums.length - 1 && wantEndSlide) {
              console.log('Called 169');
                await createSlide(slide, 0, endT, title_string, [...images.values()][slideNum], themeI, isContent, options, wantEndSlide, endT, info.sums.length).then(() => {
                slideNum += 1;
            
                return true;
                }).catch(async (err) => {
                  await errLogger(err);
  
                  resolve('Error in slide');
                });
            } else {
    
                await createSlide(slide, slideNum, info.sums[slideNum - 1].title, info.sums[slideNum - 1].summary, [...images.values()][slideNum - 1], themeI, isContent, options, wantEndSlide).then(() => {
                slideNum += 1;
            
                return true;
                }).catch(async (err) => {
                  await errLogger(err);
  
                  resolve('Error in slide');
                });
    
            };
            } else {
    
            if (slideNum === 0) {
    
                await createSlide(slide, slideNum, info.sums[slideNum].title, info.sums[slideNum].summary, null, themeI, isContent, options, wantEndSlide).then(() => {
                slideNum += 1;
            
                return true;
                }).catch(async (err) => {
                  await errLogger(err);
  
                  resolve('Error in slide');
                });
    
              } else if (slideNum === info.sums.length - 1 && wantEndSlide) {
                console.log('Called 169');
                  await createSlide(slide, 0, endT, title_string, [...images.values()][slideNum], themeI, isContent, options, wantEndSlide, endT, info.sums.length).then(() => {
                  slideNum += 1;
              
                  return true;
                  }).catch(async (err) => {
                    await errLogger(err);
    
                    resolve('Error in slide');
                  });
              } else {  
    
                await createSlide(slide, slideNum, info.sums[slideNum].title, info.sums[slideNum].summary, [...images.values()][slideNum], themeI, isContent, options, wantEndSlide).then(() => {
                slideNum += 1;
            
                return true;
                }).catch(async (err) => {
                  await errLogger(err);
  
                  resolve('Error in slide');
                });
    
            };
            };
        };
    
        // await pre.writeFile({ fileName: "ww.pptx", compression: true, file }).then((res) => {
        //     console.log("Presentation saved successfully!");
        //     console.log(res);
        // }).catch((err) => {
        //     console.log(err);
        // });
    
        resolve(pre);
    
        console.timeEnd('Time to make pptx' + '-' + customUUID.toString());
        };
        };
      }).catch(err => {
        resolve(err);
      });
      } catch (err) {
        await errLogger(err);

        resolve('Error while creating presentation.');
      };
   });
};