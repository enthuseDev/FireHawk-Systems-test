require('dotenv').config();

const { createServer } = require('./server');

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = createServer();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] Listening on http://localhost:${port}`);
});

