import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialHardening1719999999999 implements MigrationInterface {
    name = 'InitialHardening1719999999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create permissions table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying,
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_permissions_name" UNIQUE ("name"),
                CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
            )
        `);

        // Create roles table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying,
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
                CONSTRAINT "PK_roles" PRIMARY KEY ("id")
            )
        `);

        // Create role_permissions join table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "role_permissions" (
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
                CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // Insert default roles
        await queryRunner.query(`
            INSERT INTO "roles" (name) VALUES 
            ('ADMIN'),
            ('WAREHOUSE_MANAGER'),
            ('SUPERVISOR'),
            ('TECHNICIAN'),
            ('AUDITOR')
            ON CONFLICT (name) DO NOTHING
        `);

        // Modify users table
        // Add name column if it doesn't exist
        const nameColExists = await queryRunner.hasColumn("users", "name");
        if (!nameColExists) {
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "name" character varying`);
        }

        // Add created_by if it doesn't exist
        const createdByColExists = await queryRunner.hasColumn("users", "created_by");
        if (!createdByColExists) {
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "created_by" character varying`);
        }

        // Add deleted_at if it doesn't exist
        const deletedAtColExists = await queryRunner.hasColumn("users", "deleted_at");
        if (!deletedAtColExists) {
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP`);
        }

        // Add role_id column if it doesn't exist
        const roleIdColExists = await queryRunner.hasColumn("users", "role_id");
        if (!roleIdColExists) {
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "role_id" uuid`);
            await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL`);
        }

        // Migrate existing users roles to new schema
        const adminRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1`);
        const techRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'TECHNICIAN' LIMIT 1`);
        const viewerRole = await queryRunner.query(`SELECT id FROM roles WHERE name = 'AUDITOR' LIMIT 1`); // Map viewer/restorer to auditor or default roles

        if (adminRole && adminRole.length > 0) {
            await queryRunner.query(`UPDATE users SET role_id = '${adminRole[0].id}' WHERE role = 'admin' OR role = 'ADMIN'`);
        }
        if (techRole && techRole.length > 0) {
            await queryRunner.query(`UPDATE users SET role_id = '${techRole[0].id}' WHERE role = 'technician' OR role = 'TECHNICIAN' OR role = 'restorer'`);
        }
        if (viewerRole && viewerRole.length > 0) {
            await queryRunner.query(`UPDATE users SET role_id = '${viewerRole[0].id}' WHERE role_id IS NULL`);
        }

        // Drop the old role string column if it exists
        const roleColExists = await queryRunner.hasColumn("users", "role");
        if (roleColExists) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert role column
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "role" character varying DEFAULT 'viewer'`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }
}
