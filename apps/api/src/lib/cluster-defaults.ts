export const defaultPointsSystemSettings = {
  isEnabled: false,
  signInCmd: 'si',
  signInInterval: 3600,
  signInRewardPoints: 10,
  signInSuccessTip: '[00FF00]Sign-in successful! You received {SignInRewardPoints} points. Total: {PlayerTotalPoints}',
  signInFailureTip: '[FFFF00]Sign-in failed! Please wait before signing in again.',
  queryPointsCmd: 'points',
  queryPointsTip: '[00FF00]You have {PlayerTotalPoints} points.',
  isCurrencyExchangeEnabled: false,
  currencyToPointsExchangeRate: 1,
  currencyExchangeCmd: 'dh',
  exchangeSuccessTip: '[00FF00]Exchange successful!',
  exchangeFailureTip: '[FFFF00]Exchange failed!',
};

export const defaultGameStoreSettings = {
  isEnabled: false,
  queryListCmd: 'buy',
  buyCmdPrefix: 'buy',
  goodsItemTip:
    '[FFFFFF]Input: [00FF00]buy-{GoodsId} [FFFFFF]buy [00FF00]{GoodsName}[FFFFFF], [00FF00]Price: [FF00FF]{Price}',
  buySuccessTip: '[00FF00]Purchase successful!',
  pointsNotEnoughTip: '[00FF00]Not enough points, need points: {Price}',
  noGoods: '[00FF00]No goods.',
};

export const defaultLotterySettings = {
  isEnabled: false,
  queryListCmd: 'lottery',
  drawCmdPrefix: 'draw',
  drawCost: 10,
  drawInterval: 60,
  poolItemTip: '[00FF00]{PoolId}. {PoolName} - Cost: {DrawCost} - Weight: {Weight}',
  drawSuccessTip: '[00FF00]Congratulations! You won from pool: {PoolName}',
  pointsNotEnoughTip: '[FF0000]Not enough points. This draw costs {DrawCost}.',
  coolingTip: '[FF0000]Please wait before drawing again.',
  noPoolTip: '[FF0000]No lottery pools are available right now.',
};

export const defaultVipGiftSettings = {
  isEnabled: false,
  claimCmd: 'VIP',
  hasClaimedTip: '[00FF00]You have received the gift package~',
  nonVipTip: '[00FF00]You are not a VIP yet~',
  claimSuccessTip: '[00FF00]Congratulations on successfully receiving the gift package: {GiftName}',
};

export const defaultCdKeyRedeemSettings = {
  isEnabled: false,
  hasAlreadyRedeemedTip: '[00FF00] You have already redeemed the CD key.',
  hasReachedMaxRedemptionLimitTip: '[00FF00] You have reached the maximum redemption limit.',
  hasRedemptionCodeExpiredTip: '[00FF00] The redemption code has expired.',
  redeemSuccessTip: '[00FF00] You have successfully redeemed the CD key.',
};

export const defaultLevelGiftSettings = {
  isEnabled: false,
  claimCmd: 'lq',
  hasClaimedTip: '[00FF00]You have already claimed this level gift!',
  levelNotEnoughTip: '[00FF00]Your level is not enough, you need to reach level {RequiredLevel} to claim!',
  noGiftTip: '[00FF00]You have no level gifts available to claim!',
  claimSuccessTip: '[00FF00]Congratulations! You have successfully claimed the {GiftName} gift!',
};
