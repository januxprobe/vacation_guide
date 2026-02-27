import { z } from 'zod';

const localizedStringSchema = z.object({
  nl: z.string(),
  en: z.string(),
});

const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const pricingSchema = z.object({
  adult: z.number(),
  student: z.number().optional(),
  child: z.number().optional(),
  guidedTour: z.number().optional(),
  notes: localizedStringSchema.optional(),
});

const openingHoursSchema = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
});

const mediaItemSchema = z.object({
  type: z.enum(['image', 'video']),
  src: z.string(),
  alt: localizedStringSchema,
});

export const attractionSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  category: z.enum([
    'monument',
    'church',
    'palace',
    'museum',
    'neighborhood',
    'nature',
  ]),
  description: localizedStringSchema,
  coordinates: coordinatesSchema,
  pricing: pricingSchema,
  duration: z.number(),
  priority: z.enum(['essential', 'recommended', 'optional']),
  images: z.array(z.string()),
  thumbnail: z.string().optional(),
  media: z.array(mediaItemSchema).optional(),
  bookingRequired: z.boolean(),
  openingHours: openingHoursSchema.optional(),
  website: z.string().optional(),
  tips: localizedStringSchema.optional(),
});

export type AttractionInput = z.infer<typeof attractionSchema>;
