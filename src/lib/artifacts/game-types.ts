export type GameStatus = "playing" | "game_over" | "victory";

export type ChoiceEffect = {
  healthDelta?: number;
  statusOverride?: GameStatus;
};

export type StoryChoice = {
  id: string;
  emoji: string;
  label: string;
  nextNodeId: string | null;
  effect?: ChoiceEffect;
  flavorText?: string;
};

export type ParticleTheme = "stars" | "sand" | "embers" | "gold";

export type StoryNode = {
  id: string;
  ambiance: string;
  narration: string;
  choices: StoryChoice[];
  particleTheme: ParticleTheme;
  isVictory?: boolean;
  isGameOver?: boolean;
  gameOverText?: string;
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
