import { MigrationInterface, QueryRunner } from 'typeorm';

// Tables are created explicitly as utf8mb4 / utf8mb4_unicode_ci (CLAUDE.md).
export class CreateCoreTables1792355588014 implements MigrationInterface {
  name = 'CreateCoreTables1792355588014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`passwordHash\` varchar(255) NOT NULL, \`role\` enum ('user', 'agent') NOT NULL DEFAULT 'user', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
    await queryRunner.query(
      `CREATE TABLE \`comments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`ticketId\` int NOT NULL, \`authorId\` int NOT NULL, \`body\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tickets\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(120) NOT NULL, \`description\` text NOT NULL, \`status\` enum ('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open', \`priority\` enum ('low', 'medium', 'high') NOT NULL DEFAULT 'medium', \`tags\` json NOT NULL, \`createdById\` int NOT NULL, \`assigneeId\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_tickets_status\` (\`status\`), INDEX \`IDX_tickets_priority\` (\`priority\`), INDEX \`IDX_tickets_created_by\` (\`createdById\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
    await queryRunner.query(
      `CREATE TABLE \`attachments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`ticketId\` int NOT NULL, \`filename\` varchar(255) NOT NULL, \`path\` varchar(500) NOT NULL, \`mime\` varchar(255) NOT NULL, \`size\` int UNSIGNED NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_469fc1a5c6798a3b7a6de4dfc6e\` FOREIGN KEY (\`ticketId\`) REFERENCES \`tickets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_4548cc4a409b8651ec75f70e280\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_41de538b3eed286f53dd678b030\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_4f127f7c92139971ec4cbbe0bd5\` FOREIGN KEY (\`assigneeId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attachments\` ADD CONSTRAINT \`FK_14abf06f2a9b9233a64747c0f19\` FOREIGN KEY (\`ticketId\`) REFERENCES \`tickets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`attachments\` DROP FOREIGN KEY \`FK_14abf06f2a9b9233a64747c0f19\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_4f127f7c92139971ec4cbbe0bd5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_41de538b3eed286f53dd678b030\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_4548cc4a409b8651ec75f70e280\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_469fc1a5c6798a3b7a6de4dfc6e\``,
    );
    await queryRunner.query(`DROP TABLE \`attachments\``);
    await queryRunner.query(`DROP INDEX \`IDX_tickets_created_by\` ON \`tickets\``);
    await queryRunner.query(`DROP INDEX \`IDX_tickets_priority\` ON \`tickets\``);
    await queryRunner.query(`DROP INDEX \`IDX_tickets_status\` ON \`tickets\``);
    await queryRunner.query(`DROP TABLE \`tickets\``);
    await queryRunner.query(`DROP TABLE \`comments\``);
    await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
