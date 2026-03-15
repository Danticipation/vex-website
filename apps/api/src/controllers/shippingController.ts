import { Request, Response } from "express";
import type { ShippingQuoteInput } from "@vex/shared";

const RATE_PER_MILE_OPEN = 1.25;
const RATE_PER_MILE_ENCLOSED = 1.75;
const PLATFORM_ADDER = 0.0035;

function roughDistanceMiles(_origin: string, _destination: string): number {
  return 415;
}

export async function quote(req: Request, res: Response) {
  const body = req.body as ShippingQuoteInput;
  const distance = roughDistanceMiles(body.origin, body.destination);
  const ratePerMile = body.openEnclosed === "ENCLOSED" ? RATE_PER_MILE_ENCLOSED : RATE_PER_MILE_OPEN;
  const baseAmount = distance * ratePerMile;
  const adder = baseAmount * PLATFORM_ADDER;
  const amount = Math.round((baseAmount + adder) * 100) / 100;

  return res.json({
    amount,
    distance,
    breakdown: {
      base: baseAmount,
      platformAdder: adder,
      openEnclosed: body.openEnclosed,
    },
  });
}
