export interface GameServerRecord {
  id: string;
  serverId: string;
  name: string;
  apiUrl: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameServerInput {
  serverId: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  enabled?: boolean;
}

export interface UpdateGameServerInput {
  name?: string;
  apiUrl?: string;
  apiKey?: string;
  enabled?: boolean;
}

export interface ServerHealthStatus {
  serverId: string;
  name: string;
  online: boolean;
  latencyMs: number | null;
  error: string | null;
  checkedAt: string;
}

/** Subset of mod API /api/Server/Stats response */
export interface ModServerStats {
  uptime?: number;
  serverName?: string;
  onlinePlayers?: number;
  maxOnlinePlayers?: number;
  zombies?: number;
  animals?: number;
  entities?: number;
  fps?: number;
  isBloodMoon?: boolean;
  gameWorld?: string;
  gameName?: string;
  serverVersion?: string;
  [key: string]: unknown;
}

export interface ModPlayerPosition {
  x: number;
  y: number;
  z: number;
}

export interface ModPlayerDetails {
  isAdmin?: boolean;
  position?: ModPlayerPosition;
  lastLogin?: string;
  playerKills?: number;
  zombieKills?: number;
  deaths?: number;
  skillPoints?: number;
  pointsCount?: number;
  level?: number;
  totalTimePlayed?: number;
  longestLife?: number;
  currentLife?: number;
}

export interface ModOnlinePlayer {
  playerId: string;
  playerName: string;
  entityId: number;
  platformId?: string;
  ip?: string;
  ping?: number;
  gameStage?: number;
  playerDetails?: ModPlayerDetails;
  position?: ModPlayerPosition;
  serverId?: string;
  serverName?: string;
  gameServerId?: string;
}

export interface ModHistoryPlayer {
  playerId: string;
  playerName: string;
  entityId: number;
  platformId?: string;
  isOffline?: boolean;
  playerDetails?: ModPlayerDetails;
}

export interface ModPagedResult<T> {
  items: T[];
  total: number;
}

export type HistoryPlayerSortField =
  | 'PlayerName'
  | 'Level'
  | 'IsOffline'
  | 'ZombieKills'
  | 'PlayerKills'
  | 'Deaths'
  | 'SkillPoints'
  | 'LastLogin'
  | 'TotalTimePlayed'
  | 'LongestLife'
  | 'EntityId'
  | 'PointsCount';

export interface PanelPlayer {
  id: string;
  platformId: string;
  displayName: string;
  points: number;
  lastSignInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PanelCdKey {
  id: string;
  modId: number;
  code: string;
  redeemCount: number;
  maxRedeemCount: number;
  expiresAt: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  items: CdKeyItem[];
  commands: CdKeyCommand[];
}

export interface CdKeyItem {
  id: string;
  cdKeyId: string;
  itemName: string;
  count: number;
  quality: number;
  durability: number;
  description?: string | null;
  sortOrder: number;
}

export interface CdKeyCommand {
  id: string;
  cdKeyId: string;
  command: string;
  inMainThread: boolean;
  description?: string | null;
  sortOrder: number;
}

export interface ModCdKeyRedeemSettings {
  isEnabled: boolean;
  hasAlreadyRedeemedTip: string;
  hasReachedMaxRedemptionLimitTip: string;
  hasRedemptionCodeExpiredTip: string;
  redeemSuccessTip: string;
}

export interface CdKeyRedemptionRecord {
  id: string;
  index: number;
  key: string;
  createdAt: string;
  platformId: string;
  playerName: string;
}

export interface ClusterWebSocketMessage {
  serverId: string;
  serverName: string;
  panelServerId: string;
  modEventType: string;
  data?: unknown;
  receivedAt: string;
}

export interface DashboardSummary {
  serverCount: number;
  serversOnline: number;
  totalOnlinePlayers: number;
  totalRegisteredPlayers: number;
  servers: Array<{
    id: string;
    serverId: string;
    name: string;
    online: boolean;
    latencyMs: number | null;
    stats: ModServerStats | null;
    error: string | null;
  }>;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface AdminUserPublic {
  id: string;
  username: string;
}

export interface AuthStatus {
  setupRequired: boolean;
  authenticated: boolean;
  user: AdminUserPublic | null;
}

export interface ModGameStoreSettings {
  isEnabled: boolean;
  queryListCmd: string;
  buyCmdPrefix: string;
  goodsItemTip: string;
  buySuccessTip: string;
  pointsNotEnoughTip: string;
  noGoods: string;
}

export interface ModGoods {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  createdAt?: string;
}

export interface ModItemListEntry {
  id: number;
  itemName?: string;
  count?: number;
  quality?: number;
  durability?: number;
  [key: string]: unknown;
}

export interface ModCommandListEntry {
  id: number;
  command?: string;
  inMainThread?: boolean;
  description?: string | null;
  [key: string]: unknown;
}

export interface ModPointsSystemSettings {
  isEnabled: boolean;
  signInCmd: string;
  signInInterval: number;
  signInRewardPoints: number;
  signInSuccessTip: string;
  signInFailureTip: string;
  queryPointsCmd: string;
  queryPointsTip: string;
  isCurrencyExchangeEnabled: boolean;
  currencyToPointsExchangeRate: number;
  currencyExchangeCmd: string;
  exchangeSuccessTip: string;
  exchangeFailureTip: string;
}

export interface ModPointsInfo {
  id: string;
  playerName?: string | null;
  points: number;
  lastSignInAt?: string | null;
  createdAt?: string;
}

export interface PointLogSettings {
  id: string;
  enabled: boolean;
  retentionDays: number;
  shopPurchase: boolean;
  signIn: boolean;
  pointsTransfer: boolean;
  teleport: boolean;
  killReward: boolean;
  lottery: boolean;
  redeemCode: boolean;
  levelGift: boolean;
  vipGift: boolean;
  webPanel: boolean;
  externalMod: boolean;
  other: boolean;
  updatedAt: string;
}

export interface PointLogEntry {
  id: string;
  playerId: string;
  playerName: string;
  category: string;
  type: string;
  change: number;
  balance: number;
  note: string | null;
  gameServerId: string | null;
  createdAt: string;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ClusterSyncResult {
  serverId: string;
  serverName: string;
  success: boolean;
  error?: string;
}

export interface ClusterSaveResponse<T> {
  settings?: T;
  product?: T;
  player?: T;
  sync: ClusterSyncResult[];
}

export interface ShopProductItem {
  id: string;
  productId: number;
  itemName: string;
  count: number;
  quality: number;
  durability: number;
  description?: string | null;
  sortOrder: number;
}

export interface ShopProductCommand {
  id: string;
  productId: number;
  command: string;
  inMainThread: boolean;
  description?: string | null;
  sortOrder: number;
}

export interface ShopProduct {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ShopProductItem[];
  commands: ShopProductCommand[];
}

export interface ModLotterySettings {
  isEnabled: boolean;
  queryListCmd: string;
  drawCmdPrefix: string;
  drawCost: number;
  drawInterval: number;
  poolItemTip: string;
  drawSuccessTip: string;
  pointsNotEnoughTip: string;
  coolingTip: string;
  noPoolTip: string;
}

export interface LotteryPoolItem {
  id: string;
  lotteryPoolId: number;
  itemName: string;
  count: number;
  quality: number;
  durability: number;
  description?: string | null;
  sortOrder: number;
}

export interface LotteryPoolCommand {
  id: string;
  lotteryPoolId: number;
  command: string;
  inMainThread: boolean;
  description?: string | null;
  sortOrder: number;
}

export interface LotteryPool {
  id: number;
  name: string;
  drawCost: number;
  weight: number;
  isEnabled: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  items: LotteryPoolItem[];
  commands: LotteryPoolCommand[];
}

export interface ModMuteCommandSettings {
  isEnabled: boolean;
  mutedCommands: string[];
  mutedTip: string;
}

export interface ChunkResetResult {
  resetCount: number;
  skippedCount: number;
  message: string;
}

export interface ModVipGiftSettings {
  isEnabled: boolean;
  claimCmd: string;
  hasClaimedTip: string;
  nonVipTip: string;
  claimSuccessTip: string;
}

export interface VipGiftItem {
  id: string;
  vipGiftId: string;
  itemName: string;
  count: number;
  quality: number;
  durability: number;
  description?: string | null;
  sortOrder: number;
}

export interface VipGiftCommand {
  id: string;
  vipGiftId: string;
  command: string;
  inMainThread: boolean;
  description?: string | null;
  sortOrder: number;
}

export interface VipGiftRecord {
  id: string;
  displayName: string;
  name: string;
  claimState: boolean;
  totalClaimCount: number;
  lastClaimAt: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  items: VipGiftItem[];
  commands: VipGiftCommand[];
}

export interface ModLevelGiftSettings {
  isEnabled: boolean;
  claimCmd: string;
  hasClaimedTip: string;
  levelNotEnoughTip: string;
  noGiftTip: string;
  claimSuccessTip: string;
}

export interface LevelGiftItem {
  id: string;
  levelGiftId: string;
  itemName: string;
  count: number;
  quality: number;
  durability: number;
  description?: string | null;
  sortOrder: number;
}

export interface LevelGiftCommand {
  id: string;
  levelGiftId: string;
  command: string;
  inMainThread: boolean;
  description?: string | null;
  sortOrder: number;
}

export interface LevelGiftRecord {
  id: string;
  giftType: string;
  displayName: string;
  name: string;
  requiredLevel: number;
  claimState: boolean;
  totalClaimCount: number;
  lastClaimAt: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  items: LevelGiftItem[];
  commands: LevelGiftCommand[];
}

export type PvpKillMode = 'none' | 'allies' | 'strangers' | 'everyone';
export type PvpDropMode = 'none' | 'all' | 'toolbelt' | 'backpack' | 'delete_all';

export interface ModPvpAreaSettings {
  isEnabled: boolean;
  killMode: PvpKillMode;
  dropOnDeath: PvpDropMode;
  onlineLandClaimBonus: number;
  offlineLandClaimBonus: number;
  defaultNoticeBuff: string;
}

export interface ModPvpArea {
  id: string;
  areaNote: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  areaNoticeBuff: string;
  killMode: PvpKillMode;
  dropOnDeath: PvpDropMode;
  onlineLandClaimBonus: number;
  offlineLandClaimBonus: number;
  invulnerableClaim: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface PvpAreaSummary {
  total: number;
  pvp: number;
  pve: number;
  invulnerableClaim: number;
}

export interface PvpAreaPageData {
  settings: ModPvpAreaSettings;
  areas: ModPvpArea[];
  summary: PvpAreaSummary;
}

export interface ServerSaveResponse<T> {
  data: T;
  sync: ClusterSyncResult[];
}

export interface ModSettingsTrigger {
  isEnabled: boolean;
  executeCommands: string[];
}

export interface ModAutoRestart {
  isEnabled: boolean;
  restartHour: number;
  restartMinute: number;
  messages: string[];
}

export interface ModGlobalSettings {
  isEnabled: boolean;
  globalServerName: string;
  whisperServerName: string;
  chatCommandPrefix: string;
  chatCommandSeparator: string;
  handleChatMessageError: string;
  teleZombieCheck: boolean;
  teleDisableTip: string;
  killZombieTrigger: ModSettingsTrigger;
  deathTrigger: ModSettingsTrigger;
  autoRestart: ModAutoRestart;
  blockFamilySharingAccount: boolean;
  removeSleepingBagFromPOI: boolean;
  removeSleepingBagFromPoiTip: string | null;
  isEnablePlayerInitialSpawnPoint: boolean;
  playerInitialPosition: string | null;
  enableFallingBlockProtection: boolean;
  enableLandClaimProtection: boolean;
  landClaimProtectionTip: string | null;
  enableTraderAreaProtection: boolean;
  traderAreaProtectionTip: string | null;
  enableAutoZombieCleanup: boolean;
  autoZombieCleanupThreshold: number;
  enableXmlsSecondaryOverwrite: boolean;
  hideCommandInChat: boolean;
}

export interface ModGameNoticeSettings {
  isEnabled: boolean;
  welcomeNotice: string;
  rotatingNotices: string[];
  rotatingInterval: number;
  bloodMoonNotice1: string;
  bloodMoonNotice2: string;
  bloodMoonNotice3: string;
}

export interface ModAutoBackupSettings {
  isEnabled: boolean;
  interval: number;
  retainedFileCountLimit: number;
  resetIntervalAfterManualBackup: boolean;
  skipIfThereAreNoPlayers: boolean;
  autoBackupOnServerStartup: boolean;
  archiveFolder: string;
}

export interface ModBackupFile {
  name: string;
  createdAt: string;
  size: number;
  serverVersion: string;
  gameWorld: string;
  gameName: string;
  days: number;
  hours: number;
}

export interface ModChatRecord {
  id: number;
  createdAt: string;
  entityId: number;
  playerId?: string | null;
  senderName: string;
  chatType: string;
  message: string;
}

export interface ModAdminEntry {
  playerId: string;
  permissionLevel: number;
  displayName: string;
}

export interface ModPermissionEntry {
  command: string;
  permissionLevel: number;
  description?: string | null;
}

export interface ModBlacklistEntry {
  playerId: string;
  displayName: string;
  reason?: string | null;
  bannedUntil: string;
}

export interface ModWhitelistEntry {
  playerId: string;
  displayName: string;
}

export interface ModAllowedCommand {
  commands: string;
  permissionLevel: number;
  description?: string | null;
  help?: string | null;
}

export interface ModMapInfo {
  blockSize: number;
  maxZoom: number;
}

export interface ModTeleportHomeSettings {
  isEnabled: boolean;
  queryListCmd: string;
  teleInterval: number;
  setHomeCmdPrefix: string;
  setCountLimit: number;
  pointsRequiredForSet: number;
  deleteHomeCmdPrefix: string;
  teleHomeCmdPrefix: string;
  pointsRequiredForTele: number;
  noHomeTip: string;
  locationItemTip: string;
  overLimitTip: string;
  setPointsNotEnoughTip: string;
  setSuccessTip: string;
  overwriteSuccessTip: string;
  deleteSuccessTip: string;
  homeNotFoundTip: string;
  coolingTip: string;
  telePointsNotEnoughTip: string;
  teleSuccessTip: string;
}

export interface ModTeleportCitySettings {
  isEnabled: boolean;
  queryListCmd: string;
  teleCmdPrefix: string;
  teleInterval: number;
  locationItemTip: string;
  teleSuccessTip: string;
  pointsNotEnoughTip: string;
  coolingTip: string;
  noLocation: string;
}

export interface ModTeleportFriendSettings {
  isEnabled: boolean;
  teleCmdPrefix: string;
  teleInterval: number;
  pointsRequired: number;
  teleSuccessTip: string;
  pointsNotEnoughTip: string;
  coolingTip: string;
  targetNotFoundTip: string;
  isFriendBypass: boolean;
  teleConfirmTip: string;
  acceptTele: string;
  rejectTele: string;
  targetRejectTeleTip: string;
  keepDuration: number;
}

export interface ModHomeLocation {
  id: number;
  playerId: string;
  playerName: string;
  homeName: string;
  position: string;
  createdAt?: string;
}

export interface ModCityLocation {
  id: number;
  cityName: string;
  pointsRequired: number;
  position: string;
  viewDirection?: string | null;
  createdAt?: string;
}

export interface ModTaskScheduleSettings {
  isEnabled: boolean;
}

export interface ModTaskSchedule {
  id: number;
  name: string;
  cronExpression: string;
  isEnabled: boolean;
  description?: string | null;
  expressionDescription?: string | null;
  lastRunAt?: string | null;
  createdAt?: string;
}

export interface ModAvailablePrefab {
  name: string;
  localizationName: string;
  fullPath: string;
}

export interface ModPrefabUndoHistory {
  id: number;
  prefabName: string;
  position: string;
  createdAt: string;
}

export interface ModBossKillRewardSettings {
  isEnabled: boolean;
  killTip: string;
  enemyRewardMap: Record<string, number>;
  fallbackReward: number;
}
