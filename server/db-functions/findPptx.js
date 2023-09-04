const fs = require('fs');
const path = require('path');
const bourne = require('@hapi/bourne');
const stringSimilarity = require('string-similarity');
const { PrismaClient } = require('@prisma/client');
const errLogger = require('../functions/errLogger');

const prisma = new PrismaClient();

module.exports = async function findPptx (info, type, filterOpt) {
    return new Promise(async (resolve, reject) => {
        try {
            let allPptxByUser = await prisma.pptx.findMany({
                where: {
                    userId: info.userId,
                },
            });
            
            if (info.name.toString().toLowerCase() === '/all') {
                let names = [];
                    let pptxByNameArr = [];

                    if (allPptxByUser.length <= 0) {
                        resolve("User doesn't have any presentations. Please create 1.");
                    } else {
                
                        let sortedData;
                        
                        if (filterOpt.toString() === 'latest') {
                            sortedData = allPptxByUser.sort((a, b) => {

                                return new Date(b.dateCreated) - new Date(a.dateCreated);
                            });  
                        } else if (filterOpt.toString() === 'oldest') {
                            sortedData = allPptxByUser.sort((a, b) => {

                                return new Date(a.dateCreated) - new Date(b.dateCreated);
                            });  
                        } else {
                            sortedData = allPptxByUser.sort((a, b) => {

                                return new Date(b.dateCreated) - new Date(a.dateCreated);
                            });
                        };
        
                        let newSortedData = [];
        
                        for await (let data of sortedData) {
                            let pptxByName = data;

                            if (pptxByName.path.toString() === 'Error while converting presentation.') {
                                continue;
                            } else {
                                let bestMatchPptxPathArr = pptxByName.path.split("\\");
                                let bestMatchPptxPath = "";
                
                                bestMatchPptxPathArr.pop();
                
                                for await (let b of bestMatchPptxPathArr) {
                                    bestMatchPptxPath += (b + '\\').toString();
                                };
            
                                if (pptxByName) {
                                try {
                                        
                                        let pptxPath = path.join(bestMatchPptxPath, '/images');
                                        let pptxImagesFileName = fs.readdirSync(pptxPath)[0];
                                        let imageFile = fs.readFileSync(path.join(pptxPath, pptxImagesFileName));
            
                                        newSortedData.push({
                                            title: data.name.split('-')[0].toString(),
                                            image: `data:image/png;base64,${imageFile.toString("base64")}`,
                                        });
                                } catch (err) {
                                        if (!err.message.includes(" no such file or directory, scandir")) {
                                            await errLogger(err);
                                            
                                            resolve('Unknow error when searching for presentations.');
                                        } else {
                                            resolve('Presentation files did not exist.');
                                        };
                                };
                                } else {
                                    resolve('Cannot get presentations. Try again later.');
                                };
                            };
                        };
                        
                        resolve(newSortedData);
                    };
            } else {
                if (type === 1) {
                    let names = [];
                    let pptxByNameArr = [];

                    if (allPptxByUser.length <= 0) {
                        resolve("User doesn't have any presentations. Please create 1.");
                    } else {
                        allPptxByUser.forEach((res) => {
                            let splitted = res.name.split('-')[0];
        
                            names.push(splitted); 
        
                            let json = bourne.safeParse(JSON.stringify({
                                [splitted]: res,
                            }));
        
                            pptxByNameArr.push(json);
                        });
                
                        let bestNames = stringSimilarity.findBestMatch(info.name, names);
                        let sortedData;
                        
                        for (let i = 0; i < bestNames.ratings.length; i++) {
                            for (let j = i + 1; j < bestNames.ratings.length; j++) {
                                if (bestNames.ratings[i].rating < bestNames.ratings[j].rating) {
                                    let currentMatch = bestNames.ratings[i];
                                    bestNames.ratings[i] = bestNames.ratings[j];
                                    bestNames.ratings[j] = currentMatch;
                                };
                            };
                        
                            sortedData = bestNames.ratings.sort((a, b) => b.rating - a.rating);
                        
                            // if (sortedData.length > 3) {
                            //     sortedData.slice(3);
                            // };
                        };
        
                        let newSortedData = [];
        
                        for await (let data of sortedData) {
                            let pptxByName = pptxByNameArr.find(e => e.hasOwnProperty(data.target))[data.target];
                            let bestMatchPptxPathArr = pptxByName.path.split("\\");
                            let bestMatchPptxPath = "";
            
                            bestMatchPptxPathArr.pop();
            
                            for await (let b of bestMatchPptxPathArr) {
                                bestMatchPptxPath += (b + '\\').toString();
                            };
        
                            if (pptxByName) {
                               try {
                                    let pptxPath = path.join(bestMatchPptxPath, '/images').toString()
                                    let pptxImagesFileName = fs.readdirSync(pptxPath)[0]
    
                                    if (fs.existsSync(path.join(pptxPath, pptxImagesFileName))) {
                                        let imageFile = fs.readFileSync(path.join(pptxPath, pptxImagesFileName));
        
                                        newSortedData.push({
                                            title: data.target,
                                            image: `data:image/png;base64,${imageFile.toString("base64")}`,
                                        });
                                    } else {
                                        resolve('Corrupted presentation file. Please try again or report it with the presentation name and your email.');
                                    }
                               } catch (err) {
                                    if (!err.message.includes(" no such file or directory, scandir")) {
    
                                        await errLogger(err);
                                        
                                        resolve('Unknow error when searching for presentations.');
                                    } else {
                                        resolve('Presentation files did not exist.');
                                    };
                               };
                            } else {
                                // resolve('Cannot get presentations. Try again later.');
                            };
                        };
        
                        newSortedData.splice(3);
        
                        resolve(newSortedData);
                    };
                } else if (type === 2) {
                    let names = [];
            
                    if (allPptxByUser.length <= 0) {
                        resolve("User doesn't have any presentations. Please create 1.");
                    } else {
                        allPptxByUser.forEach((res) => {
                            names.push(res.name.split('-')[0]); 
                        });

                        resolve(names);
                    };
                }
            };
        } catch (err) {
            await errLogger(err);

            resolve('Unknow error when searching for presentations.');
        }
    });
};