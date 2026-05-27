const channels = {
  agronomes: new Set(),
  transporteurs: new Set()
};

const addClient = (channel, res) => {
  if (!channels[channel]) {
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', channel })}\n\n`);
  channels[channel].add(res);
};

const removeClient = (channel, res) => {
  channels[channel]?.delete(res);
};

const broadcast = (channel, payload) => {
  if (!channels[channel]) {
    return;
  }

  const data = `data: ${JSON.stringify(payload)}\n\n`;
  channels[channel].forEach((client) => {
    try {
      client.write(data);
    } catch (error) {
      channels[channel].delete(client);
    }
  });
};

module.exports = {
  addClient,
  broadcast,
  removeClient
};
