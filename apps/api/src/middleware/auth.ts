import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { isJtiDenied } from "../lib/tokenStore.js";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  jti?: string;
  groups?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

async function requireAuthAsync(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing or invalid token" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ code: "CONFIG_ERROR", message: "JWT_SECRET not configured" });
  }

  try {
    let decoded: AuthPayload;
    try {
      decoded = jwt.verify(token, secret) as AuthPayload;
    } catch {
      const ssoSecret = process.env.SSO_JWT_SECRET;
      if (!ssoSecret) throw new Error("invalid");
      decoded = jwt.verify(token, ssoSecret) as AuthPayload;
    }
    if (decoded.jti && (await isJtiDenied(decoded.jti))) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Token revoked" });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  void requireAuthAsync(req, res, next).catch(next);
}

async function optionalAuthAsync(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = process.env.JWT_SECRET;

  if (token && secret) {
    try {
      let decoded: AuthPayload;
      try {
        decoded = jwt.verify(token, secret) as AuthPayload;
      } catch {
        const ssoSecret = process.env.SSO_JWT_SECRET;
        if (!ssoSecret) throw new Error("invalid");
        decoded = jwt.verify(token, ssoSecret) as AuthPayload;
      }
      if (!decoded.jti || !(await isJtiDenied(decoded.jti))) {
        req.user = decoded;
      }
    } catch {
      // invalid/expired token — proceed as unauthenticated
    }
  }
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  void optionalAuthAsync(req, res, next).catch(next);
}
