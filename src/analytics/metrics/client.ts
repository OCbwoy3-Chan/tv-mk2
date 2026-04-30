import {onAppStateChange} from '#/lib/appState'
import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
import {Sentry} from '#/logger/sentry/lib'
import * as env from '#/env'

type Event<M extends Record<string, any>> = {
  source: 'app'
  time: number
  event: keyof M
  payload: M[keyof M]
  metadata: Record<string, any>
}

const logger = Logger.create(Logger.Context.Metric, {})

export class MetricsClient<M extends Record<string, any>> {
  maxBatchSize = 100

  private started: boolean = false
  private queue: Event<M>[] = []
  private failedQueue: Event<M>[] = []
  private flushInterval: NodeJS.Timeout | null = null

  start() {
    if (this.started) return
    this.started = true
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 10_000)
    onAppStateChange(state => {
      if (state === 'active') {
        this.retryFailedLogs()
      } else {
        this.flush()
      }
    })
  }

  track<E extends keyof M>(
    event: E,
    payload: M[E],
    metadata: Record<string, any> = {},
  ) {
    this.start()

    const e: Event<M> = {
      source: 'app',
      time: Date.now(),
      event,
      payload,
      metadata,
    }
    this.queue.push(e)

    logger.debug(`event: ${e.event as string}`, e)

    if (this.queue.length > this.maxBatchSize) {
      this.flush()
    }
  }

  flush() {
    if (!this.queue.length) return
    const events = this.queue.splice(0, this.queue.length)
    void this.sendBatch(events)
  }

  private async sendBatch(events: Event<M>[], isRetry: boolean = false) {
    logger.debug(`sendBatch: ${events.length}`, {
      isRetry,
    })

    const metricsApiHost = env.METRICS_API_HOST
    if (metricsApiHost) {
      await this.sendBatchToEndpoint(metricsApiHost, events, isRetry)
      return
    }

    if (env.SENTRY_DSN) {
      this.sendBatchToSentry(events)
      return
    }

    logger.debug(`No metrics transport configured`, {
      eventCount: events.length,
    })
  }

  private async sendBatchToEndpoint(
    endpoint: string,
    events: Event<M>[],
    isRetry: boolean = false,
  ) {
    try {
      const body = JSON.stringify({events})
      if (env.IS_WEB && 'navigator' in globalThis && navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          endpoint,
          new Blob([body], {type: 'application/json'}),
        )
        if (!success) {
          // construct a "network error" for `isNetworkError` to work
          throw new Error(`Failed to fetch: sendBeacon returned false`)
        }
      } else {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({events}),
          keepalive: true,
        })

        if (!res.ok) {
          const error = await res.text().catch(() => 'Unknown error')
          // construct a "network error" for `isNetworkError` to work
          throw new Error(`${res.status} Failed to fetch — ${error}`)
        }
      }
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        if (isRetry) return // retry once
        this.failedQueue.push(...events)
        return
      }
      logger.error(`Failed to send metrics`, {
        safeMessage: String(e),
      })
    }
  }

  private sendBatchToSentry(events: Event<M>[]) {
    for (const event of events) {
      Sentry.captureMessage(`metric:${String(event.event)}`, {
        level: 'info',
        fingerprint: ['metric', String(event.event)],
        tags: {
          metric_name: String(event.event),
          metric_source: event.source,
        },
        extra: {
          logger: 'metric',
          eventTime: event.time,
          payload: event.payload,
          metadata: event.metadata,
        },
      })
    }
  }

  private retryFailedLogs() {
    if (!this.failedQueue.length) return
    const events = this.failedQueue.splice(0, this.failedQueue.length)
    void this.sendBatch(events, true)
  }
}
