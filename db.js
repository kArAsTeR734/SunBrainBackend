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

client.connect()
    .then(() => console.log('✅ PostgreSQL подключён через Docker'))
    .catch(err => {
        console.error('❌ Ошибка подключения:', err.message);
        console.log('\n🔧 Проверьте:');
        console.log('1. Запущен ли PostgreSQL (services.msc)');
        console.log('2. Пароль правильный (root)');
        console.log('3. База данных SunBrain_dev существует');
    });
export default client;