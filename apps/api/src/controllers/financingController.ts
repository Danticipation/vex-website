import { Request, Response } from "express";
import type { FinancingCalculateInput } from "@vex/shared";

function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export async function calculate(req: Request, res: Response) {
  const body = req.body as FinancingCalculateInput;
  const { price, termMonths, apr } = body;
  const monthly = monthlyPayment(price, apr, termMonths);
  const totalAmount = Math.round(monthly * termMonths * 100) / 100;
  const totalInterest = Math.round((totalAmount - price) * 100) / 100;

  return res.json({
    monthlyPayment: Math.round(monthly * 100) / 100,
    totalInterest,
    totalAmount,
    termMonths,
    apr,
  });
}
