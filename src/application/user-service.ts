import type { NewUser, User, UserRepository } from "../domain/user";

export class UserService {
	constructor(private readonly users: UserRepository) {}

	async createUser(input: NewUser): Promise<User> {
		const existing = await this.users.findByEmail(input.email);
		if (existing) return existing;
		return this.users.create(input);
	}

	getUser(id: string): Promise<User | null> {
		return this.users.findById(id);
	}
}
