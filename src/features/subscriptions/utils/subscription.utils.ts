import type { Subscription } from '@/lib/types'

const DROP_IN_VALIDITY_MS = 24 * 60 * 60 * 1000

export function isActiveDropIn(item: Subscription): boolean {
  return item.packageTier === 'DROP_IN' && item.status === 'ACTIVE'
}

export function getSubscriptionExpiration(item: Subscription): string | null {
  if (!isActiveDropIn(item)) return item.endDate

  if (!item.createdAt) return null
  const purchasedAt = new Date(item.createdAt).getTime()
  // Never substitute startDate for a missing/invalid purchase timestamp.
  if (!Number.isFinite(purchasedAt)) return null
  return new Date(purchasedAt + DROP_IN_VALIDITY_MS).toISOString()
}

export function getSubscriptionBenefits(item: Subscription) {
  // A subscription's explicit entitlement takes precedence over the catalog plan.
  const unlimitedGym = item.hasUnlimitedGymAccess ?? item.plan?.unlimitedGymEntry ?? false
  return {
    unlimitedGym,
    showGroup:
      !unlimitedGym &&
      ((item.plan?.groupSessionQuota ?? 0) > 0 || (item.remainingGroupSessions ?? 0) > 0),
    showPt:
      item.packageTier === 'VIP' ||
      (item.plan?.ptSessionQuota ?? 0) > 0 ||
      (item.remainingPtSessions ?? 0) > 0,
  }
}
