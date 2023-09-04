const pptxImage = require('./pptximage');
const verifyEmail = require('./verifyEmail');
const loadingScreen = require('./loadingScreen');
const webhookHandler = require('./webhook_handler_old');
const payloadSantizer = require('./sanitzePayload');

module.exports = {
    pptxImage,
    verifyEmail,
    loadingScreen,
    webhookHandler,
    payloadSantizer,
};