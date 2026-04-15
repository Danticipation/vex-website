import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import type { RegisterInput, LoginInput } from "@vex/shared";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not configured");
}

function toPublicUser(user: {
  id: string;
  email: string;
  role: string;
  name: string | null;
  phone: string | null;
  tier: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
    tier: user.tier,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ code: "CONFLICT", message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || null, role: "CUSTOMER" },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.status(201).json({ user: toPublicUser(user), token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.json({ user: toPublicUser(user), token });
}

export async function me(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Not authenticated" });

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

  return res.json(toPublicUser(user));
}
