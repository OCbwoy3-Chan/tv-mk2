import {useQuery} from '@tanstack/react-query'
import {z} from 'zod'

import {STALE} from '#/state/queries'

const MODELS_URL =
  'https://openrouter.ai/api/v1/models?input_modalities=image&output_modalities=text&sort=most-popular'

const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  architecture: z.object({
    input_modalities: z.array(z.string()),
    output_modalities: z.array(z.string()),
  }),
})

const responseSchema = z.object({data: z.array(modelSchema)})

export type OpenRouterModel = z.infer<typeof modelSchema>

export function useOpenRouterVisionModelsQuery() {
  return useQuery({
    queryKey: ['openrouter-models', 'image-to-text'],
    staleTime: STALE.HOURS.ONE,
    async queryFn(): Promise<OpenRouterModel[]> {
      const response = await fetch(MODELS_URL, {
        headers: {Accept: 'application/json'},
      })
      if (!response.ok) {
        throw new Error(`OpenRouter model list returned ${response.status}`)
      }

      const parsed = responseSchema.parse(await response.json())
      return parsed.data.filter(
        model =>
          model.architecture.input_modalities.includes('image') &&
          model.architecture.output_modalities.includes('text'),
      )
    },
  })
}
