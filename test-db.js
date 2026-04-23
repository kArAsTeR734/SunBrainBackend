import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

console.log({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: JSON.stringify(process.env.DB_PASSWORD),
  passwordLength: process.env.DB_PASSWORD?.length,
});

client
  .connect()
  .then(function () {
    console.log('OK connected');
    return client.end();
  })
  .catch(function (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  });