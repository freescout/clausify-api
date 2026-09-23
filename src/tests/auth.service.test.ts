import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { registerUser, verifyCredentials } from "../services/auth";

const { userMock } = vi.hoisted(() => ({
  userMock: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../lib/prisma", () => ({
  prisma: { user: userMock },
}));

beforeEach(() => {
  userMock.findUnique.mockReset();
  userMock.create.mockReset();
});

describe("registerUser", () => {
  it("hashes the password and returns the public user", async () => {
    userMock.findUnique.mockResolvedValue(null);
    userMock.create.mockImplementation(async ({ data }) => ({
      id: "user-1",
      email: data.email,
      name: data.name,
      password: data.password,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    }));

    const user = await registerUser("alice@example.com", "hunter22", "Alice");

    expect(user).toEqual({
      id: "user-1",
      email: "alice@example.com",
      name: "Alice",
      created_at: "2026-01-01T00:00:00.000Z",
    });

    const storedHash = userMock.create.mock.calls[0][0].data.password;
    expect(storedHash).not.toBe("hunter22");
    expect(await bcrypt.compare("hunter22", storedHash)).toBe(true);
  });

  it("throws EMAIL_TAKEN when the email is already registered", async () => {
    userMock.findUnique.mockResolvedValue({ id: "existing" });

    await expect(
      registerUser("alice@example.com", "hunter22", "Alice"),
    ).rejects.toThrow("EMAIL_TAKEN");

    expect(userMock.create).not.toHaveBeenCalled();
  });
});

describe("verifyCredentials", () => {
  it("returns null when no user matches the email", async () => {
    userMock.findUnique.mockResolvedValue(null);

    const result = await verifyCredentials("nobody@example.com", "whatever");

    expect(result).toBeNull();
  });

  it("returns null when the password does not match", async () => {
    userMock.findUnique.mockResolvedValue({
      id: "user-2",
      email: "bob@example.com",
      name: "Bob",
      password: await bcrypt.hash("correct-password", 10),
      createdAt: new Date(),
    });

    const result = await verifyCredentials("bob@example.com", "wrong-password");

    expect(result).toBeNull();
  });

  it("returns the public user when the password matches", async () => {
    userMock.findUnique.mockResolvedValue({
      id: "user-3",
      email: "carol@example.com",
      name: "Carol",
      password: await bcrypt.hash("correct-password", 10),
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
    });

    const result = await verifyCredentials("carol@example.com", "correct-password");

    expect(result).toEqual({
      id: "user-3",
      email: "carol@example.com",
      name: "Carol",
      created_at: "2026-02-01T00:00:00.000Z",
    });
  });
});
