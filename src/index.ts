export function add(a: number, b: number): number {
	return a + b;
}

export function subtract(a: number, b: number): number {
	return a - b;
}

class UserRepository {
	getFromRepo() {
		return {};
	}
}

export class UserService {
	constructor(private readonly userRepository: UserRepository) {}
	getUser(id: number) {
		this.userRepository.getFromRepo();
		return { id, name: `User${id}` };
	}
}
