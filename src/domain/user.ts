export type User = {
	id: string;
	email: string;
	createdAt: Date;
};

export type NewUser = {
	email: string;
};

import type { Result } from "../utils/result";

export type UserCreateError = "email_conflict";

export interface UserRepository {
	create(user: NewUser): Promise<Result<User, UserCreateError>>;
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
}
