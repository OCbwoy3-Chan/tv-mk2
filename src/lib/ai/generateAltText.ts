import {type AtpAgent} from '@atproto/api'
import {z} from 'zod'

import {
  COCORE_INFERENCE_LXM,
  COCORE_SERVICE_AUTH_AUD,
  DEFAULT_ALT_TEXT_AI_PROMPT,
  MAX_ALT_TEXT,
} from '#/lib/constants'
import {logger} from '#/logger'
import {type AltTextAiConfig} from '#/state/preferences/openrouter'

const responseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.union([
          z.string(),
          z.array(z.object({type: z.string(), text: z.string().optional()})),
        ]),
      }),
    }),
  ),
})

const cocoreModelDirectorySchema = z.object({
  models: z.array(
    z.object({
      modelId: z.string(),
      machineCount: z.number(),
      recommended: z.boolean().optional(),
      vision: z.boolean(),
      activity: z
        .object({
          week: z.object({requests: z.number()}).optional(),
        })
        .optional(),
    }),
  ),
  appviewUnreachable: z.boolean().optional(),
})

type CocoreModel = z.infer<typeof cocoreModelDirectorySchema>['models'][number]

let cocoreModelCache: {model: string; expiresAt: number} | undefined

export function getChatCompletionsUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error('The AI API URL must start with http:// or https://')
  }
  return normalized.endsWith('/chat/completions')
    ? normalized
    : `${normalized}/chat/completions`
}

export function selectBestCocoreVisionModel(
  models: CocoreModel[],
): string | undefined {
  const available = models.filter(
    model => model.machineCount > 0 && model.modelId.toLowerCase() !== 'stub',
  )
  const declaredVisionModels = available.filter(model => model.vision)
  const candidates =
    declaredVisionModels.length > 0 ? declaredVisionModels : available

  return [...candidates].sort((a, b) => {
    if (a.machineCount !== b.machineCount) {
      return b.machineCount - a.machineCount
    }
    if (!!a.recommended !== !!b.recommended) {
      return a.recommended ? -1 : 1
    }
    const activityDifference =
      (b.activity?.week?.requests ?? 0) - (a.activity?.week?.requests ?? 0)
    return activityDifference || a.modelId.localeCompare(b.modelId)
  })[0]?.modelId
}

export function cleanGeneratedAltText(content: string): string {
  let text = content.trim()
  const reasoningEndTags = ['</think>', '</analysis>']
  let lastReasoningEnd = -1
  let lastReasoningEndLength = 0

  for (const tag of reasoningEndTags) {
    const index = text.toLowerCase().lastIndexOf(tag)
    if (index > lastReasoningEnd) {
      lastReasoningEnd = index
      lastReasoningEndLength = tag.length
    }
  }
  if (lastReasoningEnd >= 0) {
    text = text.slice(lastReasoningEnd + lastReasoningEndLength)
  }

  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
    .trim()
}

async function getBestCocoreVisionModel(baseUrl: string): Promise<string> {
  if (cocoreModelCache && cocoreModelCache.expiresAt > Date.now()) {
    return cocoreModelCache.model
  }
  const response = await fetch(
    `${baseUrl.trim().replace(/\/+$/, '')}/models?view=directory`,
  )
  if (!response.ok) {
    throw new Error(`Unable to load co/core vision models: ${response.status}`)
  }

  const directory = cocoreModelDirectorySchema.parse(await response.json())
  if (directory.appviewUnreachable) {
    throw new Error('The co/core model directory is temporarily unavailable')
  }
  const model = selectBestCocoreVisionModel(directory.models)
  if (!model) {
    throw new Error('No co/core model is currently online')
  }
  cocoreModelCache = {model, expiresAt: Date.now() + 30_000}
  return model
}

async function getCocoreServiceAuthToken(agent: AtpAgent): Promise<string> {
  const directAgent =
    'cloneWithoutProxy' in agent &&
    typeof agent.cloneWithoutProxy === 'function'
      ? (agent.cloneWithoutProxy() as AtpAgent)
      : agent.clone()
  directAgent.configureProxy(null)
  const {data} = await directAgent.com.atproto.server.getServiceAuth({
    aud: COCORE_SERVICE_AUTH_AUD,
    lxm: COCORE_INFERENCE_LXM,
  })
  return data.token
}

export async function generateAltText(
  config: AltTextAiConfig,
  imageBase64: string,
  imageMimeType: string,
  agent?: AtpAgent,
): Promise<string> {
  let model = config.model
  let apiKey = config.apiKey
  if (config.provider === 'cocore') {
    if (!agent && !apiKey) {
      throw new Error('An authenticated AT Protocol session is required')
    }
    const [resolvedModel, serviceAuthToken] = await Promise.all([
      model ?? getBestCocoreVisionModel(config.baseUrl),
      apiKey ?? getCocoreServiceAuthToken(agent!),
    ])
    model = resolvedModel
    apiKey = serviceAuthToken
  }
  if (!model) {
    throw new Error('No vision model is configured')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://witchsky.app'
    headers['X-Title'] = 'Witchsky'
  }

  const response = await fetch(getChatCompletionsUrl(config.baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: config.prompt || DEFAULT_ALT_TEXT_AI_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: MAX_ALT_TEXT,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error('AI alt text API error', {
      provider: config.provider,
      status: response.status,
      error: errorText,
    })
    if (
      config.provider === 'cocore' &&
      response.status === 401 &&
      errorText.includes('onboarding_required')
    ) {
      throw new Error('Connect your account at cocore.dev once, then try again')
    }
    throw new Error(`AI alt text API error: ${response.status}`)
  }

  const data = responseSchema.parse(await response.json())
  const content = data.choices?.[0]?.message?.content
  const rawAltText =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content
            .filter(
              (part): part is {type: string; text: string} =>
                part.type === 'text' && typeof part.text === 'string',
            )
            .map(part => part.text)
            .join('')
        : undefined
  const altText = rawAltText ? cleanGeneratedAltText(rawAltText) : undefined

  if (!altText) {
    throw new Error('No alt text generated')
  }

  return altText
}
