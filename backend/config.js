import dotenv from 'dotenv';

dotenv.config();

export default {
    MONGODB_URL: process.env.MONGODB_URL || 'http://localhost:27017/mybrand',
    JWT_SECRET: process.env.JWT_SECRET || 'somethingsecret',
    accessKeyId: process.env.accessKeyId || 'accessKeyId',
    secretAccessKey: process.env.secretAccessKey || 'secretAccessKey',
    BCRYPT_SALT: process.env.BCRYPT_SALT || 12
}
