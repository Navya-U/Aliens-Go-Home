const express = require('express');
const app = express();
const http = require('http').Server(app);
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const cors = require('cors');

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

const io = new Server(http, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: true,
  },
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

const client = jwksClient({
  jwksUri: 'https://dev-ks44a6ctkb0zmsyt.us.auth0.com/.well-known/jwks.json',
});

const players = [];

const verifyPlayer = (token, cb) => {
  const uncheckedToken = jwt.decode(token, { complete: true });
  const kid = uncheckedToken.header.kid;

  client.getSigningKey(kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    jwt.verify(token, signingKey, cb);
  });
};

const newMaxScoreHandler = (payload) => {
  let foundPlayer = false;
  players.forEach((player) => {
    if (player.id === payload.id) {
      foundPlayer = true;
      player.maxScore = Math.max(player.maxScore, payload.maxScore);
    }
  });

  if (!foundPlayer) {
    players.push(payload);
  }

  io.emit('players', players);
};

io.on('connection', (socket) => {
  const { token } = socket.handshake.query;

  verifyPlayer(token, (err) => {
    if (err) {
      socket.disconnect();
    } else {
      io.emit('players', players);
    }
  });

  socket.on('new-max-score', newMaxScoreHandler);
});

http.listen(3001, () => {
  console.log('listening on port 3001');
});
