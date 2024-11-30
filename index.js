const express = require('express');
const { fork } = require('child_process');
const app = express();

app.get('/draw', async (req, res) => {
  try {
    // Decode the base64 URL parameter
    const paramsBase64 = req.query.params;
    const paramsBuffer = Buffer.from(paramsBase64, 'base64');
    const params = JSON.parse(paramsBuffer.toString());

    // Fork a new process to handle the canvas drawing
    const canvasWorker = fork('./canvasWorker.js');

    canvasWorker.send(params);

    canvasWorker.on('message', (message) => {
      if (message.success) {
        const pngBuffer = Buffer.from(message.data, 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.end(pngBuffer);
      } else {
        res.status(500).send(`Error: ${message.error}`);
      }

      // Terminate the child process
      canvasWorker.kill();
    });

    canvasWorker.on('error', (error) => {
      res.status(500).send('Error processing request');
      canvasWorker.kill();
    });

  } catch (error) {
    res.status(400).send('Invalid parameters');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});