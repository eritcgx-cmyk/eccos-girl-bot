async function inspectWEAOData() {
    const res = await fetch('https://whatexpsare.online/api/status/exploits');
    const json = await res.json();
    console.log('Total items returned:', json.length);
    json.forEach(item => {
        console.log(`Title: "${item.title}", updateStatus: ${item.updateStatus}, detected: ${item.detected}, uncStatus: ${item.uncStatus}, version: ${item.version}`);
    });
}
inspectWEAOData();
