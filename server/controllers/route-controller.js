const uuid = require('uuid');
const Boom = require('boom');
const bourne = require('@hapi/bourne');
const { Queue, Worker, QueueEvents, Job } = require('bullmq');
const uuidValidate = require('uuid-validate');
const CurrencyConverter = require('currency-converter-lt');
const currencyCodes = require('currency-symbol');
const { URL } = require('url');
const sanitzePayload = require('../functions/sanitzePayload');
const { createPptx } = require('./pptx-controller');
const { pptxImage, payloadSantizer, verifyEmail } = require('../functions/index');
const { createPayment, getInfoFromPi } = require('./payment-controller');
const { createUser, findUser, updateUser, findPptx, updateAccountStatus, getPptxByName, exportPptx, hasSub, deleteSub, addPptx } = require('../db-functions/index');
const errLogger = require('../functions/errLogger');
let priceList = require('../json/prices.json');
const { isError } = require('joi');
const e = require('cors');
const { userInfo } = require('os');

'use strict';

let siteLink = 'localhost:3000';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let conConfig = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS,
};

let queuePptxName = 'queue-pptx';
let queuePptxEvent = new QueueEvents(queuePptxName, {
    connection: conConfig,
});
let queuePptx = new Queue(queuePptxName, {
    connection: conConfig,
});


let queueCreateUserName = 'queue-create-user-route';
let queueCreateUserEvent = new QueueEvents(queueCreateUserName, {
    connection: conConfig,
});
let queueCreateUser = new Queue(queueCreateUserName, {
    connection: conConfig,
});

(async () => {
    await queuePptx.drain();
    await queuePptx.clean();
    await queueCreateUser.drain();
    await queueCreateUser.clean();
})();

let quanities = priceList.map((e) => e.quanity);

let workerPptx;
let workerCreate;

try {

    workerPptx = new Worker(queuePptxName, async (job) => {
        let cleanedPayload = job.data.cleanedPayload;
        let creds = job.data.creds;

        // setTimeout(async () => {
        //     await job.moveToFailed();
        // }, 180000);
    
        await createPptx(cleanedPayload.name, creds, cleanedPayload).then(async (result) => {
    
            console.log('CALLED: 60')
            console.log(result);
    
            await delay(500);
    
            return result;
    
        }).catch(async (err) => {
            if (err.message.toString() !== 'STOPPED') {
                await errLogger(err);
    
                return err;
            };
        });
    }, {
        concurrency: 3,
        connection: conConfig,
        removeOnFail: true,
    });

    workerCreate = new Worker(queueCreateUserName, async (job) => {
        let cleanedPayload = job.data;


        await createUser({
            email: cleanedPayload.email,
            password: cleanedPayload.password,
            repeat_password: cleanedPayload.repeat_password,
            item: cleanedPayload.item_input,
            uuid: cleanedPayload.verifyId,
            ip: uuid.v4(),
        }).then(async (user) => {

            console.log(user);

            await delay(500);

            return user;

        })
        .catch(async (err) => {
            await errLogger(err);

            return err;
        });
    }, {
        concurrency: 10,
        connection: conConfig,
    });

    // queueCreateUser.process(1, async (job, done) => {
    //     let cleanedPayload = job.data;

    //     let user = await createUser({
    //         email: cleanedPayload.email,
    //         password: cleanedPayload.password,
    //         repeat_password: cleanedPayload.repeat_password,
    //         item: cleanedPayload.item_input,
    //     });

    //     done(null, user);
    // });
} catch (err) {
    errLogger(err);

    console.log('Error in queue pptx');
    console.log(err);
};

async function getHandler(req, h) {
    return new Promise(async (resolve, reject) => {
        try {

            let url = req.url.pathname;
            let cleanedParams;
            let cleanedQuery;

            if (req.params) {
                cleanedParams = await sanitzePayload(req.params);
            };

            if (req.query) {
                cleanedQuery = await sanitzePayload(req.query);
            };

            if (url.includes('/register/email-verify')) {

                let crumb = req.server.plugins.crumb.generate(req, h)

                resolve(h.view('pre_email_verify', {
                            csrf_name: 'csrf_token',
                            csrf_value: crumb,
                }));
            };

            if (!req.auth.isAuthenticated) {
                if (url === '/') {

                    let crumb = req.server.plugins.crumb.generate(req, h)
                    let csrfName = 'csrf_token';

                    resolve(h.view('index.html', {
                        csrf_name: csrfName,
                        csrf_value: crumb,
                    }));

                } else if (url === '/policies/privacy-policy') {

                    resolve(h.view('privacy_policy.html'));

                } else if (url === '/policies/terms-and-conditions') {

                    resolve(h.view('terms_and_conditions.html'));

                } else if (url === '/login') {

                    let crumb = req.server.plugins.crumb.generate(req, h);

                    resolve(h.view('login', {
                        crsf_name: 'csrf_token',
                        crsf_value: crumb,
                    }));
                    
                } else {

                    resolve(h.view('404'));

                };
            } else {

              if (req.auth.isAuthenticated) {

                

                if (Object.keys(req.auth.artifacts).length <= 0) {
                    if (url !== '/logout') {
                        resolve(h.redirect('/logout'))
                    };
                };

                //TODO: 1


                // if (url.includes('/register/email-verify')) {

                //     console.log('Right uri');

                //     let verifyId = cleanedParams.verifyId;
                //     let uuidVersionVerifyId = uuidValidate.version(verifyId.toString());
                //     let uuidVersionArtificats = uuidValidate.version(req.auth.artifacts.verifyId.toString());
                    
                //     if (verifyId === req.auth.artifacts.verifyId) {
                //         let crumb = req.server.plugins.crumb.generate(req, h);

                //         resolve(h.view('pre_email_verify.html', {
                //             csrf_name: 'csrf_token',
                //             csrf_value: crumb,
                //         }));
                //     };

                //     if (typeof uuidVersionVerifyId === 'number' && typeof uuidVersionArtificats === 'number') {

                //         console.log('Logging out');

                //         if (!uuidValidate(verifyId, uuidVersionVerifyId) && !uuidValidate(req.auth.credentials.verifyId, uuidVersionArtificats)) {

                //                 let newUUID = uuid.v4();

                //                 await req.cookieAuth.set({
                //                     id: req.auth.credentials.id,
                //                     password: req.auth.credentials.password,
                //                     verifyId: newUUID,
                //                 });

                //                 console.log('Logging out 2');

                //                 verifyId = newUUID;

                //                 resolve(h.redirect(`/register/email-verify/${newUUID}`));
                //         } else {

                //             let newUUID = uuid.v4();

                //             await req.cookieAuth.set({
                //                 id: req.auth.credentials.id,
                //                 password: req.auth.credentials.password,
                //                 verifyId: newUUID,
                //             });

                //             verifyId = newUUID;

                //             console.log('Logging out 4');

                //             resolve(h.redirect(`/register/email-verify/${newUUID}`));
                //         };
                        
                //     } else {

                //         console.log('Logging out 3');

                //         let newUUID = uuid.v4();

                //         await req.cookieAuth.set({
                //             id: req.auth.credentials.id,
                //             password: req.auth.credentials.password,
                //             verifyId: newUUID,
                //         });

                //         verifyId = newUUID;

                //         await verifyEmail(req.auth.credentials.email, encodeURI((siteLink + `/register/email-verify/${verifyId}`)))

                //         resolve(h.response().code(200));
                //     };

                //     // if ()

                //     if (typeof req.auth.credentials === 'array') {
                //         console.log(req.auth.artifacts.length)
                //     };

                //     if (verifyId === req.auth.credentials.verifyId && req.auth.credentials.verifyId === verifyId) {

                //         resolve(h.view('pre_email_verify', {
                            
                //         }))

                //     } else {
                        
                //         resolve(h.view('email-ver', {
                //             status: 'Email failed to verify. After this you will be logged out!',
                //         }));
                //     };
                // } else {
                //     let crumb = req.server.plugins.crumb.generate(req, h)
                //     let csrfName = 'csrf_token';

                //     resolve(h.view('verifyemail', {
                //         email: req.auth.credentials.email,
                //         csrf_name: csrfName,
                //         csrf_value: crumb,
                //     }));
                // };

                let userInfo = req.auth.credentials;

                if (url === '/') {

                    let crumb = req.server.plugins.crumb.generate(req, h)
                    let csrfName = 'csrf_token'; 

                    resolve(h.view('index.html', {
                        state: true,
                        csrf_name: csrfName,
                        csrf_value: crumb,
                    }));
                } else if (url === '/policies/privacy-policy') {

                    resolve(h.view('privacy_policy.html', {
                        state: true,
                    }));

                } else if (url === '/policies/terms-and-conditions') {

                    resolve(h.view('terms_and_conditions.html', {
                        state: true,
                    }));

                } else if (url === '/logout') {

                    await req.cookieAuth.clear();

                    resolve(h.redirect('/'));
                };

                if (userInfo.accountStatus === true) {
                    if (url === '/account') {
    
                        let crumb = req.server.plugins.crumb.generate(req, h)
                        let csrfName = 'csrf_token';
    
                        resolve(h.view('account', {
                            csrf_value: crumb,
                            csrf_name: csrfName,
                            pptxLeft: userInfo.pptxLeft,
                        }));
    
                    } else if (url === '/account/presentations') {
    
                        let results = await findPptx({
                            name: '/all',
                            userId: userInfo.id
                        }, 1, 'latest');
    
                        let fixedResults = results;
    
                        if (typeof results === 'string') {
                            resolve(h.view('Presentations', {
                                title: "Error while getting all your presententations.",
                            }));
                        } else {
                            resolve(h.view('Presentations', {
                                title: false,
                                presentations: fixedResults,
                            }))
                        };
                    } else if (url === '/account/help') {
    
                        resolve(h.view('help'));
    
                    } else if (url === '/account/settings') {
    
                        let crumb = req.server.plugins.crumb.generate(req, h)
                        let csrfName = 'csrf_token';
    
                        resolve(h.view('settings', {
                            csrf_value: crumb,
                            csrf_name: csrfName,
                        }));
                        
                    } else if (url === '/account/presentations/view') {
    
                        let crumb = req.server.plugins.crumb.generate(req, h)
                        let csrfName = 'csrf_token';
                        
                        if (cleanedQuery.name) {
                            let result = await getPptxByName(req.auth.artifacts, cleanedQuery.name);
    
                            if (typeof result !== 'string') {
                                resolve(resolve(h.view('pptx_view', {
                                    csrf_value: crumb,
                                    title: result.name,
                                    csrf_name: csrfName,
                                    images: bourne.safeParse(JSON.stringify(result.images)),
                                    amount: new Array(result.images.length),
                                })));
                            } else {
                                resolve(h.view('pptx_view', {
                                    csrf_value: crumb,
                                    csrf_name: csrfName,  
                                    title: 'Error while loading presentation',
                                }));
                            };
                        } else {
                            resolve(h.view('view-presentation', {
                                title: 'Error while loading presentation',
                            }));
                        };
                    } else if (url === '/payment/complete') {
                        let pi =  cleanedQuery.payment_intent.toString();
                        let pi_info = await getInfoFromPi(pi).catch(async (err) => {
                            await errLogger(err);
    
                            resolve(h.view('paid', {
                                price: (parseInt(cleanedQuery.price) / 100).toString(),
                                amount: 'Error while getting information.',
                            }));
                        });
    
                        let matches = pi_info.description.toString().match(/\d+/);
                        let number = matches ? parseInt(matches[0], 10) : null;
    
                        if (pi_info.status === 'succeeded') {
                            let addedPptx = await addPptx({
                                id: userInfo.id,
                                amount: number.toString(),
                            }).catch(async (err) => {
                                await errLogger(err);
    
                                resolve(h.view('paid', {
                                    price: cleanedQuery.toString(),
                                    amount: 'Error while trying to add presentations to your account.',
                                }));
                            });
    
                            if (typeof addedPptx === 'string') {
                                resolve(h.view('paid', {
                                    price: cleanedQuery.toString(),
                                    amount: 'Error while trying to add presentations to your account.',
                                }));
                            };
                        } else if (pi_info.status === 'requires_payment_method') {
                            resolve(h.view('paid', {
                                price: cleanedQuery.toString(),
                                amount: 'The payment has failed. Please retry.',
                            }));
                        } else {
                            resolve(h.view('paid', {
                                price: cleanedQuery.toString(),
                                amount: 'Unkown status from payment. Please wait or try again.',
                            }));
                        };
    
                        console.log(cleanedQuery);
                        console.log(pi_info);
    
                        resolve(h.view('paid', {
                            price: (pi_info.amount / 100).toFixed(2).toString(),
                            amount: number.toString(),
                        }));
                    } else if (url === '/account/get-queue/pptx') {
                        let queue = await queuePptx.getWaitingCount();
    
                        resolve(h.response(queue));
                    } else {
                        resolve(h.redirect('/account'));
                    };
                } else {

                    let crumb = req.server.plugins.crumb.generate(req, h)
                    let csrfName = 'csrf_token';

                    resolve((h.view('verifyemail', {
                        email: userInfo.email,
                        csrf_name: csrfName,
                        csrf_value: crumb,
                    })));
                };
              } else {
                resolve(h.redirect('/login'));
              };
            };
        } catch (err) {
            await errLogger(err);

            if (err.stack.split('\n')[1].includes('uuid-validate')) {
                console.log(err);
            } else {
                // TODO: Add log function to log unknown errors

                console.log(err);
            };

            console.log(err);
        };
    });
};

async function postHandler(req, h) {
    return new Promise(async (resolve, reject) =>  {
        try {
            let url = req.url.pathname;

        let cleanedPayload = await sanitzePayload(req.payload);
        let cleanedParams;
        let cleanedQuery;

        if (req.params) {
            cleanedParams = await sanitzePayload(req.params);
        };

        if (req.query) {
            cleanedQuery = await sanitzePayload(req.query);
        };

        if (!cleanedPayload instanceof Object) {
            resolve('Invalid payload');
        };

        if (url === '/report') {

            await errLogger(cleanedPayload, 'report').then((data) => {
                resolve(h.response('Sended your report'));
            }).catch(async (err) => {
                await errLogger(err);

                resolve('Unknow error');
            });
            
        } else if (url.includes('/register/email-verify')) {
            let account = await findUser(cleanedPayload, 1, {
                param: cleanedParams.verifyId,
            }).catch(async (err) => {
                await errLogger(err);

                resolve('Error while trying to log you in.');
            });

            console.log(account);

            if (account.id !== null && account.id !== undefined && typeof account !== 'string') {
                let updatedUser = await updateAccountStatus(account, 2).catch(async (err) => {
                    await errLogger(err);

                    resolve('Error while trying to log you in.');
                });

                await req.cookieAuth.set({ id: updatedUser.id, password: updatedUser.password, verifyId: updatedUser.accountStatus });

                resolve(h.response(
                    h.view('succes_verified', {
                        email: updatedUser.email,
                    })
                ));
            } else {

                resolve('Error while trying to log you in.');
            };
        } else if (req.auth.isAuthenticated === true) {
    
                if (req.auth.artifacts.verifyId !== true) {
                    if (url === '/register/resend') {
                        let user = await findUser(req.auth.artifacts, 2);
    
                        console.log(user);
    
                        if (typeof user === 'string') {
                            resolve(h.response('Please make a account first or try again later.'));
                        } else {
                            let verifyId = uuid.v4();
    
                            await verifyEmail(user.email, encodeURI((siteLink + `/register/email-verify/${verifyId}`)));
        
                            await req.cookieAuth.set({
                                id: req.auth.artifacts.id,
                                password: req.auth.artifacts.password,
                                verifyId: verifyId,
                            });
        
                            resolve(h.response('succes'));
                        };
                    };
                };
    
                if (url === '/account/update') {
                    let id = req.auth.artifacts.id;
    
                    let account = await updateUser({
                        id: id,
                        oldPassword: cleanedPayload.old_password,
                        newPassword: cleanedPayload.new_password,
                    }, 2);
    
                    if (typeof account !== 'string') {
                        await req.cookieAuth.clear();
    
                        req.cookieAuth.set({ id: account.id, password: account.password, verifyId: account.accountStatus, });
    
                        resolve(h.response('Succesfully updated password.'));
                    } else {
                        resolve(h.response('Error trying to update your password.').code(403));
                    }
                } else if (url === '/payment/client-secret') {
                    let amount = Math.round(parseInt(cleanedPayload.amount));
                    let closestNumber = quanities.reduce((closest, current) => {
                        return Math.abs(current - amount) < Math.abs(closest - amount) ? current : closest;
                    });
                    let pricePerPres;
                    let info;
    
                    priceList.forEach((price) => {
                        if (parseInt(price.quanity) === parseInt(closestNumber)) {
                            pricePerPres = parseFloat(price.pricePerPres);
                            info = price;
                            return;
                        };
                    });
    
                    let totalPrice = (parseFloat(amount) * parseFloat(pricePerPres)).toFixed(2);

                    if (parseInt(info.discount) > 0) {
                        totalPrice = (totalPrice - (totalPrice * (parseInt(info.discount) / 100))).toFixed(2);   
                    };

                    let preUpperedCurrency = cleanedPayload.currency.toString().toUpperCase();
    
                    if (cleanedPayload.currency.toString().toLowerCase() === 'not_supported') {
                        preUpperedCurrency = 'USD';
                    };
    
                    let fromCurrency = 'USD';
                    let currencySymbol = currencyCodes.symbol(preUpperedCurrency.toString());
                    let changedToCurrency = await new CurrencyConverter({
                        from: fromCurrency,
                        to: preUpperedCurrency,
                    }).convert(parseFloat(totalPrice));
    
                    if (fromCurrency === preUpperedCurrency) {
                        changedToCurrency = parseFloat(parseFloat(changedToCurrency) * 100)
                    };
    
                    let pi;
    
                    if (cleanedPayload.currency.toString().toLowerCase() === 'not_supported') {
                        pi = await createPayment(parseFloat(changedToCurrency.toFixed(2)), cleanedPayload.amount, cleanedParams.currency.toString().toLowerCase()).catch(async (err) => {
                            await errLogger(err);
        
                            resolve(h.response('Error while setting up payment.'));
                        });
                    } else {
                        pi = await createPayment(parseFloat(changedToCurrency.toFixed(2)), cleanedPayload.amount, preUpperedCurrency).catch(async (err) => {
                            await errLogger(err);
        
                            resolve(h.response('Error while setting up payment.'));
                        });
                    };
    
                    if (fromCurrency !== preUpperedCurrency) {
                        changedToCurrency = parseFloat(parseFloat(changedToCurrency) / 100);
                    } else if (fromCurrency === preUpperedCurrency) {
                        changedToCurrency = parseFloat(parseFloat(changedToCurrency) / 100);
                    };
    
                    resolve(h.view('second_pay', {
                        button_name: (`Pay ${String.fromCharCode(parseInt(currencySymbol.substring(2), 10))}` + changedToCurrency.toFixed(2).toString()).toString(),
                        client_secret: pi.toString(),
                    }));
                } else if (url === '/account/presentation') {
    
                    console.log(cleanedPayload);
    
                    if (typeof cleanedPayload === 'string') {
    
                        resolve(h.response('Invalid request. Try again later.').code(403));
    
                    } else if (parseInt(cleanedPayload.max_slides) > 20) {
    
                        resolve(h.response('You can only have max slides up to 20 slides not higher than 20.').code(403));
    
                    } else if (parseInt(cleanedPayload.max_slides) <= 0) {
    
                        resolve(h.response('You need to have more then 1 slide in your presentation.').code(403));
    
                    } else if (cleanedPayload.name.toString().toLowerCase() === '/all') {
    
                        resolve(h.response("Don't use /all as topic").code(403));
    
                    } else if (cleanedPayload.name.toString().includes('"') || cleanedPayload.name.toString().includes('-')) {
    
                        resolve(h.response('Do not use " or - in the presentation topic.').code(403));
                        
                    } else {
                        let customUUID = (req.auth.artifacts.id.toString() + uuid.v4().toString()).toString();

                        if (parseInt(req.auth.credentials.pptxLeft) > 0) {
                            let resultJob = await queuePptx.add('queue-pptx', {
                                cleanedPayload: cleanedPayload,
                                creds: req.auth.credentials,
                            }, {
                                jobId: customUUID.toString(),
                                removeOnComplete: true,
                                attempts: 3,
                            });
        
                            queuePptxEvent.on('completed', async ({ jobId }) => {
                                if (customUUID.toString() === jobId.toString()) {
                                    resolve(h.response('created_pres'));
                                };
                            });
                        } else {
                            resolve(h.response('not_enough'));
                        };
                    };
    
                    // if (typeof finised !== "string") {
                    //     let url = new URL(req.url.href);
    
                    //     let mainUrl = encodeURI(url.origin + `/account/presentations/view?name=${finised.name.split('-')[0]}`);
    
                    //     console.log(mainUrl);
    
                    //     req.raw.res.end();
    
                    //     resolve(h.response(mainUrl));
                    // }  else {
                    //     console.log(finised)
                    //     await errLogger(finised);
    
                    //     resolve(h.response('Error while trying to create presentation.'));
                    // };
    
                    // await createPptx(cleanedPayload.name, req.auth.artifacts, cleanedPayload).then((data) => {
                    //     let url = new URL(req.url.href);
    
                    //     let mainUrl = encodeURI(url.origin + `/account/presentations/view?name=${data.name.split('-')[0]}`);
    
                    //     console.log(mainUrl);
    
                    //     resolve(h.response(mainUrl));
    
                    // }).catch(async (err) => {
                    //         // let error = Boom.badRequest(err);
    
                    //         resolve(h.response('Error while trying to create presentation.'));
                    // });
    
                    // let result = await queuePptx.add(cleanedPayload).((data) => {
                    //     if (data.toString().toLowerCase().includes('error')) {
                    //         let error = Boom.badRequest(result);
    
                    //         resolve(h.response(error));
                    //     } else {
                    //         let url = new URL(req.url.href);
                    //         let mainUrl = encodeURI(url.origin + `/account/presentations/view?name=${data.name.split('-')[0]}`);
        
                    //         console.log(mainUrl);
        
                    //         resolve(h.response(mainUrl));
                    //     }
                    // })
    
                    // if (typeof result !== 'string') {
                    //     let url = new URL(req.url.href);
                    //     let mainUrl = encodeURI(url.origin + `/account/presentations/view?name=${result.name.split('-')[0]}`);
    
                    //     console.log(mainUrl);
    
                    //     resolve(h.response(mainUrl));
                    // } else {
                    //     let error = Boom.badRequest(result);
    
                    //     resolve(h.response(error));
                    // };
                } else if (url === '/account/presentations/search') {
    
                    let result = await findPptx({
                        name: cleanedPayload.name,
                        id: req.auth.artifacts.id,
                    }, 1);
    
                    if (typeof result !== 'string') {
                        resolve(result);
                    } else {
                        if (result.toString().toLowerCase() === '/all') {
                            resolve(h.redirect('/account/presentations'))
                        } else {
                            resolve('Cannot get presentations. Try again later.');
                        };
                    };
                } else if (url === '/account/presentations/export') {
                    let result = await exportPptx(req.auth.artifacts, cleanedPayload.name, cleanedPayload.type);
    
                    console.log('732');
    
                    if (typeof result !== 'string') {
    
                        if (cleanedPayload.type === 'image') {
    
                            resolve(result);
                        } else {
                            resolve(result);
                        };
                    } else {
                        resolve('Cannot get presentations file. Try again later.');
                    };
                } else if (url === '/account/presentations/filter') {
    
                    await findPptx({
                        name: '/all',
                        userId: req.auth.artifacts.id
                    }, 1, cleanedPayload.value).then((res) => {
                        if (typeof res === 'string') {
                            resolve(h.response(res.toString()).code(404));
                        } else {
                            if (isError(res)) {
                                resolve(h.response(res).code(200));
                            } else {
                                resolve(h.response(res).code(200));
                            };
                        };
                    }).catch(async (err) => {
                        await errLogger(err);
    
                        resolve(h.response('Unknow error while sorting presentations.').code(404));
                    });
    
                } else if (url === '/account/price/calculate') {
                    let amount = Math.round(parseInt(cleanedPayload.amount));
                    let closestNumber = quanities.reduce((closest, current) => {
                        return Math.abs(current - amount) < Math.abs(closest - amount) ? current : closest;
                    });
                    let pricePerPres;
                    let info;
    
                    priceList.forEach((price) => {
                        if (parseInt(price.quanity) === parseInt(closestNumber)) {
                            pricePerPres = parseFloat(price.pricePerPres);
                            info = price;
                            return;
                        };
                    });
    
                    let totalPrice = (parseFloat(amount) * parseFloat(pricePerPres)).toFixed(2);
                    let previousPrice = totalPrice;

                    if (parseInt(info.discount) > 0) {
                        totalPrice = (totalPrice - (totalPrice * (parseInt(info.discount) / 100))).toFixed(2);   
                    };

                    let preUpperedCurrency = cleanedPayload.currency.toString().toUpperCase();
    
                    if (cleanedPayload.currency.toString().toLowerCase() === 'not_supported') {
                        preUpperedCurrency = 'USD';
                    };
    
                    let fromCurrency = 'USD';
                    let currencySymbol = currencyCodes.symbol(preUpperedCurrency);
                    let changedToCurrency = await new CurrencyConverter({
                        from: fromCurrency,
                        to: preUpperedCurrency,
                    }).convert(parseFloat(totalPrice));

                    let changedToCurrencyPrevious = await new CurrencyConverter({
                        from: fromCurrency,
                        to: preUpperedCurrency,
                    }).convert(parseFloat(previousPrice));
    
                    if (fromCurrency !== preUpperedCurrency) {
                        changedToCurrency = parseFloat(parseFloat(changedToCurrency) / 100)
                        changedToCurrencyPrevious = parseFloat(parseFloat(changedToCurrencyPrevious) / 100)
                    };
    
                    if (parseInt(info.discount) > 0) {
                        resolve(h.response(`${String.fromCharCode(parseInt(currencySymbol.substring(2), 10))}${changedToCurrencyPrevious.toFixed(2).toString()} - ${info.discount.toString()}% = ${String.fromCharCode(parseInt(currencySymbol.substring(2), 10))}${changedToCurrency.toFixed(2).toString()}`));  
                    } else {
                        resolve(h.response(`${String.fromCharCode(parseInt(currencySymbol.substring(2), 10))}${changedToCurrency.toFixed(2).toString()}`));
                    };
                }
                 else {
                    resolve(h.redirect('/account'));
                };
            } else {
                if (url === '/login') {
    
                    console.log('622');
            
                    let account = await findUser(cleanedPayload, 1).catch(async (err) => {
                        await errLogger(err);
    
                        resolve('Error while trying to log you in.');
                    });
    
                    console.log(account);
        
                    if (account.id !== null && account.password !== undefined && typeof account !== 'string') {
    
                        if (account.accountStatus === true) {
                            await req.cookieAuth.set({ id: account.id, password: account.password, verifyId: account.accountStatus });
    
                            resolve(h.redirect('/account'));
                        } else {
    
                            let crumb = req.server.plugins.crumb.generate(req, h)
                            let csrfName = 'csrf_token';    
    
                            console.log('638')
    
                            let verifyId = uuid.v4();
    
                            await req.cookieAuth.set({ id: account.id, password: account.password, verifyId: verifyId });
    
                            await verifyEmail(cleanedPayload.email, encodeURI((siteLink + `/register/email-verify/${verifyId}`)))
    
                            resolve(h.view('verifyemail', {
                                email: cleanedPayload.email,
                                csrf_name: csrfName,
                                csrf_value: crumb,
                            }));
                        };
                    } else {
    
                        resolve('Error while trying to log you in.');
                    };
                } else if (url === '/register') {
    
                    console.log(cleanedPayload);

                    let verifyId = uuid.v4();
    
                    if (cleanedPayload.email && cleanedPayload.password && cleanedPayload.repeat_password && cleanedPayload.item_input) {
    
                        let customUUID = uuid.v4().toString();
                        let ip = req.headers['x-forwarded-for'] || req.info._remoteAddress;
                        let account = await queueCreateUser.add(queueCreateUserName, {...cleanedPayload, verifyId, ip}, {
                            jobId: customUUID.toString(),
                            attempts: 3,
                        });
    
                        queueCreateUserEvent.on('completed', async ({ jobId })  => {
    
                            if (customUUID.toString() === jobId.toString()) {
                                let user = await findUser(cleanedPayload, 1).catch(async (err) => {
                                    await errLogger(err);
            
                                    resolve('Error while trying to log you in.');
                                });
                
                                if (typeof user === 'string') {
                
                                    resolve(h.redirect('/register'));
                
                                } else {
    
                                    let crumb = req.server.plugins.crumb.generate(req, h)
                                    let csrfName = 'csrf_token';
                            
                                    await req.cookieAuth.set({
                                        id: user.id,
                                        password: user.password,
                                        verifyId: verifyId,
                                    });
            
                                    await verifyEmail(cleanedPayload.email, encodeURI((siteLink + `/register/email-verify/${verifyId}`)))
            
                                    resolve(h.response(h.view('verifyemail', {
                                        email: cleanedPayload.email,
                                        csrf_name: csrfName,
                                        csrf_value: crumb,
                                    })));
                                };
                            };
                        });
                    } else {
                        resolve(h.redirect('/register'));
                    };
                } else {
                    resolve(h.redirect('/register'));
                };
            };
        } catch (err) {
            console.log('Error Post Route Controller: ', err);

            await errLogger(err);
        };
    });
};

module.exports = {
    getHandler,
    postHandler,
}