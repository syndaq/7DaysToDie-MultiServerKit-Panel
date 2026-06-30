import type {
  ModAutoBackupSettings,
  ModAutoRestart,
  ModGameNoticeSettings,
  ModGlobalSettings,
  ModMuteCommandSettings,
  ModSettingsTrigger,
  ModTaskScheduleSettings,
  ModTeleportCitySettings,
  ModTeleportFriendSettings,
  ModTeleportHomeSettings,
  ModBossKillRewardSettings,
} from '@msk-panel/shared';

function readBool(record: Record<string, unknown>, key: string, fallback = false): boolean {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  const value = record[key] ?? record[pascal];
  return value == null ? fallback : Boolean(value);
}

function readString(record: Record<string, unknown>, key: string, fallback = ''): string {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  const value = record[key] ?? record[pascal];
  return value == null ? fallback : String(value);
}

function readNumber(record: Record<string, unknown>, key: string, fallback = 0): number {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  const value = record[key] ?? record[pascal];
  return value == null ? fallback : Number(value);
}

function readStringArray(record: Record<string, unknown>, key: string): string[] {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  const value = record[key] ?? record[pascal];
  return Array.isArray(value) ? value.map(String) : [];
}

function normalizeTrigger(raw: unknown): ModSettingsTrigger {
  const record = (raw ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    executeCommands: readStringArray(record, 'executeCommands'),
  };
}

function normalizeAutoRestart(raw: unknown): ModAutoRestart {
  const record = (raw ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    restartHour: readNumber(record, 'restartHour', 4),
    restartMinute: readNumber(record, 'restartMinute', 0),
    messages: readStringArray(record, 'messages'),
  };
}

export const defaultGlobalSettings: ModGlobalSettings = {
  isEnabled: false,
  globalServerName: '[FFFFFF]Server',
  whisperServerName: '[FF0000]Server',
  chatCommandPrefix: '',
  chatCommandSeparator: '-',
  handleChatMessageError: '[FF0000]System error, please contact the server administrator.',
  teleZombieCheck: true,
  teleDisableTip: '[00FF00]Transmission is forbidden. Please check if your surroundings are safe.',
  killZombieTrigger: {
    isEnabled: false,
    executeCommands: [
      'ty-pm {EntityId} "[00FF00]You killed a zombie, earned 1 point"',
      'ty-cpp {EntityId} 1',
    ],
  },
  deathTrigger: {
    isEnabled: false,
    executeCommands: [
      'ty-pm {EntityId} "[00FF00]You died, deducted 1 point"',
      'ty-cpp {EntityId} -1',
    ],
  },
  autoRestart: {
    isEnabled: false,
    restartHour: 4,
    restartMinute: 0,
    messages: [],
  },
  blockFamilySharingAccount: false,
  removeSleepingBagFromPOI: false,
  removeSleepingBagFromPoiTip: "You can't place a land claim or sleeping bag in a POI area.",
  isEnablePlayerInitialSpawnPoint: false,
  playerInitialPosition: null,
  enableFallingBlockProtection: false,
  enableLandClaimProtection: false,
  landClaimProtectionTip: null,
  enableTraderAreaProtection: false,
  traderAreaProtectionTip: null,
  enableAutoZombieCleanup: false,
  autoZombieCleanupThreshold: 128,
  enableXmlsSecondaryOverwrite: false,
  hideCommandInChat: false,
};

export const defaultGameNoticeSettings: ModGameNoticeSettings = {
  isEnabled: false,
  welcomeNotice: 'Welcome, survivor.',
  rotatingNotices: [],
  rotatingInterval: 300,
  bloodMoonNotice1: 'The next blood moon is in {BloodMoonDays} days.',
  bloodMoonNotice2: 'The next blood moon is today. It will begin at {BloodMoonStartTime}',
  bloodMoonNotice3: 'The blood moon is here, hold on until {BloodMoonEndTime}',
};

export const defaultAutoBackupSettings: ModAutoBackupSettings = {
  isEnabled: false,
  interval: 7200,
  retainedFileCountLimit: 12,
  resetIntervalAfterManualBackup: true,
  skipIfThereAreNoPlayers: true,
  autoBackupOnServerStartup: true,
  archiveFolder: 'LSTY_Data/Backup',
};

export function normalizeGlobalSettings(data: unknown): ModGlobalSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    globalServerName: readString(record, 'globalServerName', defaultGlobalSettings.globalServerName),
    whisperServerName: readString(record, 'whisperServerName', defaultGlobalSettings.whisperServerName),
    chatCommandPrefix: readString(record, 'chatCommandPrefix'),
    chatCommandSeparator: readString(record, 'chatCommandSeparator', '-'),
    handleChatMessageError: readString(
      record,
      'handleChatMessageError',
      defaultGlobalSettings.handleChatMessageError,
    ),
    teleZombieCheck: readBool(record, 'teleZombieCheck', true),
    teleDisableTip: readString(record, 'teleDisableTip', defaultGlobalSettings.teleDisableTip),
    killZombieTrigger: normalizeTrigger(record.killZombieTrigger ?? record.KillZombieTrigger),
    deathTrigger: normalizeTrigger(record.deathTrigger ?? record.DeathTrigger),
    autoRestart: normalizeAutoRestart(record.autoRestart ?? record.AutoRestart),
    blockFamilySharingAccount: readBool(record, 'blockFamilySharingAccount'),
    removeSleepingBagFromPOI: readBool(record, 'removeSleepingBagFromPOI'),
    removeSleepingBagFromPoiTip: readString(
      record,
      'removeSleepingBagFromPoiTip',
      defaultGlobalSettings.removeSleepingBagFromPoiTip ?? '',
    ),
    isEnablePlayerInitialSpawnPoint: readBool(record, 'isEnablePlayerInitialSpawnPoint'),
    playerInitialPosition: readString(record, 'playerInitialPosition') || null,
    enableFallingBlockProtection: readBool(record, 'enableFallingBlockProtection'),
    enableLandClaimProtection: readBool(record, 'enableLandClaimProtection'),
    landClaimProtectionTip: readString(record, 'landClaimProtectionTip') || null,
    enableTraderAreaProtection: readBool(record, 'enableTraderAreaProtection'),
    traderAreaProtectionTip: readString(record, 'traderAreaProtectionTip') || null,
    enableAutoZombieCleanup: readBool(record, 'enableAutoZombieCleanup'),
    autoZombieCleanupThreshold: readNumber(
      record,
      'autoZombieCleanupThreshold',
      defaultGlobalSettings.autoZombieCleanupThreshold,
    ),
    enableXmlsSecondaryOverwrite: readBool(record, 'enableXmlsSecondaryOverwrite'),
    hideCommandInChat: readBool(record, 'hideCommandInChat'),
  };
}

export function normalizeGameNoticeSettings(data: unknown): ModGameNoticeSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    welcomeNotice: readString(record, 'welcomeNotice', defaultGameNoticeSettings.welcomeNotice),
    rotatingNotices: readStringArray(record, 'rotatingNotices'),
    rotatingInterval: readNumber(record, 'rotatingInterval', defaultGameNoticeSettings.rotatingInterval),
    bloodMoonNotice1: readString(record, 'bloodMoonNotice1', defaultGameNoticeSettings.bloodMoonNotice1),
    bloodMoonNotice2: readString(record, 'bloodMoonNotice2', defaultGameNoticeSettings.bloodMoonNotice2),
    bloodMoonNotice3: readString(record, 'bloodMoonNotice3', defaultGameNoticeSettings.bloodMoonNotice3),
  };
}

export function normalizeAutoBackupSettings(data: unknown): ModAutoBackupSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    interval: readNumber(record, 'interval', defaultAutoBackupSettings.interval),
    retainedFileCountLimit: readNumber(
      record,
      'retainedFileCountLimit',
      defaultAutoBackupSettings.retainedFileCountLimit,
    ),
    resetIntervalAfterManualBackup: readBool(
      record,
      'resetIntervalAfterManualBackup',
      defaultAutoBackupSettings.resetIntervalAfterManualBackup,
    ),
    skipIfThereAreNoPlayers: readBool(
      record,
      'skipIfThereAreNoPlayers',
      defaultAutoBackupSettings.skipIfThereAreNoPlayers,
    ),
    autoBackupOnServerStartup: readBool(
      record,
      'autoBackupOnServerStartup',
      defaultAutoBackupSettings.autoBackupOnServerStartup,
    ),
    archiveFolder: readString(record, 'archiveFolder', defaultAutoBackupSettings.archiveFolder),
  };
}

export function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function arrayToLines(items: string[] | undefined): string {
  return (items ?? []).join('\n');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export const defaultMuteCommandSettings: ModMuteCommandSettings = {
  isEnabled: false,
  mutedCommands: [],
  mutedTip: '[FF0000]That command is disabled on this server.',
};

export function normalizeMuteCommandSettings(data: unknown): ModMuteCommandSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    mutedCommands: readStringArray(record, 'mutedCommands'),
    mutedTip: readString(record, 'mutedTip', defaultMuteCommandSettings.mutedTip),
  };
}

export const defaultTaskScheduleSettings: ModTaskScheduleSettings = {
  isEnabled: false,
};

export function normalizeTaskScheduleSettings(data: unknown): ModTaskScheduleSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return { isEnabled: readBool(record, 'isEnabled') };
}

export const defaultTeleportHomeSettings: ModTeleportHomeSettings = {
  isEnabled: false,
  queryListCmd: 'home',
  teleInterval: 60,
  setHomeCmdPrefix: 'setHome',
  setCountLimit: 3,
  pointsRequiredForSet: 2,
  deleteHomeCmdPrefix: 'delHome',
  teleHomeCmdPrefix: 'home',
  pointsRequiredForTele: 2,
  noHomeTip: '',
  locationItemTip: '',
  overLimitTip: '',
  setPointsNotEnoughTip: '',
  setSuccessTip: '',
  overwriteSuccessTip: '',
  deleteSuccessTip: '',
  homeNotFoundTip: '',
  coolingTip: '',
  telePointsNotEnoughTip: '',
  teleSuccessTip: '',
};

export function normalizeTeleportHomeSettings(data: unknown): ModTeleportHomeSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    queryListCmd: readString(record, 'queryListCmd', defaultTeleportHomeSettings.queryListCmd),
    teleInterval: readNumber(record, 'teleInterval', defaultTeleportHomeSettings.teleInterval),
    setHomeCmdPrefix: readString(record, 'setHomeCmdPrefix', defaultTeleportHomeSettings.setHomeCmdPrefix),
    setCountLimit: readNumber(record, 'setCountLimit', defaultTeleportHomeSettings.setCountLimit),
    pointsRequiredForSet: readNumber(record, 'pointsRequiredForSet', defaultTeleportHomeSettings.pointsRequiredForSet),
    deleteHomeCmdPrefix: readString(record, 'deleteHomeCmdPrefix', defaultTeleportHomeSettings.deleteHomeCmdPrefix),
    teleHomeCmdPrefix: readString(record, 'teleHomeCmdPrefix', defaultTeleportHomeSettings.teleHomeCmdPrefix),
    pointsRequiredForTele: readNumber(record, 'pointsRequiredForTele', defaultTeleportHomeSettings.pointsRequiredForTele),
    noHomeTip: readString(record, 'noHomeTip'),
    locationItemTip: readString(record, 'locationItemTip'),
    overLimitTip: readString(record, 'overLimitTip'),
    setPointsNotEnoughTip: readString(record, 'setPointsNotEnoughTip'),
    setSuccessTip: readString(record, 'setSuccessTip'),
    overwriteSuccessTip: readString(record, 'overwriteSuccessTip'),
    deleteSuccessTip: readString(record, 'deleteSuccessTip'),
    homeNotFoundTip: readString(record, 'homeNotFoundTip'),
    coolingTip: readString(record, 'coolingTip'),
    telePointsNotEnoughTip: readString(record, 'telePointsNotEnoughTip'),
    teleSuccessTip: readString(record, 'teleSuccessTip'),
  };
}

export const defaultTeleportCitySettings: ModTeleportCitySettings = {
  isEnabled: false,
  queryListCmd: 'city',
  teleCmdPrefix: 'city',
  teleInterval: 60,
  locationItemTip: '',
  teleSuccessTip: '',
  pointsNotEnoughTip: '',
  coolingTip: '',
  noLocation: '',
};

export function normalizeTeleportCitySettings(data: unknown): ModTeleportCitySettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    queryListCmd: readString(record, 'queryListCmd', defaultTeleportCitySettings.queryListCmd),
    teleCmdPrefix: readString(record, 'teleCmdPrefix', defaultTeleportCitySettings.teleCmdPrefix),
    teleInterval: readNumber(record, 'teleInterval', defaultTeleportCitySettings.teleInterval),
    locationItemTip: readString(record, 'locationItemTip'),
    teleSuccessTip: readString(record, 'teleSuccessTip'),
    pointsNotEnoughTip: readString(record, 'pointsNotEnoughTip'),
    coolingTip: readString(record, 'coolingTip'),
    noLocation: readString(record, 'noLocation'),
  };
}

export const defaultTeleportFriendSettings: ModTeleportFriendSettings = {
  isEnabled: false,
  teleCmdPrefix: 'tele',
  teleInterval: 60,
  pointsRequired: 2,
  teleSuccessTip: '',
  pointsNotEnoughTip: '',
  coolingTip: '',
  targetNotFoundTip: '',
  isFriendBypass: false,
  teleConfirmTip: '',
  acceptTele: 'Yes',
  rejectTele: 'No',
  targetRejectTeleTip: '',
  keepDuration: 30,
};

export function normalizeTeleportFriendSettings(data: unknown): ModTeleportFriendSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    teleCmdPrefix: readString(record, 'teleCmdPrefix', defaultTeleportFriendSettings.teleCmdPrefix),
    teleInterval: readNumber(record, 'teleInterval', defaultTeleportFriendSettings.teleInterval),
    pointsRequired: readNumber(record, 'pointsRequired', defaultTeleportFriendSettings.pointsRequired),
    teleSuccessTip: readString(record, 'teleSuccessTip'),
    pointsNotEnoughTip: readString(record, 'pointsNotEnoughTip'),
    coolingTip: readString(record, 'coolingTip'),
    targetNotFoundTip: readString(record, 'targetNotFoundTip'),
    isFriendBypass: readBool(record, 'isFriendBypass'),
    teleConfirmTip: readString(record, 'teleConfirmTip'),
    acceptTele: readString(record, 'acceptTele', defaultTeleportFriendSettings.acceptTele),
    rejectTele: readString(record, 'rejectTele', defaultTeleportFriendSettings.rejectTele),
    targetRejectTeleTip: readString(record, 'targetRejectTeleTip'),
    keepDuration: readNumber(record, 'keepDuration', defaultTeleportFriendSettings.keepDuration),
  };
}

export const defaultBossKillRewardSettings: ModBossKillRewardSettings = {
  isEnabled: false,
  killTip: 'You killed the boss {EntityName}, earned 1 points',
  enemyRewardMap: {},
  fallbackReward: 1,
};

function normalizeEnemyRewardMap(raw: unknown): Record<string, number> {
  const record = (raw ?? {}) as Record<string, unknown>;
  const map = record.enemyRewardMap ?? record.EnemyRewardMap ?? raw ?? {};
  if (typeof map !== 'object' || map === null || Array.isArray(map)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(map as Record<string, unknown>)) {
    if (key === 'enemyRewardMap' || key === 'EnemyRewardMap') continue;
    const points = Number(value);
    if (!Number.isNaN(points)) {
      result[key] = points;
    }
  }
  return result;
}

export function normalizeBossKillRewardSettings(data: unknown): ModBossKillRewardSettings {
  const record = (data ?? {}) as Record<string, unknown>;
  return {
    isEnabled: readBool(record, 'isEnabled'),
    killTip: readString(record, 'killTip', defaultBossKillRewardSettings.killTip),
    enemyRewardMap: normalizeEnemyRewardMap(record),
    fallbackReward: readNumber(record, 'fallbackReward', defaultBossKillRewardSettings.fallbackReward),
  };
}

export function enemyRewardMapToRows(map: Record<string, number>): Array<{ entityName: string; reward: number }> {
  return Object.entries(map).map(([entityName, reward]) => ({ entityName, reward }));
}

export function rowsToEnemyRewardMap(rows: Array<{ entityName: string; reward: number }>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const name = row.entityName.trim();
    if (!name) continue;
    result[name] = row.reward;
  }
  return result;
}
