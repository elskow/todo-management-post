import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostsVersionsTable1739793820724 implements MigrationInterface {
    name = 'CreatePostsVersionsTable1739793820724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`post_versions\` (\`id\` varchar(36) NOT NULL, \`postId\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`brand\` varchar(255) NOT NULL, \`platform\` enum ('INSTAGRAM', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'TIKTOK') NOT NULL, \`dueDate\` datetime NOT NULL, \`payment\` decimal(10,2) NOT NULL, \`status\` enum ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'CANCELLED') NOT NULL, \`changeReason\` varchar(255) NULL, \`changedBy\` varchar(255) NULL, \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`post_versions\` ADD CONSTRAINT \`FK_41d0666c02b381d6a70a7a5d1ba\` FOREIGN KEY (\`postId\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`post_versions\` DROP FOREIGN KEY \`FK_41d0666c02b381d6a70a7a5d1ba\``);
        await queryRunner.query(`DROP TABLE \`post_versions\``);
    }

}
