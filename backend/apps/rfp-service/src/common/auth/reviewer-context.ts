import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Until Auth Service guards are wired, reviewers are identified by header.
 * Permission: `rfp:review` (documented — enforce when global auth lands).
 */
export function resolveReviewerId(req: Request): string {
  const header =
    req.headers['x-reviewer-id']?.toString().trim() ||
    req.headers['x-user-id']?.toString().trim();
  if (!header) {
    throw new BadRequestException(
      'Reviewer identity required (X-Reviewer-Id or X-User-Id header)',
    );
  }
  return header;
}

export function optionalReviewerId(req: Request): string | undefined {
  return (
    req.headers['x-reviewer-id']?.toString().trim() ||
    req.headers['x-user-id']?.toString().trim() ||
    undefined
  );
}