import express from 'express';
import Telemetry from './utils/telemetry.js';

const app = express();
const port = 3000;

const telemetry = new Telemetry();


app.get('/', (req, res) => {
    res.send.json("hello");

});

app.get('/health', (req,res)=>{

 res.json({
    status: 'ok',
    service: 'decoy-b',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // en secondes, depuis le démarrage du process
  });

});

app.get('/telemetry', (req, res) => {

  res.json({
    service: 'decoy-b',
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
  console.log(`decoy b listening on port ${port}`);
});