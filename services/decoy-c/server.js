import express from 'express';
import { GetFloatEntropy } from './utils/entropy.mjs';
const app = express();
const port = 3000;


app.get('/', (req, res) => {
    res.send("hi");

});

app.get('/health', async (req,res)=>{
  const value = GetFloatEntropy()*500
  await new Promise(r => setTimeout(r, value));
  if (Math.random() < 0.2) return res.status(500).json({ status: 'error' });
  res.json({
        status: 'ok',
        service: 'decoy-c',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(), // en secondes, depuis le démarrage du process
      });

});


app.listen(port, () => {
  console.clear()
  console.log(`decoy c listening on port ${port}`);
  console.log(`Testing Float entropy generation ${GetFloatEntropy()*500}`)
});