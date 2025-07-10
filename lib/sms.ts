import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  throw new Error('Twilio environment variables are not set.');
}

const client = twilio(accountSid, authToken);

function normalizePhoneNumber(phone: string): string {
  // If already in E.164 format, return as is
  if (phone.startsWith('+')) return phone;
  // If starts with 0 and is 10 digits, assume Malawi local and convert
  if (phone.startsWith('0') && phone.length === 10) {
    return '+265' + phone.slice(1);
  }
  // Add more rules as needed for your use case
  throw new Error('Invalid phone number format. Please enter a valid Malawi number.');
}

export async function sendBookingSMS(to: string, message: string) {
  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo) throw new Error('Recipient phone number is required');
  return client.messages.create({
    body: message,
    to: normalizedTo,
    from: fromNumber,
  });
} 