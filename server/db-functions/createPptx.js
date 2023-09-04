const uuid = require('uuid');
const { PrismaClient } = require('@prisma/client');
const errLogger = require('../functions/errLogger');

const prisma = new PrismaClient();

module.exports = async function createPptx (info) {
    return new Promise(async (resolve, reject) => {
        try {

            let name;
        
            let notClone = await prisma.pptx.findUnique({
                where: {
                    id: info.id,
                },
            });
    
            let allPptxByUser = await prisma.pptx.findMany({
                where: {
                    userId: info.userId,
                },
            });
            
            let names = [];
    
            allPptxByUser.forEach((res) => {
                names.push(res.name.split('-')[0]); 
            });
    
            if (names.includes(info.name.split('-')[0])) {
                let filteredNames = names.map((e) => {
                    if (e.includes(info.name.split('-')[0])) {
                        return e;
                    };
                });
    
                let sortedNames = filteredNames.sort((a, b) => {
    
                    const aMatch = a.match(/\d+$/);
                    const bMatch = b.match(/\d+$/);
    
                    const aNum = aMatch ? parseInt(aMatch[0]) : 0;
                    const bNum = bMatch ? parseInt(bMatch[0]) : 0;
    
                    return aNum - bNum;
                }).filter(e => e);
    
                let highest = sortedNames.reverse()[0];
    
                if (/\d+$/.test(highest)) {
                    let numMatch = highest.match(/(\d+)$/)
                    if (numMatch) {
                        let num = parseInt(numMatch[1]);
    
                        name = (info.name.split('-')[0] + ' ' + (num + 1).toString() + `-${info.id}`);
                    }
                } else {
                    name = info.name + ' ' + '1' +  `-${info.id}`;
                };
            } else {
                name = info.name + `-${info.id}`;
            };
    
            let exists;
        
            if (!notClone) {
                try {
                    exists = await prisma.pptx.create({
                        data: {
                            id: info.id,
                            userId: info.userId,
                            name: name,
                            path: info.path,
                            dateCreated: new Date(),
                        },
                    });
                    
                    if (exists) {
                        resolve(exists);
                    } else {
                        resolve('Failed to create presentation.');
                    };
                } catch (err) {
    
                    if (err.message.includes('Pptx_path_key')) {
                        let newId = uuid.v4();
    
                        exists = await prisma.pptx.create({
                            data: {
                                id: newId,
                                userId: info.userId,
                                name: name,
                                path: info.path,
                                dateCreated: new Date(),
                            },
                        });
                
                        if (exists) {
                            resolve(exists);
                        } else {
                            resolve('Failed to create presentation.');
                        };
                    };
                };
            } else {
               try {
    
                let newId = uuid.v4();
    
                exists = await prisma.pptx.create({
                    data: {
                        id: newId,
                        userId: info.userId,
                        name: name,
                        path: info.path,
                        dateCreated: new Date(),
                    },
                });
        
                if (exists) {
                    resolve(exists);
                } else {
                    resolve('Failed to create presentation.');
                };
               } catch (err) {
                if (err.message.includes('Pptx_path_key')) {
    
                    let newId = uuid.v4();
    
                    exists = await prisma.pptx.create({
                        data: {
                            id: newId,
                            userId: info.userId,
                            name: name,
                            path: info.path,
                            dateCreated: new Date(),
                        },
                    });
            
                    if (exists) {
                        resolve(exists);
                    } else {
                        resolve('Failed to create presentation.');
                    };
                };
               };
            };
        } catch (err) {
            await errLogger(err);

            resolve('Failed to create presentation.');
        };
    });
};