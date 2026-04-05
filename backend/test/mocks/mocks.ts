import { Goal } from "../../src/entities/goal.entity";
import { User } from "../../src/entities/user.entity";

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  createdAt: new Date(),
  goals: [],
  ...overrides,
});

export const makeGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: '1',
  userId: 'user1',
  title: 'exercise',
  type: 'boolean',
  createdAt: new Date(),
  user: makeUser(),
  entries: [],
  ...overrides,
});
