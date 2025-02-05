const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Basic route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Medieval Shop server is running!');
});

// Placeholder route for future Twilio integration
app.post('/sms', (req, res) => {
  // Process incoming SMS webhook from Twilio later
  res.send('SMS endpoint received');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
