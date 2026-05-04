import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name.").max(120),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["buyer", "seller", "investor"]).default("buyer"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const checkEmailSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

export const listingCreateSchema = z.object({
  title: z.string().min(2).max(180),
  type: z.string().min(2).max(40).default("apartment"),
  price: z.coerce.number().positive("Price must be greater than zero."),
  location: z.string().min(2).max(180),
  areaName: z.string().min(2).max(180),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().positive("Size must be greater than zero."),
  floor: z.string().max(50).optional().nullable(),
  buildingAge: z.string().max(50).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  aiPricing: z.enum(["yes", "no"]).default("no"),
  estimatedYield: z.coerce.number().optional().nullable(),
  demandScore: z.coerce.number().optional().nullable(),
  aiConfidence: z.coerce.number().optional().nullable(),
  nearbyDevelopment: z.string().max(2000).optional().nullable(),
  sellerNote: z.string().max(180).default("Ready for buyer inquiries"),
  status: z.enum(["available", "sold"]).default("available"),
});

export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
