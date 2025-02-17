import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Post } from '../post/post.entity';

config();

const configService = new ConfigService();

export default new DataSource({
    type: 'mysql',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [Post],
    migrations: ['src/migrations/*.ts'],
    migrationsTableName: 'migrations_typeorm',
});