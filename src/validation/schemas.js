const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  region: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const questionCreateSchema = z.object({
  body: z.string().min(3).max(5000),
  guestName: z.string().max(200).optional(),
  cropHint: z.string().max(100).optional(),
});

const answerCreateSchema = z.object({
  body: z.string().min(3).max(8000),
});

const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
});

const marketCreateSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  unit: z.string().max(20).optional(),
  location: z.string().min(1).max(200),
  region: z.string().max(100).optional(),
  type: z.enum(["crops", "livestock"]).optional(),
  imageUrl: z.string().max(2000).optional(),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(200).optional(),
});

const marketUpdateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    price: z.coerce.number().positive().optional(),
    unit: z.string().max(20).optional(),
    location: z.string().min(1).max(200).optional(),
    region: z.string().max(100).optional(),
    type: z.enum(["crops", "livestock"]).optional(),
    imageUrl: z.string().max(2000).optional(),
    phone: z.string().max(50).optional(),
    whatsapp: z.string().max(200).optional(),
    active: z.boolean().optional(),
  })
  .strict();

const chatSchema = z.object({
  question: z.string().min(1).max(4000),
  region: z.string().max(100).optional(),
  agroEcology: z.string().max(100).optional(),
  language: z.enum(["en", "am", "om"]).optional(),
});

const recommendQuerySchema = z.object({
  crop: z.string().max(100).optional(),
  season: z.string().max(100).optional(),
});

const marketListQuerySchema = z.object({
  region: z.string().max(100).optional(),
  type: z.string().max(32).optional(),
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const questionsListQuerySchema = z.object({
  status: z.enum(["pending", "answered", "closed"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  questionCreateSchema,
  answerCreateSchema,
  ratingSchema,
  marketCreateSchema,
  marketUpdateSchema,
  chatSchema,
  recommendQuerySchema,
  marketListQuerySchema,
  questionsListQuerySchema,
};
