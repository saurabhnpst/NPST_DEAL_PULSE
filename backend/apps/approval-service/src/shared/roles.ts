export const ACTOR_ROLES = ['SALES_REPRESENTATIVE', 'SALES_MANAGER', 'PNL_HEAD', 'ADMIN'] as const;

export type ActorRole = (typeof ACTOR_ROLES)[number];

export type HistoryActorRole = ActorRole | 'SYSTEM';

export const SYSTEM_ACTOR_ID = 'system';
