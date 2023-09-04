const stringSimilarity = require('string-similarity');
const { Stripe } = require('stripe');
const db = require('../db-functions');
const errLogger = require('../functions/errLogger');
const currencyPm = require('../json/currency_pm.json');

require('dotenv').config({
    path: './.env',
});

const stripe = new Stripe(process.env.STRIPE_KEY);

async function createCustomer(email) {
    return new Promise(async (resolve, reject) => {
        try {
            if (email) {
                let customer = await stripe.customers.create({
                    email: email,
                });
    
                if (customer) {
                    resolve(customer);
                } else {
                    resolve("Couldn't create user.");
                };
            } else {
                resolve('Invalid email or password.');
            };
        } catch (err) {
            await errLogger(err);

            resolve('Failed to create user.');
        };
    });
};

async function addInfoToCustomer(customerInfo, info) {
    let customer;
    let isCustomer = await stripe.customers.list({
        email: customerInfo.email,
    });

    if (isCustomer.data.length > 0) {
        customer = isCustomer.data[0];
    } else {
        console.log('Not a customer.');
    };

    stripe.paymentMethods.attach(customerInfo.pm_id, {
        customer: customer.id,
    });
};

async function createPayment(price, amount, currency) {
    return new Promise(async (resolve, reject) => {
        try {

            if (currency === 'not_supported') {
                let pi = await stripe.paymentIntents.create({
                    currency: 'USD',
                    amount: price,
                    payment_method_types: [
                        "card",
                        "paypal",
                    ],
                    description: `This is for ${amount.toString()} Presentations`,
                }).catch(async (err) => {
                    await errLogger(err);
    
                    resolve('Error while creating payment intent.');
                });
    
                resolve(pi.client_secret);
            } else {
                if (currencyPm[currency.toLowerCase().toString()]) {
                    let pi = await stripe.paymentIntents.create({
                        currency: currency.toLowerCase().toString(),
                        amount: price,
                        payment_method_types: currencyPm[currency.toLowerCase().toString()],
                        description: `This is for ${amount.toString()} Presentations`,
                    }).catch(async (err) => {
                        await errLogger(err);
        
                        resolve('Error while creating payment intent.');
                    });
        
                    resolve(pi.client_secret);
                } else {
                    resolve('Unknown currency.');
                };
            };
        } catch (err) {
            await errLogger(err);

            resolve('Error while creating payment intent.');
        };
    });
};

async function getInfoFromPi(pi) {
    return new Promise(async(resolve, reject) => {
        try {
            let info = await stripe.paymentIntents.retrieve(pi.toString()).catch(async (err) => {
                await errLogger(err);

                resolve('Error while getting payment intent.');
            });

            resolve(info);
        } catch (err) {
            await errLogger(err);

           resolve('Error while getting payment intent.'); 
        };
    });
};

// async function createPaymentIntent(productName, email, pm) {
//     return new Promise(async function(resolve, reject) {
//         try {
//             let products = await stripe.products.list({
//                 active: true,
//             });
//             let productNames = [];
        
//             for (let pr of products.data) {
//                 productNames.push(pr.name);
//             };
        
//             let bestName = stringSimilarity.findBestMatch(productName.toString(), productNames);
//             let productInfo = await stripe.products.search({
//                 query: `name:\'${bestName.bestMatch.target}\'`
//             });
        
//             if (productInfo.data.length > 0) {
//                 let prInfo = productInfo.data[0];
//                 let prPrice = await stripe.prices.retrieve(prInfo.default_price);
        
//                 if (prPrice) {
//                     if (typeof parseInt(prPrice.unit_amount) === 'number') {
    
//                         let cus_id = await stripe.customers.list({
//                             email: email,
//                         }).then((data) => data.data[0].id);
    
//                         console.log(pm)
                        
//                         let paymentIntent = await stripe.paymentIntents.create({
//                             customer: cus_id,
//                             amount: parseInt(prPrice.unit_amount),
//                             currency: 'usd',
//                             payment_method_types: [pm.toString(), 'card'],
//                             payment_method_options: {
//                                 [pm.toString()]: {
//                                     setup_future_usage: 'on_session'
//                                 },
//                                 card: {
//                                     setup_future_usage: 'on_session',  
//                                 },
//                             },
//                             // automatic_payment_methods: {
//                             //     enabled: true,
//                             // },
//                         });
    
    
//                         resolve(paymentIntent.client_secret);
//                     } else {
//                         resolve('Invalid price.');
//                     };
//                 } else {
//                     resolve('Invalid product.');
//                 };
//             } else {
//                 resolve('Invalid product.');
//             };
//         } catch (err) {
//             if (err.raw.message.includes('and your Stripe account is in')) {
//                 resolve('You cannot use this payment method in your country.');
//             } else if (err.raw.message.includes('payment_method_options')) {
//                 resolve(`Invalid payment method.`);
//             } else {
//                 await errLogger(err);
//             };

//             resolve('Error while creatign payment intent.');
//         };
//     });
// };

// async function pi_update(clientSecret) {
//     return new Promise(async function(resolve, reject) {
//         let pi = await stripe.paymentIntents.retrieve(clientSecret);

//         resolve(pi.status);
//     });
// };

// async function pi_succes(pi) {
//     return new Promise(async function(resolve, reject) {
//         let w = await stripe.paymentIntents.retrieve(pi);

//         if (w.status === 'succeeded') {
//             resolve(true);
//         } else if (w.status === 'canceled') {
//             resolve(false);
//         } else {
//             resolve(w.status);
//         };
//     });
// };

// async function createSubcription(collectionMethod, extra, userData) {
//     return new Promise(async function(resolve, reject) {
//         try {
//             let products = await stripe.products.list({
//                 active: true,
//             });
//             let prices = [];

//             for await (let data of products.data) {
//                 let price = await stripe.prices.retrieve(data.default_price);

//                 prices.push(price);
//             };

//             let cor_price;
//             let days;
    
//             prices.map((price) => {
//                 if (price.nickname !== null) {
//                     if (parseInt(price.unit_amount) === parseInt(extra.amount)) {
    
//                         cor_price = price;
    
//                         return;
                        
//                     };
//                 };
//             });

//             let bestM = stringSimilarity.findBestMatch(cor_price.nickname, [
//                 'month',
//                 'year',
//             ]);

//             if (bestM.bestMatch.target === 'month') {
//                 days = 30;
//             } else if (bestM.bestMatch.target === 'year') {
//                 days = 364;
//             };
    
//             if (cor_price) {
    
//                 let pm = extra.payment_method;
//                 let pm_id = await stripe.paymentMethods.attach(pm, {
//                     customer: extra.customer,
//                 });
    
//                 let sub =  await stripe.subscriptions.create({
//                     customer: extra.customer,
//                     items: [
//                         {
//                             price: cor_price.id,
//                         },
//                     ],
//                     collection_method: 'send_invoice',
//                     days_until_due: days,
//                     default_payment_method: pm_id.id,
                    
//                 });

//                 resolve(sub);
//             } else {
//                 resolve("Product doesn't exist");
//             };
//         } catch (err) {
//             await errLogger(err);

//             resolve('Error while creating subcription.');
//         };
//     });
// };

// async function findCustomerFromId(cus_id) {
//     return await stripe.customers.retrieve(cus_id);
// };

// async function userNeedsToPay(invoice) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let sub = await stripe.subscriptions.retrieve(invoice.subscription);
//             let user = await stripe.customers.retrieve(sub.customer);
    
//             resolve(user.email);
//         } catch (err) {
//             await errLogger(err);

//             resolve('Error while doing something.');
//         };
//     });
// };

// async function deleteSubcription(email, sub) {
//     return new Promise(async (resolve, reject) => {
//         try {

//             email = email;

//             if (sub) {
//                 email = await stripe.customers.retrieve(sub.customer.toString()).then((data) => data.email);
//             };

//             let cus_id = await stripe.customers.list({
//                 email: email.toString(),
//             }).then((data) => data.data[0].id);
    
//             let sub_id = await stripe.subscriptions.list({
//                 customer: cus_id.toString(),
//             }).then((data) => data.data[0].id);
    
//             let result = await stripe.subscriptions.del(sub_id);

//             resolve(true);
//         } catch (err) {
//             await errLogger(err);
    
//             resolve('Error while trying to delete your subscription.');
//         };
//     });
// };

// async function hasSubcription(sub) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let cusEmail = await stripe.customers.retrieve(sub.customer).then((data) => data.email);

//             if (cusEmail) {
//                 let hasSubs = await db.hasSub(false, cusEmail.toString());

//                 if (hasSubs.hasSubscription === true || hasSubs.hasSubscription === 'true') {
//                     resolve(true);
//                 } else if (hasSubs.hasSubscription.tostring() === 'waiting') {
//                     resolve('waiting');
//                 } else {
//                     resolve(false);
//                 }; 
//             } else {
//                 resolve('No user email provided.');
//             };
//         } catch (err) {
//             await errLogger(err);
            
//             resolve('Error while trying to check if customer has subscription.');
//         };
//     });
// };

// // async function updatesub() {

// }

// (async () => {
//     let t = await stripe.subscriptions.list({
//         customer: wef
//     })

//     t.data[0].plan.nickname
// })();

module.exports = {
    createCustomer,
    addInfoToCustomer,
    createPayment,
    getInfoFromPi,
};