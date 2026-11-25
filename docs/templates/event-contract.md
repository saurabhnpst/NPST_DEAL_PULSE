# Event Contract — [EventName]

**Event type:** [EventName]  
**Schema version:** [1]  
**Producer:** [service]  
**Consumers:** [services]  
**Scope tag:** [Scope 1 / Scope 2]

## Meaning

[Business fact represented by this event. Past tense.]

## Envelope

```ts
interface EventEnvelope<T> {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  occurredAt: string;
  producer: string;
  correlationId: string;
  causationId?: string;
  payload: T;
}
```

## Payload

```ts
interface Payload {
  [field]: [type];
}
```

## Permissions and Privacy

- Do not include secrets, tokens, document bodies or sensitive commercial attachments.
- Include identifiers and safe summaries only.

## Delivery Guarantees

- At-least-once delivery. Consumers must be idempotent.
- Retry with backoff and dead-letter handling for critical workflows.
- Outbox pattern for state change plus event publication where required.

## Consumer Rules

1. Validate envelope and schema version.
2. Check idempotency key.
3. Authorize any state mutation.
4. Apply transition.
5. Write audit record.
6. Emit follow-up events only after successful commit.

## Versioning

- Additive changes: [allowed with default handling]
- Breaking changes: new schema version
- Unknown version: [route to review/dead-letter]

## Open Questions

- [TBD]
