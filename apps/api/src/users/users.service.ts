import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: number): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  // passwordHash is select:false, so the login path asks for it explicitly.
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.users.existsBy({ email });
  }

  async create(email: string, passwordHash: string, role: UserRole = UserRole.User): Promise<User> {
    const created = await this.users.save(this.users.create({ email, passwordHash, role }));
    // save() returns the entity as built, including passwordHash; reload without it.
    return this.users.findOneByOrFail({ id: created.id });
  }
}
