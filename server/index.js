// require('sucrase/register');
const fs = require('fs');
const hapi = require('@hapi/hapi');
const Boom = require('boom');
const cors = require('cors');
const joi = require('joi');
const path = require('path');
const handlebars = require('handlebars');
const handlebarsHelpers = require('handlebars-helpers');
const { Stripe } = require('stripe');
const { routeHandler } = require('./controllers/index');
const { findUser } = require('./db-functions/index');
const { webhookHandler } = require('./functions/index');
const errLogger = require('./functions/errLogger');
// const { giveBlacklist, checkBlacklist } = require('./functions/rate_handler');

const stripe = new Stripe(process.env.STRIPE_KEY);

require('dotenv').config();

'use strict';

handlebars.registerHelper('ifeq', function (a, b, options) {
  if (a == b) { return options.fn(this); }
  return options.inverse(this);
});

handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
});

handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

const server = hapi.server({
  port: 3000,
  host: 'localhost',
  routes: {
    cors: true,
    security: true,
    // files: {
    //   relativeTo: path.join(__dirname, 'public'),
    // },
  },
  router: {
    stripTrailingSlash: true,
  },
  query: {
    parser: (query) => require('qs').parse(query),
  },
  state: {
    isSameSite: 'Lax',
  },
});

let notRedirectOpt = {
  auth: {
    mode: 'try',
  },
  plugins: {
    cookie: {
      redirectTo: false,
    },
    crumb: false,
  },
  // preHandler: ((req, h) => {
  //   let hash = req.url.hash;

  //   if (!hash) {
  //     return h.redirect('/account');
  //   } else if (hash.toString() === '#sec-db04') {
  //     return h.continue;
  //   };
  // }),
};

server.validator(joi);

process.on('unhandledRejection', async (err) => {

  await errLogger(err);

  console.log(err.message);
});

// server.ext('onPostResponse', (req, h) => {
//   console.log(req.headers);
// });


server.ext('onPreHandler', async (req, h) => {

  h.response().header('X-XSS-Protection', '1; mode=block');
  h.response().header('Cache-Control', 'no-cache');

  return h.continue;
});

const init = async () => {
  try {
     // await server.register([require('@hapi/scooter'), {
    //     plugin: require('blankie'),
    //     options: {
    //       // defaultSrc: ["'none'"],
    //       // scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://m.stripe.network"],
    //       // styleSrc: ["'self'", "'unsafe-inline'", "https://*.stripe.com", "https://m.stripe.network"],
    //       // imgSrc: ["'self'", "'data:'", "https://*.stripe.com"],
    //       // fontSrc: ["'self'"],
    //       // objectSrc: ["'none'"],
    //       // mediaSrc: ["'self'"],
    //       // frameSrc: ["'self'", "https://js.stripe.com"],
    //       frameSrc: ["https://js.stripe.com"],
    //       connectSrc: ["'self'", "https://api.stripe.com"],
    //       scriptSrc: ["'self'", "'nonce-2d9107658b0446b28b64b73e0e67816'"]
    //     },
    //   }],
    // );

    server.app.routeDefaults = {
      security: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["*", '*.stripe.com', '*.stripe.network'],
            scriptSrc: ["'self'", "'unsafe-inline'", "'sha256-36de244e889f8400e7a65e2ebe75b5c75ee45c4c70d6d7eb3992e5f0070041a1'", 'https://*.stripe.com', 'https://m.stripe.network'],
            styleSrc: ["'self'", "'unsafe-inline'", "'sha256-731113486bfd51915dec9d1d9955168bf9bb99e4a3ef90b12f218b8f468b4504'", 'https://*.stripe.com', 'https://m.stripe.network'],
            imageSrc: ["'self'", 'https://*.stripe.com'],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["https://js.stripe.com"],
            connectSrc: ["'self'", "https://api.stripe.com"],
          }
        }
      }
    };

  await server.register(    
    {
      plugin: require('hapi-rate-limit'),
      options: {
        userLimit: 100,
        userCache: {
          expiresIn: 60 * 1000,
        },
        headers: false,
        authLimit: 5,
        limitExceededResponse: async (req, h) => { 
            
          try {
            let exists = fs.existsSync('./bad_ips.txt');
          
            if (exists) {
              let data = fs.readFileSync('./bad_ips.txt', 'utf-8');
          
              if (!data.toString().includes(req.info.remoteAddress.toString())) {

                data = data.toString() + (req.info.remoteAddress.toString() + '\n').toString();
              } else {

                return Boom.tooManyRequests('Too many request please try again in 1 minute');
              };
          
              fs.writeFileSync('./bad_ips.txt', data, 'utf-8');
            } else {
              let data = (req.info.remoteAddress.toString() + '\n').toString();

              fs.writeFileSync('./bad_ips.txt', data, 'utf-8');
            };
          
              return Boom.tooManyRequests('Too many request please try again in 1 minute');
          
          } catch (err) {
            if (!err.message.toString().includes('Debug: ')) {
              console.log(err);
          
              await errLogger(err);

              return Boom.tooManyRequests('Too many request please try again in 1 minute');
            };
          };
        },
      },
    },
  );

  await server.register({
    plugin: require('@hapi/crumb'),
    options: {
      key: process.env.CRUMB_PASSWORD,
      restful: true,
      autoGenerate: false,
      cookieOptions: {
        isSecure: false,
        isSameSite: 'Lax',
      },
      // errFunction: (err) => {
      //   throw Boom.badRequest('CSRF token is missing or invalid');
      // },
    },
  });

  await server.register(require('@hapi/cookie'));
  await server.register(require('@hapi/vision'));
  await server.register(require('@hapi/inert'));

  server.auth.strategy('session', 'cookie', {
    cookie: {
      name: 'session',
      password: process.env.SESSION_PASSWORD,
      isSecure: false,
      clearInvalid: true,
      isSameSite: 'Lax',
      ttl: 30 * 24 * 60 * 60 * 1000,
      strictHeader: true,
    },
    redirectTo: '/login',
    validate: async (req, ses) => {

      let account = await findUser({
        id: ses.id,
        password: ses.password,
      }, 2);

      if (typeof account === 'string') {
        return { isValid: false };
      };

      return {
        isValid: true,
        credentials: account,
      };
    },
  });

  server.auth.default({
    strategy: 'session', 
    mode: 'try',
  });
    
  server.views({
    engines: {
      html: handlebars,
    },
    relativeTo: __dirname,
    path: path.join(__dirname, 'views'),
  });

  server.route([
    {
      method: 'GET',
      path: '/',
      // options: notRedirectOpt,
      handler: routeHandler.getHandler,
    },
    {
      method: 'GET',
      path: '/policies/privacy-policy',
      // options: notRedirectOpt,
      handler: routeHandler.getHandler,
    },
    {
      method: 'GET',
      path: '/policies/terms-and-conditions',
      // options: notRedirectOpt,
      handler: routeHandler.getHandler,
    },
    {
      method: 'GET',
      path: '/login',
      options: {
        auth: {
          mode: 'try',
        },
        plugins: {
          cookie: {
            redirectTo: false,
          },
          crumb: {
            key: process.env.CRUMB_PASSWORD,
            source: 'payload',
            // restful: true,
          },
        },
      },
      handler: routeHandler.getHandler,
    },
    {
      method: 'POST',
      path: '/login',
      options: {
        auth: {
          mode: 'try',
        },
        plugins: {
          cookie: {
            redirectTo: false,
          },
          crumb: true,
        },
      },
      handler: routeHandler.postHandler,
    },
    {
      method: 'POST',
      path: '/register',
      options: {
        auth: {
          mode: 'try',
        },
        plugins: {
          cookie: {
            redirectTo: false,
          },
          crumb: true,
        },
      },
      handler: routeHandler.postHandler,
    },
    {
      method: 'GET',
      path: `/register/email-verify/{verifyId}`,
      handler:  routeHandler.getHandler,
    },
    {
      method: 'POST',
      path: `/register/email-verify/{verifyId}`,
      handler:  routeHandler.postHandler,
    },
    {
      method: 'GET',
      path: '/account/get-queue/pptx',
      options: {
        plugins: {
          crumb: false,
        },
      },
      handler: routeHandler.getHandler,
    },
    {
      method: 'POST',
      path: `/register/resend`,
      handler: routeHandler.postHandler,
    },
    // {
    //   method: 'POST',
    //   path: `/account/payment/delete`,
    //   handler: routeHandler.postHandler,
    // },
    // {
    //   method: 'GET',
    //   path: '/payment',
    //   handler: (async (req, h) => {
    //     return h.redirect('/#sec-db04');
    //   }),
    // },
    // {
    //   method: 'GET',
    //   path: '/payment/basic',
    //   handler: routeHandler.getHandler,
    // },
    // {
    //   method: 'GET',
    //   path: '/payment/advanced',
    //   handler: routeHandler.getHandler,
    // },
    // {
    //   method: 'GET',
    //   path: '/payment/premium',
    //   handler: routeHandler.getHandler,
    // },
    {
      method: 'GET',
      path: '/payment/complete',
      handler: routeHandler.getHandler,
    },
    {
      method: 'GET',
      path: '/account/settings',
      handler: routeHandler.getHandler,
    },
    {
      method: 'GET',
      path: '/account/help',
      handler: routeHandler.getHandler,
    },
    {
      method: 'GET',
      path: '/account',
      // options: {
      //   plugins: {
      //     crumb: {
      //       key: process.env.CRUMB_PASSWORD,
      //       source: 'payload',
      //       // restful: true,
      //     },
      //   },
      // },
      handler: routeHandler.getHandler,
    },
    {
      method: 'POST',
      path: '/account/update',
      handler: routeHandler.postHandler,
    },

    {
      method: 'POST',
      path: '/account/presentation',
      handler: routeHandler.postHandler,
    },
    {
      method: 'GET',
      path: '/account/presentations',
      handler: routeHandler.getHandler,
    },
    {
      method: 'GET',
      path: '/account/presentations/view',
      handler: routeHandler.getHandler,
    },
    {
      method: 'POST',
      path: '/account/presentations/search',
      handler: routeHandler.postHandler,
    },
    {
      method: 'POST',
      path: '/account/presentations/export',
      handler: routeHandler.postHandler,
    },
    {
      method: 'POST',
      path: '/account/price/calculate',
      options: {
        plugins: {
          crumb: false,
        },
      },
      handler: routeHandler.postHandler,
    },
    {
      method: 'POST',
      path: '/account/presentations/filter',
      options: {
        plugins: {
          crumb: false,
        },
      },
      handler: routeHandler.postHandler,
    },
    {
      method: 'POST',
      path: '/payment/client-secret',
      options: {
        plugins: {
          crumb: false,
        },
      },
      handler: routeHandler.postHandler,
    },
    {
      method: 'POST',
      path: '/report',
      handler: routeHandler.postHandler,
    },
    {
      method: 'GET',
      path: '/logout',
      handler: routeHandler.getHandler,
    },
    // {
    //   method: 'POST',
    //   path: '/stripe/webhook',
    //   options: {
    //     auth: false,
    //     plugins: {
    //       cookie: false,
    //       crumb: false,
    //     },
    //     payload: {
    //       parse: false,
    //     }
    //   },
    //   handler: (async (req, h) => {

    //     return new Promise(async (resolve, reject) => {
    //       let ev = req.payload;

    //       try {
    //         let sig = req.headers['stripe-signature'];

    //         ev = stripe.webhooks.constructEvent(req.payload, sig, process.env.STIPE_END_POINT);
    //       } catch (err) {

    //         await errLogger(err);

    //         resolve(h.response().code(400));
    //       };

    //       await webhookHandler(ev, req).then(() => {
    //         console.log('Done')
    //         resolve(h.response().code(200));
    //       });
    //     });
    //   }),
    // },
  ]);

  for (let dir of fs.readdirSync(path.join(__dirname, '/public'))) {
    let dirPath = path.join(path.join(__dirname, '/public'), dir);

    if (dirPath) {
      let files = fs.readdirSync(dirPath);

      for (let file of files) {
        
        let routeJson = {
          method: 'GET',
          path: `/${dir}/${file}`,
          handler: {
            file: path.join(dirPath, file),
          },
        };

        server.route(routeJson);
      };
    };
  };

  await server.start();

  console.log('Server running on %s', server.info.uri);
  } catch (err) {
    await errLogger(err);
  };
};


try {
  init();
} catch (err) {
  errLogger(err);
};