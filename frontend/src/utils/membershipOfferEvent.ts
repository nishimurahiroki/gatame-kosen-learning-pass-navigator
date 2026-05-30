/** Annual Membership オファーシートを開く（Bottom Bar・Watch Video 等が購読）。 */
export const GATAME_OPEN_MEMBERSHIP_OFFER_EVENT = 'gatame-open-membership-offer'

export type OpenMembershipOfferEventDetail = {
  /** 学習パス完了モーダル等より前面に表示 */
  elevated?: boolean
}

export function openMembershipOffer(detail?: OpenMembershipOfferEventDetail): void {
  window.dispatchEvent(new CustomEvent(GATAME_OPEN_MEMBERSHIP_OFFER_EVENT, { detail: detail ?? {} }))
}
