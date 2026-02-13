const crypto = require('crypto');

// 1. CONFIGURATION
// Use the secret from your .env.local or fallback to a test key
const WEBHOOK_SECRET = process.env.PAYCHANGU_WEBHOOK_SECRET || 'test_secret_key';
const LOCAL_URL = 'http://localhost:3000/api/webhook/paychangu';

// 2. SAMPLE PAYLOAD (Based on PayChangu Documentation & Yuki Logs)
const payload = JSON.stringify({
    "event_type": "api.charge.payment",
    "status": "success",
    "reference": "TEST-REF-" + Date.now(),
    "amount": 1000,
    "currency": "MWK",
    "data": {
        "status": "success",
        "tx_ref": "TEST-REF-" + Date.now(),
        "amount": 1000,
        "currency": "MWK",
        "meta": {
            "name": "Test User",
            "phone": "0000000000",
            "date": "2026-02-13",
            "timeSlot": "10:00"
        }
    }
});

// 3. GENERATE HMAC-SHA256 SIGNATURE
const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

console.log('🚀 [TEST] Initiating simulated webhook...');
console.log('📍 Target URL:', LOCAL_URL);
console.log('🔐 Signature:', signature);
console.log('📦 Content Type: application/json');

// 4. SEND THE REQUEST
fetch(LOCAL_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'signature': signature
    },
    body: payload
})
    .then(async res => {
        const text = await res.text();
        let data = {};
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { error: 'Invalid JSON response', text };
        }

        console.log('\n📡 Server Response:');
        console.log('-------------------');
        console.log('Status Code:', res.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));
        console.log('-------------------');

        if (res.status === 200) {
            console.log('\n✅ TEST SUCCESSFUL: The server acknowledged the webhook.');
        } else if (res.status === 401) {
            console.log('\n⚠️  SIGNATURE MISMATCH: This is EXPECTED if your LOCAL secret does not match the dashboard.');
        } else {
            console.log('\n❌ TEST FAILED: Check the server logs (pnpm dev) for details.');
        }

        console.log('\n🚀 FINAL STEP: Run your SQL query to see the "webhook_hit" in the PaymentEvent table!');
    })
    .catch(err => {
        console.error('\n💥 REQUEST FAILED:');
        console.error(err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.error('👉 Make sure your local server (pnpm dev) is running on port 3000!');
        }
    });
