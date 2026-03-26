import { Request, Response, NextFunction } from "express";

export function requireRole(...roles: Array<"CUSTOMER" | "STAFF" | "ADMIN" | "GROUP_ADMIN">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Login required" });
    if (!roles.includes(user.role as (typeof roles)[number])) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Insufficient role" });
    }
    next();
  };
}

