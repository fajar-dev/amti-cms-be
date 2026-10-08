import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { PasswordResetToken } from "../entities/password-reset-token.entity"
import { IPasswordResetTokenRepository } from "../interfaces/password-reset-token.repository.interface"

export class TypeOrmPasswordResetTokenRepository implements IPasswordResetTokenRepository {
    private get repository(): Repository<PasswordResetToken> {
        return AppDataSource.getRepository(PasswordResetToken)
    }

    async findById(id: number): Promise<PasswordResetToken | null> {
        return await this.repository.findOneBy({ id })
    }

    async save(data: Partial<PasswordResetToken>, manager?: EntityManager): Promise<PasswordResetToken> {
        const repo = manager ? manager.getRepository(PasswordResetToken) : this.repository
        return await repo.save(data)
    }

    merge(entity: PasswordResetToken, data: Partial<PasswordResetToken>): PasswordResetToken {
        return this.repository.merge(entity, data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }

    async createToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
        const record = this.repository.create({
            email,
            token,
            expiresAt,
        })
        return await this.repository.save(record)
    }

    async findValidByToken(token: string): Promise<PasswordResetToken | null> {
        return await this.repository.createQueryBuilder("prt")
            .where("prt.token = :token", { token })
            .andWhere("prt.expires_at > :now", { now: new Date() })
            .getOne()
    }

    async findValidByEmailAndToken(email: string, token: string): Promise<PasswordResetToken | null> {
        return await this.repository.createQueryBuilder("prt")
            .where("prt.email = :email", { email })
            .andWhere("prt.token = :token", { token })
            .andWhere("prt.expires_at > :now", { now: new Date() })
            .getOne()
    }

    async deleteByEmail(email: string): Promise<void> {
        await this.repository.delete({ email })
    }

    async deleteExpired(): Promise<void> {
        await this.repository.createQueryBuilder()
            .delete()
            .from(PasswordResetToken)
            .where("expires_at <= :now", { now: new Date() })
            .execute()
    }
}
