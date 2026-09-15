// Order health rules engine. Deterministic today; thresholds are centralized
// here (and overridable via env vars) so nothing is hardcoded scattered
// through the codebase. Swap this module out later for something smarter
// without touching callers — the public shape (computeHealth) stays the same.

const THRESHOLDS = {
  unfulfilledNeedsAttentionHours: Number(process.env.HEALTH_UNFULFILLED_ATTENTION_HOURS || 48),
  unfulfilledCriticalHours: Number(process.env.HEALTH_UNFULFILLED_CRITICAL_HOURS || 120),
  trackingStaleNeedsAttentionDays: Number(process.env.HEALTH_TRACKING_STALE_ATTENTION_DAYS || 3),
  trackingStaleCriticalDays: Number(process.env.HEALTH_TRACKING_STALE_CRITICAL_DAYS || 7),
};

function hoursSince(dateStr) {
  if (!dateStr) return null;
  return (Date.now() - new Date(dateStr).getTime()) / 36e5;
}

export function computeHealth(order) {
  // order: { order_status, fulfillment_status, tracking_status,
  //          last_tracking_update, created_at }
  if (order.order_status === 'cancelled') {
    return { status: 'healthy', reason: 'Order cancelled' };
  }

  const isFulfilled = order.fulfillment_status === 'fulfilled';
  const ageHours = hoursSince(order.created_at) ?? 0;
  const trackingAgeDays = order.last_tracking_update
    ? hoursSince(order.last_tracking_update) / 24
    : null;

  // Unfulfilled orders aging past thresholds.
  if (!isFulfilled) {
    if (ageHours >= THRESHOLDS.unfulfilledCriticalHours) {
      return {
        status: 'critical',
        reason: `Unfulfilled for over ${Math.floor(ageHours / 24)} days`,
      };
    }
    if (ageHours >= THRESHOLDS.unfulfilledNeedsAttentionHours) {
      return {
        status: 'needs_attention',
        reason: `Unfulfilled for over ${THRESHOLDS.unfulfilledNeedsAttentionHours} hours`,
      };
    }
  }

  // Fulfilled but tracking has stalled.
  if (isFulfilled && trackingAgeDays !== null) {
    if (
      trackingAgeDays >= THRESHOLDS.trackingStaleCriticalDays ||
      order.tracking_status === 'failure'
    ) {
      return {
        status: 'critical',
        reason:
          order.tracking_status === 'failure'
            ? 'Carrier reported a delivery failure'
            : `Tracking hasn't updated in ${Math.floor(trackingAgeDays)} days`,
      };
    }
    if (trackingAgeDays >= THRESHOLDS.trackingStaleNeedsAttentionDays) {
      return {
        status: 'needs_attention',
        reason: `Tracking hasn't updated in ${Math.floor(trackingAgeDays)} days`,
      };
    }
  }

  return { status: 'healthy', reason: null };
}
