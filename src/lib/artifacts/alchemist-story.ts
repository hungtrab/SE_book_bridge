import type { StoryNode } from "./game-types";

const R2 = "https://pub-7cade8eb643747dca43395d8b4505070.r2.dev/artifacts/alchemist";

export const STORY_NODES: Record<string, StoryNode> = {
  "node-1-pyramids": {
    id: "node-1-pyramids",
    ambiance: "The Pyramids of Giza — Night",
    particleTheme: "stars",
    sceneWidth: 250,
    backgroundGradient: "linear-gradient(135deg, #0c1445 0%, #1a1a3e 30%, #0f1a3d 50%, #0c1445 70%, #1a1208 100%)",
    backgroundImage: `${R2}/scene_1.png`,
    narration:
      "After a long journey across the Sahara Desert, the shepherd boy finally stood before the Great Pyramids of Giza, bathed in silver moonlight.\n\n" +
      "He knelt on the sand. Tears rolled down his sun-weathered cheeks — not from pain, but from wonder. He had crossed the desert, met the Alchemist, learned the Language of the Wind and the Sun, and now — his dream lay right beneath his feet.\n\n" +
      "A small scarab beetle — the sacred symbol of God in Egyptian lore — slowly crawled across the sand where his tears had fallen.\n\n" +
      "\"That is an Omen,\" the Alchemist once said. \"The Universe always speaks to us through Omens.\"",
    hotspots: [
      {
        id: "dig-here",
        x: 35,
        y: 75,
        emoji: "⛏️",
        label: "Dig where the scarab and tears fell",
        kind: "action",
        nextNodeId: "node-2-robbers",
      },
      {
        id: "scarab",
        x: 30,
        y: 80,
        emoji: "🪲",
        label: "The Scarab Beetle",
        kind: "inspect",
        inspectText: "A small scarab beetle crawling slowly across the sand. In Egyptian culture, it is the symbol of rebirth and the Divine.",
      },
      {
        id: "wander",
        x: 80,
        y: 60,
        emoji: "🚶",
        label: "Wander around the Pyramid instead",
        kind: "action",
        nextNodeId: null,
        effect: { statusOverride: "game_over" },
        flavorText: "You wandered through the night until exhaustion took you. When you ignore the Omens of the Universe, you are forever lost in the desert.",
      },
      {
        id: "moon",
        x: 60,
        y: 15,
        emoji: "🌙",
        label: "The Moon",
        kind: "inspect",
        inspectText: "The silver moon illuminates the ancient stones. This is the Great Pyramid of Giza — the place your recurring dream led you to.",
      },
    ],
  },

  "node-2-robbers": {
    id: "node-2-robbers",
    ambiance: "Beneath the Great Pyramid — Dawn",
    particleTheme: "sand",
    sceneWidth: 250,
    backgroundGradient: "linear-gradient(135deg, #1a1208 0%, #2a1a08 25%, #0a0a0f 50%, #1a0808 75%, #0a0a0f 100%)",
    backgroundImage: `${R2}/scene_2.png`,
    narration:
      "He dug through the night. His hands blistered, his nails blackened with sand, but he did not stop.\n\n" +
      "He found nothing.\n\n" +
      "Suddenly, dark shadows blocked the moonlight. Four, five, six figures. Desert thieves — cold eyes glinting, swords gleaming under the moon.\n\n" +
      "They seized him, searched him, and took his pouch of gold — the Alchemist's last gift. One pressed a blade to his throat and snarled: \"What are you hiding beneath the sand?\"",
    hotspots: [
      {
        id: "fight",
        x: 20,
        y: 55,
        emoji: "⚔️",
        label: "Fight back against the thieves",
        kind: "action",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -60 },
        flavorText: "You fought bravely but were overwhelmed by their numbers. Cracked ribs, blood on sand. You are barely alive.",
      },
      {
        id: "run",
        x: 75,
        y: 65,
        emoji: "🏃",
        label: "Run into the darkness",
        kind: "action",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -40 },
        flavorText: "You managed a few steps before they caught you. They beat you for trying to escape. Painful, but you survived.",
      },
      {
        id: "submit",
        x: 45,
        y: 80,
        emoji: "🤲",
        label: "Kneel down and do not resist",
        kind: "action",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -20 },
        flavorText: "\"The brave man is not the one who does not feel afraid, but the one who knows when to endure.\" They beat you, but less harshly because you did not resist.",
      },
      {
        id: "gold-bag",
        x: 50,
        y: 70,
        emoji: "💰",
        label: "The Gold Pouch",
        kind: "inspect",
        inspectText: "The leather pouch of gold coins — the Alchemist's parting gift before you said goodbye. The thieves have already snatched it away.",
      },
    ],
  },

  "node-3-truth": {
    id: "node-3-truth",
    ambiance: "The Robber Chief's Blade",
    particleTheme: "embers",
    sceneWidth: 200,
    backgroundGradient: "linear-gradient(135deg, #1a0505 0%, #0f0505 30%, #1a0808 60%, #0a0505 100%)",
    backgroundImage: `${R2}/scene_3.png`,
    narration:
      "They beat him within an inch of his life. The chief grabbed his collar and lifted him up. A cold scimitar pressed against his throat.\n\n" +
      "\"Speak! Why were you digging here? You are hiding treasure, aren't you?\"\n\n" +
      "The line between life and death was razor-thin. The blade was ice-cold against the skin of his neck. He had to choose — lie to save himself, or speak the truth about the dream he had chased across the desert.",
    hotspots: [
      {
        id: "lie",
        x: 25,
        y: 50,
        emoji: "🤐",
        label: "Lie: \"I was just looking for groundwater.\"",
        kind: "action",
        nextNodeId: null,
        effect: { statusOverride: "game_over" },
        flavorText: "The thieves did not believe you. The blade swung upward. When facing death and still denying your Personal Legend, you have failed. The Universe only helps those brave enough to claim their dream.",
      },
      {
        id: "truth",
        x: 70,
        y: 50,
        emoji: "🗣️",
        label: "Tell the truth about the dream",
        kind: "action",
        nextNodeId: "node-4-revelation",
      },
      {
        id: "sword",
        x: 48,
        y: 35,
        emoji: "🗡️",
        label: "The Scimitar",
        kind: "inspect",
        inspectText: "The cold curved blade pressed against your throat. One wrong move — and everything ends here.",
      },
    ],
  },

  "node-4-revelation": {
    id: "node-4-revelation",
    ambiance: "Laughter in the Desert",
    particleTheme: "stars",
    sceneWidth: 250,
    backgroundGradient: "linear-gradient(135deg, #0c1445 0%, #060618 30%, #0c1445 60%, #0a0a2e 100%)",
    backgroundImage: `${R2}/scene_4.png`,
    narration:
      "The chief froze. Then he lowered his blade.\n\n" +
      "And he burst into laughter. The sound echoed across the desert night, bouncing off the ancient stones of the Pyramids, as if the Pharaohs themselves were laughing along.\n\n" +
      "\"You are a fool!\" he said, tears streaming from laughing so hard. \"I myself once dreamed — twice — that I should travel to Spain, find an abandoned church where a sycamore tree grows in the sacristy. The dream told me to dig beneath the roots and I would find gold. But I am not foolish enough to cross an entire desert just because of a dream!\"\n\n" +
      "With that, they left — vanishing into the night. Leaving him lying on the sand, beneath a sky full of stars.",
    hotspots: [
      {
        id: "smile",
        x: 50,
        y: 30,
        emoji: "🌟",
        label: "Smile at the star-filled sky",
        kind: "action",
        nextNodeId: "node-5-victory",
      },
      {
        id: "robber-tracks",
        x: 80,
        y: 75,
        emoji: "👣",
        label: "The Robbers' Footprints",
        kind: "inspect",
        inspectText: "Their footprints slowly fade into the sand. The chief unknowingly revealed where the true treasure lies — right where the journey began.",
      },
      {
        id: "constellation",
        x: 35,
        y: 15,
        emoji: "✨",
        label: "The Constellation",
        kind: "inspect",
        inspectText: "Stars shimmer across the desert sky. You remember the Alchemist's words: \"Remember that wherever your heart is, there you will find your treasure.\"",
      },
    ],
  },

  "node-5-victory": {
    id: "node-5-victory",
    ambiance: "✨ MISSION CLEARED ✨",
    particleTheme: "gold",
    sceneWidth: 200,
    backgroundGradient: "radial-gradient(ellipse at 50% 40%, #1a1408 0%, #0a0a0f 70%)",
    backgroundImage: `${R2}/scene_5.png`,
    isVictory: true,
    narration:
      "He lay there, battered and bruised, yet his heart overflowed with joy.\n\n" +
      "He laughed — his laughter carried by the desert wind. The Universe truly has a sense of humor.\n\n" +
      "The material treasure was right where he started — beneath the sycamore roots in the old church in Spain, the very place where he first dreamed his dream.\n\n" +
      "But had he not been brave enough to make this journey, he would never have known. And more importantly — he would never have become who he is now. He had found his Personal Legend.\n\n" +
      "\"Remember that wherever your heart is, there you will find your treasure.\"",
    hotspots: [],
  },
};

export const INITIAL_NODE_ID = "node-1-pyramids";
