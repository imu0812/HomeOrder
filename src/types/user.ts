export type User = {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "staff";
  isActive: boolean;
  createdAt: string;
};
