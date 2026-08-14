import os from 'os';
import process from 'process';
import fs from 'fs';


class Telemetry {
    getCpuPercentage() {

        const [cpu] = os.cpus();

        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);

        const usage = process.cpuUsage();
        const currentCpuUsage = (usage.user + usage.system) / 1000;

        return (currentCpuUsage / total) * 100;
    }
    getMemoryUsed() {
        let mem = 0;
        for (const [key, value] of Object.entries(process.memoryUsage())) {
            mem += value;
        }
        let total = mem / 1000000
        return total
    }
    getTotalMemory() {
        const total_memory = os.totalmem();
        const total_mem_in_kb = total_memory / 1024;
        const total_mem_in_mb = total_mem_in_kb / 1024;
        return total_mem_in_mb
    }
    getHeapUsed() {
        const { heapUsed } = process.memoryUsage();
        return heapUsed / 1000000;
    }
    getTotalHeap() {
        const { heapTotal } = process.memoryUsage();
        return heapTotal / 1000000;
    }
    getDiskUsed() {
        const stats = fs.statfsSync('/');
        const totalBytes = stats.blocks * stats.bsize;
        const freeBytes = stats.bavail * stats.bsize;
        return (totalBytes - freeBytes) / 1000000;
    }
    getTotalDisk() {
        const stats = fs.statfsSync('/');
        return (stats.blocks * stats.bsize) / 1000000;
    }
    isImported(){
        console.log("Imported")
    }
}

export default Telemetry;
