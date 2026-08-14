import express from 'express';
import { GetFloatEntropy } from './utils/entropy.mjs';
import Telemetry from './utils/telemetry.js';
const app = express();
const port = 3000;

const telemetry = new Telemetry();

const ERROR_SCENARIOS = [
  { status: 500, body: { status: 'error', detail: 'Internal Server Error' } },
  { status: 502, body: { status: 'error', detail: 'Bad Gateway' } },
  { status: 503, body: { status: 'error', detail: 'Service Unavailable' } },
  { status: 504, body: { status: 'error', detail: 'Gateway Timeout' } },
];

// simule une panne aleatoire : renvoie true (et repond) si ca "bug"
function maybeFail(res, chance) {
  if (Math.random() >= chance) return false;
  const scenario = ERROR_SCENARIOS[Math.floor(Math.random() * ERROR_SCENARIOS.length)];
  res.status(scenario.status).json(scenario.body);
  return true;
}

app.get('/', (req, res) => {
    res.send("hi");

});

app.get('/health', async (req,res)=>{

  const value = GetFloatEntropy()*500
  await new Promise(r => setTimeout(r, value));
  if (maybeFail(res, 0.2)) return;
  res.json({
        status: 'ok',
        service: 'decoy-c',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(), // en secondes, depuis le démarrage du process
      });

});

app.get('/telemetry', (req, res) => {

  if (maybeFail(res, 0.2)) return;
  res.json({
    service: 'decoy-c',
    timestamp: new Date().toISOString(),
    cpuPercent: telemetry.getCpuPercentage(),
    memoryUsedMb: telemetry.getMemoryUsed(),
    memoryTotalMb: telemetry.getTotalMemory(),
    heapUsedMb: telemetry.getHeapUsed(),
    heapTotalMb: telemetry.getTotalHeap(),
    diskUsedMb: telemetry.getDiskUsed(),
    diskTotalMb: telemetry.getTotalDisk(),
  });
});


app.listen(port, () => {

  console.clear()
  console.log(`decoy c listening on port ${port}`);
  console.log(`Testing Float entropy generation ${GetFloatEntropy()*500}`)

});
