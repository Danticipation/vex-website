import { z } from "zod";

export const onboardingStartSchema = z.object({
  email: z.string().email(),
  dealerName: z.string().min(2).max(120),
  password: z.string().min(8),
  captchaToken: z.string().min(1),
});

export const onboardingStripeStepSchema = z.object({
  tenantId: z.string(),
  tier: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const onboardingThemeStepSchema = z.object({
  tenantId: z.string(),
  customDomain: z.string().min(3).max(120).optional(),
  themeJson: z.record(z.any()).optional(),
});

export const onboardingDemoSeedStepSchema = z.object({
  tenantId: z.string(),
  enableDemoData: z.boolean().default(true),
});

export const onboardingConfirmSchema = z.object({
  tenantId: z.string(),
});

export type OnboardingStartInput = z.infer<typeof onboardingStartSchema>;
