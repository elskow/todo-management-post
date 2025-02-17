import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostsTable1739785876291 implements MigrationInterface {
  name = 'CreatePostsTable1739785876291';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`posts\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`brand\` varchar(255) NOT NULL, \`platform\` enum ('INSTAGRAM', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'TIKTOK') NOT NULL, \`dueDate\` datetime NOT NULL, \`payment\` decimal(10,2) NOT NULL, \`status\` enum ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT', \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`posts\``);
  }
}
