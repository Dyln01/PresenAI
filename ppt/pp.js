const fs = require('fs');
const path = require('path');
const colors = require('colornames');
const pptx = require('pptxgenjs');
const fetch = require('node-fetch');
const { createSlide } = require('./slide.js');
const { getInfo, translate, themeInfo, gradientHandler, getSubject, getThemeFromSubject } = require('./functions/index.js');
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
      // image = decodeURI(res.url);
  
      let imageName = decodeURI(res.url.split('/').pop());
      let imagePath = path.join(__dirname, `./images/${imageName}`);

      if (imageExt.some((el) => imageName.includes(el))) {
        if (fs.readdirSync(path.join(__dirname, './images')).includes(imageName)) {
          resolve(imagePath);
        } else {
  
          await fetch(res.url).then(async (res) => {
            let stream = fs.createWriteStream(imagePath);
  
            res.body.pipe(stream);
  
            stream.on('error', ((err) => {
              reject(err);
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

(async () => {
try {

  console.time('Time to make pptx');

  let slideNum = 0;

  console.time('time');

  let language = 'en';
  let contentT;
  let endT;
  let wantsSubjectTheme = true;
  let subject = 'the dog';
  let probSubject = await getSubject(subject);
  let info = await getInfo(subject, 'It was a year', arr.length, false, language, probSubject);
  let images = new Set();
  let theme = 'randomFont';
  let files = fs.readdirSync(path.join(__dirname, './gradients/'));
  let themeI = await themeInfo(theme);
  let isContent = true;
  let wantGradient = themeI.wantGradient;
  let wantEndSlide = true;
  let title_string = ``;
  let options = {
    shadow: true,
    imageSize: 2,
    isData: false,
  };

  if (isContent) {
    contentT = await translate('Content', 'en', language);
  };

  if (wantEndSlide) {
    endT = await translate('End', 'en', language);
  };

  if (wantsSubjectTheme) {
    themeI = await getThemeFromSubject(probSubject);
  }

  console.timeEnd('time');

  if (isContent) {
    let arr_2 = [...info.sums].splice(1, info.sums.length);

    for (let sum of arr_2) {
      title_string += `${sum.title} \n`;
    };
  };

  for await (let image of info.images) {
   try {
    await wikiImageDownloader(image).then((ima) => {
      if (ima !== null && ima !== undefined && ima !== '') {
        images.add(ima);
      };
    }).catch((err) => {
      console.log(err);
    });
   } catch (err) {
    console.log(err);
   };
  };

  console.log(info.sums.length);

  for await (let w of arr) {
    let slide = pre.addSlide();

    if (wantGradient) {
      gradientHandler(slide, themeI, files);
    };

    if (isContent) {

      if (slideNum === 0) {

        await createSlide(slide, slideNum, info.sums[slideNum].title, info.sums[slideNum].summary, null, themeI, isContent, options).then(() => {
          slideNum += 1;
    
          return true;
        }).catch((err) => {
          console.log(err);
        });

      } else if (slideNum === 1) {

        await createSlide(slide, slideNum, contentT, title_string, [...images.values()][slideNum], themeI, isContent, options).then(() => {
          slideNum += 1;
    
          return true;
        }).catch((err) => {
          console.log(err);
        });

      } else if (slideNum === (arr.length - 1) && wantEndSlide) {
        await createSlide(slide, 0, endT, title_string, [...images.values()][slideNum], themeI, isContent, options).then(() => {
          slideNum += 1;
    
          return true;
        }).catch((err) => {
          console.log(err);
        });
      } else {

        await createSlide(slide, slideNum, info.sums[slideNum - 1].title, info.sums[slideNum - 1].summary, [...images.values()][slideNum - 1], themeI, isContent, options).then(() => {
          slideNum += 1;
    
          return true;
        }).catch((err) => {
          console.log(err);
        });

      };
    } else {

      if (slideNum === 0) {

        await createSlide(slide, slideNum, info.sums[slideNum].title, info.sums[slideNum].summary, null, themeI, isContent, options).then(() => {
          slideNum += 1;
    
          return true;
        }).catch((err) => {
          console.log(err);
        });

      } else if (slideNum === (arr.length - 1) && wantEndSlide) {
        await createSlide(slide, 0, endT, title_string, [...images.values()][slideNum], themeI, isContent, options).then(() => {
          slideNum += 1;
    
          return true;
        }).catch((err) => {
          console.log(err);
        });
      } else {

        await createSlide(slide, slideNum, info.sums[slideNum].title, info.sums[slideNum].summary, [...images.values()][slideNum], themeI, isContent, options).then(() => {
          slideNum += 1;
    
          return true;
        }).catch((err) => {
          console.log(err);
        });

      };
    };
  };

  await pre.writeFile({ fileName: "ww.pptx", compression: true, }).then((res) => {
    console.log("Presentation saved successfully!");
    console.log(res);
  }).catch((err) => {
    console.log(err);
  });

  console.timeEnd('Time to make pptx');
} catch (err) {
  console.log(err);
};
})();