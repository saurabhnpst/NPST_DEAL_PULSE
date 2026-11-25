/** Normalize gateway / service JSON envelopes to the payload value. */
export function unwrapApiBody(body) {
  if (body != null && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data;
  }
  return body;
}