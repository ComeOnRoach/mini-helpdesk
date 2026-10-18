import { MigrationInterface } from 'typeorm';

// Empty on purpose: proves the migration chain (run/revert) before the entities arrive in T1.2.
export class InitSchema1792348191593 implements MigrationInterface {
  public async up(): Promise<void> {
    // no schema changes yet
  }

  public async down(): Promise<void> {
    // no schema changes yet
  }
}
