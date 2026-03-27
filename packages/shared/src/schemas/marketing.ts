import { z } from "zod";

export const ABTestVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  channel: z.enum(["email", "sms"]),
  weight: z.number().int().min(1).max(100),
  subject: z.string().min(1).max(160).optional(),
  body: z.string().min(1).max(4000),
  landingPath: z.string().min(1).max(300).optional(),
});

export const LeadNurtureSequenceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  steps: z.array(
    z.object({
      dayOffset: z.number().int().min(0).max(365),
      variantId: z.string().min(1),
    })
  ),
});

export const CampaignSchema = z.object({
  name: z.string().min(2).max(120),
  audience: z.enum(["new_leads", "trial", "at_risk", "all"]),
  channels: z.array(z.enum(["email", "sms"])).min(1),
  seoLandingSlug: z.string().min(2).max(120),
  requireDoubleOptIn: z.boolean().default(true),
  variants: z.array(ABTestVariantSchema).min(1),
  sequence: LeadNurtureSequenceSchema.optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;
export type ABTestVariant = z.infer<typeof ABTestVariantSchema>;
export type LeadNurtureSequence = z.infer<typeof LeadNurtureSequenceSchema>;
