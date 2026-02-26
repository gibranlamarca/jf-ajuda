import { z } from 'zod'
import { HELP_TYPES } from '@/types'

export const createRequestSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(150, 'Título muito longo'),
  description: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(800, 'Descrição deve ter no máximo 800 caracteres'),
  helpTypes: z
    .array(z.enum(HELP_TYPES))
    .min(1, 'Selecione pelo menos um tipo de ajuda'),
  urgency: z.number().int().min(1).max(5),
  neighborhood: z
    .string()
    .min(2, 'Informe o bairro')
    .max(100, 'Nome do bairro muito longo'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  addressLabel: z.string().max(300).optional().nullable(),
  contactName: z.string().max(100).optional().nullable(),
  contactPhone: z
    .string()
    .regex(/^[\d\s\(\)\-\+]{10,20}$/, 'Telefone inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  _hp: z.string().optional(), // honeypot — must be empty
})

export const resolveRequestSchema = z.object({
  token: z.string().min(1, 'Informe o código de resolução').max(128),
})

export const reportSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(5, 'Comentário deve ter pelo menos 5 caracteres')
    .max(300, 'Comentário deve ter no máximo 300 caracteres'),
  _hp: z.string().optional(),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>
