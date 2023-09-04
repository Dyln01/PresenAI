const fs = require('fs');
const path = require('path');
const z85 = require('z85');
const mime = require('mime-types');
const bourne = require('@hapi/bourne');
const stringSimilarity = require('string-similarity');
const { PrismaClient } = require('@prisma/client');
const errLogger = require('../functions/errLogger');

const prisma = new PrismaClient();

function repB64(input) {

    if (!isBase64(input)) {
        throw new Error('Invalid Base64 input');
    };
    
    let output = input;
    let paddingLength = input.length % 4;

    if (paddingLength === 1) {

        throw new Error('Invalid Base64 input: incorrect padding length');

    } else if (paddingLength === 2) {

        output += '==';

    } else if (paddingLength === 3) {

        output += '=';
    };

    const decoded = atob(output);
    const encoded = btoa(decoded);

    if (encoded !== output) {

        throw new Error('Could not repair Base64 input');

    };

    return output;
};

module.exports = async function getPptxByName(info, name) {
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

                if (allPptxByUser.length <= 0) {
                    resolve("User doesn't have any presentations. Please create 1.");
                };

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

                console.log(name);
                console.log(allPptxByUser);

                let bestMatch = stringSimilarity.findBestMatch(name.toString(), names);
                let bestMatchPptx = pptxByNameArr.find(e => e.hasOwnProperty(bestMatch.bestMatch.target))[bestMatch.bestMatch.target];
                let bestMatchPptxPathArr = bestMatchPptx.path.split("\\");
                let bestMatchPptxPath = "";

                bestMatchPptxPathArr.pop();

                for await (let b of bestMatchPptxPathArr) {
                    bestMatchPptxPath += (b + '\\').toString();
                };

                if (bestMatchPptx) {
                    let pptxPath = path.join(bestMatchPptxPath, '/images');
                    let pptxImagesFileNames = fs.readdirSync(pptxPath);
                    let someArr = {
                        name: bestMatch.bestMatch.target,
                        images: [],
                    };
                    let imagesArr = []

                    for await (let pptxImagesFileName of pptxImagesFileNames) {
                        let imageFile = fs.readFileSync(path.join(pptxPath, pptxImagesFileName));
                        let mimeType = mime.lookup(path.join(pptxPath, pptxImagesFileName));
                        let base64Img = Buffer.from(imageFile).toString('base64');
                        // console.log(imageFile)

                        if (imageFile) {
                            imagesArr.push(`data:${mimeType};charset=utf8;base64,${base64Img}`);
                        } else {
                            resolve("Couldn't find presentation with given name.");
                        };
                    };

                    someArr.images = imagesArr

                    if (typeof someArr !== 'string') {
                        resolve(someArr);
                    } else {
                        resolve('Error whole loading presentation');
                    };
                } else {
                    resolve("Couldn't find presentation with given name.");
                };
           } else {
                resolve('Undefined user.');
           };
        } catch (err) {
            console.log(err);
        };
    });
};