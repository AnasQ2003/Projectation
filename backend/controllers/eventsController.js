const clients = new Map();
let clientIdCounter = 0;

function streamEvents(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  const role = (req.query.role || 'User').trim();
  const userName = (req.query.userName || req.query.name || '').trim().toLowerCase();
  const userEmail = (req.query.userEmail || req.query.email || '').trim().toLowerCase();
  const userUsername = (req.query.userUsername || req.query.username || '').trim().toLowerCase();
  const clientId = ++clientIdCounter;
  clients.set(clientId, { res, role, userName, userEmail, userUsername, connectedAt: Date.now() });
  res.write('event: connected\ndata: ' + JSON.stringify({ clientId, role }) + '\n\n');
  const heartbeatTimer = setInterval(function() {
    try { res.write(': heartbeat\n\n'); } catch(e) {}
  }, 25000);
  req.on('close', function() { clearInterval(heartbeatTimer); clients.delete(clientId); });
  req.on('error', function() { clearInterval(heartbeatTimer); clients.delete(clientId); });
}

function broadcastEvent(event, targetRole, targetUser) {
  if (!targetRole) targetRole = 'Admin';
  const payload = JSON.stringify(Object.assign({}, event, { timestamp: new Date().toISOString() }));
  const eventType = event.type || 'notification';
  const disconnected = [];
  for (const entry of clients) {
    const clientId = entry[0];
    const client = entry[1];
    try {
      const cr = (client.role || '').toLowerCase();
      const isAdmin = targetRole === 'Admin' && cr === 'admin';
      const isAll = targetRole === 'All';
      const tu = (targetUser || '').toLowerCase();
      const isUser = targetRole === 'User' && cr !== 'admin' && (!tu || client.userName === tu || client.userEmail === tu || client.userUsername === tu);
      if (isAdmin || isAll || isUser) {
        client.res.write('event: ' + eventType + '\ndata: ' + payload + '\n\n');
      }
    } catch(e) { disconnected.push(clientId); }
  }
  disconnected.forEach(function(id) { clients.delete(id); });
}

function getConnectedClientsCount() { return clients.size; }

module.exports = { streamEvents, broadcastEvent, getConnectedClientsCount };
