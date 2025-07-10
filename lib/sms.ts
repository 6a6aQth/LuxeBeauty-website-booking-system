import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  throw new Error('Twilio environment variables are not set.');
}

const client = twilio(accountSid, authToken);

export async function sendBookingSMS(to: string, message: string) {
  if (!to) throw new Error('Recipient phone number is required');
  return client.messages.create({
    body: message,
    to,
    from: fromNumber,
  });
} 