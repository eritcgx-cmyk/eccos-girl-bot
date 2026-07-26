const WEAO_ENDPOINTS = [
    'https://api.weao.xyz/exploits',
    'https://whatexpsare.online/api/status/exploits',
    'https://whatexpsare.online/api/exploits',
];

async function testWEAO() {
    for (const url of WEAO_ENDPOINTS) {
        console.log('Testing URL:', url);
        try {
            const res = await fetch(url);
            console.log('Status code:', res.status);
            const json = await res.json();
            console.log('JSON sample:', JSON.stringify(json).substring(0, 1000));
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}

testWEAO();
