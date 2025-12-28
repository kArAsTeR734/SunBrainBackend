import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    connectionString: `postgresql://postgres:root@localhost:5432/SunBrain_dev`,
});

client.connect()
    .then(() => console.log('✅ PostgreSQL подключён через connection string'))
    .catch(err => {
        console.error('❌ Ошибка подключения:', err.message);
        console.log('\n🔧 Проверьте:');
        console.log('1. Запущен ли PostgreSQL (services.msc)');
        console.log('2. Пароль правильный (root)');
        console.log('3. База данных SunBrain_dev существует');
    });
export default client;