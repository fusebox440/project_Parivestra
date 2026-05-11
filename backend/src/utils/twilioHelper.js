const twilio = require('twilio');
const env = require('../config/env');
const logger = require('./logger');

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

function validateTwilioSignature(req) {
  const signature = req.headers['x-twilio-signature'];
  const url = `https://${req.headers.host}${req.originalUrl}`;
  const params = req.body;
  return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
}

async function sendWhatsAppMessage(to, body) {
  try {
    const message = await client.messages.create({
      from: `whatsapp:${env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`,
      body,
    });
    logger.info(`WhatsApp message sent to ${maskPhone(to)} (SID: ${message.sid})`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    logger.error(`Failed to send WhatsApp message to ${maskPhone(to)}: ${error.message}`);
    return { success: false, messageSid: null };
  }
}

function maskPhone(phone) {
  if (phone.length > 10) {
    return `${phone.substring(0, 3)}XXXXXX${phone.substring(phone.length - 4)}`;
  }
  return phone;
}

module.exports = {
  validateTwilioSignature,
  sendWhatsAppMessage,
  maskPhone,
};
