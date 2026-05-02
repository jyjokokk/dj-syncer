import type {
	NewUser,
	User,
	UserCreateError,
	UserRepository,
} from "../domain/user";
import { err, type Result } from "../utils/result";

export class UserService {
	constructor(private readonly users: UserRepository) {}

	async createUser(input: NewUser): Promise<Result<User, UserCreateError>> {
		const existing = await this.users.findByEmail(input.email);
		if (existing) return err("email_conflict");
		return this.users.create(input);
	}

	getUser(id: string): Promise<User | null> {
		return this.users.findById(id);
	}
}
