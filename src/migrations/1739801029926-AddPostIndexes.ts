import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostIndexes1739801029926 implements MigrationInterface {
    name = 'AddPostIndexes1739801029926'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`IDX_2d82eb2bb2ddd7a6bfac8804d8\` ON \`posts\` (\`title\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_4f1969c3b7e3e1e905086164f7\` ON \`posts\` (\`brand\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_1cb7f8c73c770fe44cf9206f5a\` ON \`posts\` (\`platform\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_a69d9e2ae78ef7d100f8317ae0\` ON \`posts\` (\`status\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_89a9480f66ff32f9ff14cd79f1\` ON \`posts\` (\`dueDate\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_46bc204f43827b6f25e0133dbf\` ON \`posts\` (\`createdAt\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_02741c91f5a02b2b0d5998651e\` ON \`posts\` (\`brand\`, \`platform\`, \`status\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_41d0666c02b381d6a70a7a5d1b\` ON \`post_versions\` (\`postId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_060a5a7576e97bec0404342fde\` ON \`post_versions\` (\`createdAt\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_7358311b79fbf73993b3890846\` ON \`post_versions\` (\`postId\`, \`createdAt\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_7358311b79fbf73993b3890846\` ON \`post_versions\``);
        await queryRunner.query(`DROP INDEX \`IDX_060a5a7576e97bec0404342fde\` ON \`post_versions\``);
        await queryRunner.query(`DROP INDEX \`IDX_41d0666c02b381d6a70a7a5d1b\` ON \`post_versions\``);
        await queryRunner.query(`DROP INDEX \`IDX_02741c91f5a02b2b0d5998651e\` ON \`posts\``);
        await queryRunner.query(`DROP INDEX \`IDX_46bc204f43827b6f25e0133dbf\` ON \`posts\``);
        await queryRunner.query(`DROP INDEX \`IDX_89a9480f66ff32f9ff14cd79f1\` ON \`posts\``);
        await queryRunner.query(`DROP INDEX \`IDX_a69d9e2ae78ef7d100f8317ae0\` ON \`posts\``);
        await queryRunner.query(`DROP INDEX \`IDX_1cb7f8c73c770fe44cf9206f5a\` ON \`posts\``);
        await queryRunner.query(`DROP INDEX \`IDX_4f1969c3b7e3e1e905086164f7\` ON \`posts\``);
        await queryRunner.query(`DROP INDEX \`IDX_2d82eb2bb2ddd7a6bfac8804d8\` ON \`posts\``);
    }

}
