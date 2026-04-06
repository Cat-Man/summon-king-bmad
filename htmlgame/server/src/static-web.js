const express = require('express');
const path = require('path');

const app = express();
const root = path.resolve(__dirname, '../../');

app.use(express.static(root));

app.get('/', (req, res) => {
  res.redirect('/game.html');
});

const port = process.env.CLIENT_PORT || 8082;
app.listen(port, () => {
  console.log(`Static web server running at http://127.0.0.1:${port}/game.html`);
});