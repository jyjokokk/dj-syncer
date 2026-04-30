export type User = {
	id: string;
	email: string;
	createdAt: Date;
};

export type NewUser = {
	email: string;
};

export interface UserRepository {
	create(user: NewUser): Promise<User>;
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
}
