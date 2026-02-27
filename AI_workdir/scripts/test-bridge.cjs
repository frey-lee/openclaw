const { WebSocket } = require('ws');
const ws = new WebSocket('ws://localhost:18789');
let gotData = false;
ws.on('open', () => console.log('[test] connected'));
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'connected') {
    console.log('[test] session:', msg.sessionId);
    ws.send(JSON.stringify({ type: 'chat', text: 'Hello, say hi back in one sentence.' }));
    console.log('[test] sent chat...');
  } else if (msg.type === 'text_delta') {
    if (!gotData) { console.log('[test] receiving response:'); gotData = true; }
    process.stdout.write(msg.text || '');
  } else if (msg.type === 'done') {
    console.log('\n[test] DONE');
    ws.close();
  } else if (msg.type === 'error') {
    console.log('[test] ERROR:', msg.text);
    ws.close();
  } else {
    console.log('[test] other:', JSON.stringify(msg).slice(0, 200));
  }
});
ws.on('error', (err) => console.error('[test] ws error:', err.message));
ws.on('close', (code) => { console.log('[test] closed code=' + code); process.exit(0); });
setTimeout(() => { console.log('[test] timeout'); process.exit(1); }, 120000);
