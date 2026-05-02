import type { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import type {
	NewUser,
	User,
	UserCreateError,
	UserRepository,
} from "../../domain/user";
import { err, ok, type Result } from "../../utils/result";

type Row = {
	id: string;
	email: string;
	created_at: string;
};

const toUser = (row: Row): User => ({
	id: row.id,
	email: row.email,
	createdAt: new Date(row.created_at),
});

export class SqliteUserRepository implements UserRepository {
	constructor(private readonly db: Database) {}

	async create(input: NewUser): Promise<Result<User, UserCreateError>> {
		const user: User = {
			id: `u_${randomUUID()}`,
			email: input.email,
			createdAt: new Date(),
		};
		const result = this.db
			.query(
				"INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING",
			)
			.run(user.id, user.email, user.createdAt.toISOString());
		if (result.changes === 0) return err("email_conflict");
		return ok(user);
	}

	async findById(id: string): Promise<User | null> {
		const row = this.db
			.query<Row, [string]>(
				"SELECT id, email, created_at FROM users WHERE id = ?",
			)
			.get(id);
		return row ? toUser(row) : null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const row = this.db
			.query<Row, [string]>(
				"SELECT id, email, created_at FROM users WHERE email = ?",
			)
			.get(email);
		return row ? toUser(row) : null;
	}
}
