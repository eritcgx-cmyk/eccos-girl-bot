// test_status.js — run with: node test_status.js
const { fetchExploitStatuses } = require('./src/status');

fetchExploitStatuses().then(data => {
    console.log('Status result:');
    console.log(JSON.stringify(data, null, 2));
}).catch(err => {
    console.error('Error:', err);
});
