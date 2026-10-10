/**
 * Form schemas for the `social` service (ADR 0022), shared by the renderer forms and main.
 *
 * Limits are the service's, checked against `social/src/routes/schemas.ts` at commit 75eb1ce of
 * DyingStar-game/services. Messages are i18n keys (`forms.errors.*`), translated where shown.
 */
import { z } from 'zod'

/** Organisation name: 3 to 48 characters. */
export const organisationName = z
  .string()
  .trim()
  .min(3, 'forms.errors.organisationName')
  .max(48, 'forms.errors.organisationName')

/** Organisation ticker: 2 to 5 letters or digits, upper-cased. */
export const organisationTicker = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{2,5}$/, 'forms.errors.organisationTicker')
  .transform((ticker) => ticker.toUpperCase())

/** Creating an organisation. */
export const createOrganisationSchema = z.object({
  name: organisationName,
  ticker: organisationTicker
})

/** What the create form edits. */
export type CreateOrganisationInput = z.input<typeof createOrganisationSchema>
/** What main sends to `social`. */
export type CreateOrganisation = z.output<typeof createOrganisationSchema>

/** Profile texts limits (`profilePatchBody`). */
const PROFILE_LIMITS = {
  faction: 64,
  biography: 2000,
  characterName: 64,
  alignment: 32,
  story: 4000
} as const

/** A profile text: trimmed, at most `max` characters (empty means "none"). */
const profileText = (field: keyof typeof PROFILE_LIMITS): z.ZodString =>
  z.string().trim().max(PROFILE_LIMITS[field], `forms.errors.${field}`)

/** What the profile form edits (ADR 0020); every field may be empty. */
export const profileFormSchema = z.object({
  faction: profileText('faction'),
  biography: profileText('biography'),
  characterName: profileText('characterName'),
  alignment: profileText('alignment'),
  story: profileText('story')
})

export type ProfileForm = z.infer<typeof profileFormSchema>

/** Maximum length of each profile field, for the inputs' counters. */
export const profileLimits: Readonly<Record<keyof ProfileForm, number>> = PROFILE_LIMITS

/** `PATCH /api/me` body: only changed fields; `null` clears one; the role-play sheet is sent whole. */
export const profilePatchSchema = z
  .object({
    faction: profileText('faction').nullable().optional(),
    biography: profileText('biography').nullable().optional(),
    rpSheet: z
      .object({
        characterName: profileText('characterName').optional(),
        alignment: profileText('alignment').optional(),
        story: profileText('story').optional()
      })
      .nullable()
      .optional()
  })
  .refine((patch) => Object.keys(patch).length > 0, 'forms.errors.nothingChanged')

export type ProfilePatch = z.infer<typeof profilePatchSchema>

const RP_FIELDS = ['characterName', 'alignment', 'story'] as const

/**
 * The patch for what changed between the loaded profile and the form (ADR 0020): an emptied
 * text becomes `null`; the role-play sheet, replaced whole by `social`, is sent with its
 * non-empty fields when one of them changed, or `null` when all three are empty.
 */
export function toProfilePatch(initial: ProfileForm, values: ProfileForm): ProfilePatch {
  const patch: ProfilePatch = {}
  const text = (value: string): string | null => value.trim() || null
  for (const field of ['faction', 'biography'] as const) {
    if (values[field].trim() !== initial[field].trim()) patch[field] = text(values[field])
  }
  if (RP_FIELDS.some((field) => values[field].trim() !== initial[field].trim())) {
    const sheet = Object.fromEntries(
      RP_FIELDS.filter((field) => values[field].trim()).map((field) => [
        field,
        values[field].trim()
      ])
    )
    patch.rpSheet = Object.keys(sheet).length > 0 ? sheet : null
  }
  return patch
}

/** Corporation recruitment modes (`CORPORATION_RECRUITMENT_MODES`). */
export const RECRUITMENT_MODES = ['open', 'apply', 'closed'] as const

/** What the organisation details form edits (ADR 0021); the description is BBCode. */
export const organisationDetailsFormSchema = z.object({
  name: organisationName,
  ticker: organisationTicker,
  description: z.string().trim().max(2000, 'forms.errors.description'),
  recruitment: z.enum(RECRUITMENT_MODES)
})

export type OrganisationDetailsInput = z.input<typeof organisationDetailsFormSchema>
export type OrganisationDetails = z.output<typeof organisationDetailsFormSchema>

/** `PATCH /api/corporations/:id` body: changed fields only; `null` clears the description. */
export const organisationPatchSchema = z
  .object({
    name: organisationName.optional(),
    ticker: organisationTicker.optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    recruitment: z.enum(RECRUITMENT_MODES).optional()
  })
  .refine((patch) => Object.keys(patch).length > 0, 'forms.errors.nothingChanged')

export type OrganisationPatch = z.input<typeof organisationPatchSchema>

/** The changed details (ADR 0021): an emptied description becomes `null`. */
export function toOrganisationPatch(
  initial: OrganisationDetails,
  values: OrganisationDetails
): OrganisationPatch {
  const patch: OrganisationPatch = {}
  if (values.name !== initial.name) patch.name = values.name
  if (values.ticker !== initial.ticker) patch.ticker = values.ticker
  if (values.description !== initial.description) patch.description = values.description || null
  if (values.recruitment !== initial.recruitment) patch.recruitment = values.recruitment
  return patch
}

/** The corporation permissions the launcher shows on a rank (`CORPORATION_PERMISSIONS`). */
export const ORGANISATION_PERMISSIONS = [
  'manage_corporation',
  'manage_ranks',
  'manage_members',
  'invite',
  'recruit'
] as const

export type OrganisationPermission = (typeof ORGANISATION_PERMISSIONS)[number]

/** A rank as the rank form edits it (`rankBody`): name 1–32, priority 0–99. */
export const rankFormSchema = z.object({
  name: z.string().trim().min(1, 'forms.errors.rankName').max(32, 'forms.errors.rankName'),
  priority: z
    .number({ error: 'forms.errors.rankPriority' })
    .int('forms.errors.rankPriority')
    .min(0, 'forms.errors.rankPriority')
    .max(99, 'forms.errors.rankPriority'),
  permissions: z.array(z.enum(ORGANISATION_PERMISSIONS)),
  isDefault: z.boolean()
})

export type RankForm = z.infer<typeof rankFormSchema>

/** `POST` / `PATCH /api/corporations/:id/ranks` body; every permission string is kept as is. */
export const rankInputSchema = z
  .object({
    name: z.string().trim().min(1).max(32).optional(),
    priority: z.number().int().min(0).max(99).optional(),
    permissions: z.array(z.string().trim().min(1).max(64)).optional(),
    isDefault: z.boolean().optional()
  })
  .refine((rank) => Object.keys(rank).length > 0, 'forms.errors.nothingChanged')

export type RankInput = z.infer<typeof rankInputSchema>
