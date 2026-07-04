import net from 'net';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
};

export const startMongo = async () => {
  const port = 27017;
  const inUse = await isPortInUse(port);
  if (inUse) {
    console.log(`Port ${port} is already in use. Assuming MongoDB (or another service) is running.`);
    return null;
  }

  console.log('MongoDB is not running. Starting local MongoDB instance...');
  
  // Resolve paths relative to project folders
  const projectRoot = path.resolve(__dirname, '../../');
  const mongodPath = path.join(projectRoot, 'mongodb/MongoDB/Server/8.2/bin/mongod.exe');
  const dbPath = path.join(projectRoot, 'mongodb/data');
  const logPath = path.join(projectRoot, 'mongodb/mongodb.log');

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
    console.log(`Created MongoDB database directory: ${dbPath}`);
  }

  if (!fs.existsSync(mongodPath)) {
    console.error(`Error: Local MongoDB executable not found at ${mongodPath}`);
    console.error('Please verify MongoDB MSI extraction in the implementation plan.');
    return null;
  }

  // Spawn mongod process
  const mongoProcess = spawn(mongodPath, [
    '--dbpath', dbPath,
    '--port', port.toString(),
    '--logpath', logPath,
    '--bind_ip', '127.0.0.1'
  ], {
    detached: true,
    stdio: 'ignore'
  });

  mongoProcess.unref();
  
  console.log(`Local MongoDB process spawned asynchronously. Logging to: ${logPath}`);
  
  // Give it a moment to boot
  await new Promise(resolve => setTimeout(resolve, 2000));
  return mongoProcess;
};
