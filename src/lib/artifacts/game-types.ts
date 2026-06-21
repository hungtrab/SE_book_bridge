export type GameStatus = "playing" | "game_over" | "victory";

export type ChoiceEffect = {
  healthDelta?: number;
  statusOverride?: GameStatus;
};

export type ParticleTheme = "stars" | "sand" | "embers" | "gold";
export type VictoryEffect = "lamp-dim" | "none";

export type Hotspot = {
  id: string;
  x: number;
  y: number;
  emoji: string;
  label: string;
  kind: "action" | "inspect";
  nextNodeId?: string | null;
  effect?: ChoiceEffect;
  flavorText?: string;
  inspectText?: string;
};

export type StoryNode = {
  id: string;
  ambiance: string;
  narration: string;
  hotspots: Hotspot[];
  particleTheme: ParticleTheme;
  sceneWidth: number;
  backgroundGradient: string;
  backgroundImage?: string;
  isVictory?: boolean;
  victoryEffect?: VictoryEffect;
};

export type GameState = {
  currentNodeId: string;
  health: number;
  status: GameStatus;
  choiceHistory: string[];
  lastFlavorText: string | null;
};

export type GameAction =
  | { type: "CHOOSE"; choiceId: string; nextNodeId: string; effect?: ChoiceEffect; flavorText?: string }
  | { type: "GAME_OVER"; flavorText: string }
  | { type: "RESTART" };
