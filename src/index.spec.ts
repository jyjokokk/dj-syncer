import { beforeEach, describe, expect, it } from "bun:test";
import { add, subtract, UserService } from "./index";

describe("add", () => {
	it("should add two numbers correctly", () => {
		expect(add(2, 3)).toBe(5);
	});
});

describe("subtract", () => {
	it("should subtract two numbers correctly", () => {
		expect(subtract(5, 2)).toBe(3);
	});
});

let instace: UserService;
const calls: any = {};

const userRepositoryMock: any = {
	getFromRepo: () => {
		calls.userRepository.getFromRepoCalled = true;
	},
};

beforeEach(() => {
	calls.userRepository = {};
	instace = new UserService(userRepositoryMock);
});

describe("UserService", () => {
	it("should return user data correctly", () => {
		expect(instace.getUser(1)).toEqual({ id: 1, name: "User1" });
		expect(calls.userRepository.getFromRepoCalled).toBe(true);
	});
});
