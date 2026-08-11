import express from 'express';

const app = express();
const port = 3000;


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

app.listen(port, () => {
  console.log(`decoy b listening on port ${port}`);
});