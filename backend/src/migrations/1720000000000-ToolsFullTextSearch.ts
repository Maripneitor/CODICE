import { MigrationInterface, QueryRunner } from "typeorm";

export class ToolsFullTextSearch1720000000000 implements MigrationInterface {
    name = 'ToolsFullTextSearch1720000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS tools_search_idx ON "tools" USING gin(to_tsvector('spanish', name || ' ' || description));
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS tools_search_idx;
        `);
    }
}
