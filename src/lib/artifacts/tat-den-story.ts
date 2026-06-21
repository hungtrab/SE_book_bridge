import type { StoryNode } from "./game-types";

const R2 = "https://pub-7cade8eb643747dca43395d8b4505070.r2.dev/artifacts/tat-den";

export const STORY_NODES: Record<string, StoryNode> = {
  "scene-1-caring": {
    id: "scene-1-caring",
    ambiance: "Scene 1 — Caring for the Husband",
    particleTheme: "embers",
    sceneWidth: 220,
    backgroundGradient: "linear-gradient(135deg, #1a1208 0%, #0d0a05 40%, #1a1510 70%, #0a0805 100%)",
    backgroundImage: `${R2}/scene_1.png`,
    narration:
      "Inside the dilapidated thatched hut, darkness clung to every corner. The damp earthen floor reeked of mildew. A faint sliver of light crept through the doorway — just enough to reveal the depths of their poverty: a cracked wooden bed, a tray of chipped clay bowls.\n\n" +
      "Chi Dau — gaunt, hollow-cheeked, her brown peasant shirt torn and patched — tiptoed across the room carrying a large bowl of rice porridge, fanning it as she walked to cool it down.\n\n" +
      "On the bed, Anh Dau lay skeletal and ashen-faced, barely able to prop himself up on one elbow before groaning and collapsing back. The silence was suffocating — a bowstring stretched to its limit, about to snap.",
    hotspots: [
      {
        id: "porridge",
        x: 30,
        y: 70,
        emoji: "🍚",
        label: "The Rice Bran Porridge",
        kind: "inspect",
        inspectText: "A watery, grayish porridge made from rice borrowed from the old neighbor woman. This is the only hope for Anh Dau to regain his strength after being beaten half to death at the communal hall for failing to pay the head tax.",
      },
      {
        id: "husband-face",
        x: 65,
        y: 45,
        emoji: "😰",
        label: "Anh Dau's Face",
        kind: "inspect",
        inspectText: "Hollow, glazed eyes. Protruding cheekbones cracked and dry. All because of one head tax — levied for his dead younger brother. This once-strong farmer has been beaten into a living corpse.",
      },
      {
        id: "distant-drums",
        x: 85,
        y: 20,
        emoji: "🥁",
        label: "Distant Drums",
        kind: "inspect",
        inspectText: "The drums and horns demanding tax payment echo lazily from the village entrance, each beat drawing closer like the footsteps of death itself.",
      },
      {
        id: "offer-porridge",
        x: 50,
        y: 85,
        emoji: "🤲",
        label: "\"Please, try to eat some porridge...\"",
        kind: "action",
        nextNodeId: "scene-2-intruders",
        flavorText: "Chi Dau set the bowl down gently, pleading: \"Please, husband, try to sit up and sip some porridge to ease your stomach...\"",
      },
    ],
  },

  "scene-2-intruders": {
    id: "scene-2-intruders",
    ambiance: "Scene 2 — The Enforcers Arrive",
    particleTheme: "sand",
    sceneWidth: 220,
    backgroundGradient: "linear-gradient(135deg, #1a0808 0%, #0f0505 35%, #1a1008 65%, #0a0505 100%)",
    backgroundImage: `${R2}/scene_2.png`,
    narration:
      "The flimsy bamboo door was flung open. The enforcers stormed in, bringing dust and menace. The tiny hut felt even smaller, suffocating under their brutality.\n\n" +
      "The Tax Collector — a face ruined by gambling, eyes bulging, breath reeking of opium — clutched a rattan cane in one hand, rope and ruler in the other.\n\n" +
      "Chi Dau's face went pale. She hastily set her child on the ground and rushed to grab the Collector's arm, her expression desperate and pleading.",
    hotspots: [
      {
        id: "weapons",
        x: 25,
        y: 55,
        emoji: "🪢",
        label: "Rattan Cane & Rope",
        kind: "inspect",
        inspectText: "The terrifying tools of colonial enforcement — brandished by the Tax Collector, ready to be tightened around the body of a gravely ill man.",
      },
      {
        id: "collector-manner",
        x: 40,
        y: 35,
        emoji: "👤",
        label: "The Tax Collector",
        kind: "inspect",
        inspectText: "He barked orders in a voice made hoarse by years of smoking cheap opium, tapping his cane on the ground. Not a shred of humanity in his demeanor.",
      },
      {
        id: "beg-again",
        x: 35,
        y: 85,
        emoji: "🙏",
        label: "\"Please, sirs, have mercy...\"",
        kind: "action",
        nextNodeId: "scene-2-intruders",
        flavorText: "Chi Dau trembled: \"Please, sirs, speak to the village chief... let us defer the payment...\"\n\nThe Collector snarled: \"No time for talk! Tie up her husband and drag him out!\"",
      },
      {
        id: "block-path",
        x: 70,
        y: 85,
        emoji: "🛡️",
        label: "Block the Collector's path",
        kind: "action",
        nextNodeId: "scene-3-breaking-point",
        flavorText: "He lunged toward Anh Dau. Chi Dau threw herself forward, grabbing his arm with desperate strength.",
      },
    ],
  },

  "scene-3-breaking-point": {
    id: "scene-3-breaking-point",
    ambiance: "Scene 3 — The Breaking Point",
    particleTheme: "embers",
    sceneWidth: 200,
    backgroundGradient: "linear-gradient(135deg, #2a0505 0%, #1a0505 40%, #0f0505 70%, #1a0808 100%)",
    backgroundImage: `${R2}/scene_3.png`,
    narration:
      "The Collector's fist slammed into Chi Dau's chest. She staggered. Then a vicious slap cracked across her face — the sound sharp enough to split the air.\n\n" +
      "He shoved past her and lunged at Anh Dau with the rope.\n\n" +
      "Something changed in Chi Dau's eyes. The fear drained away. In its place — a cold, burning fury. Her jaw clenched. Her children screamed in the corner.\n\n" +
      "Anh Dau, shaking violently, managed to cry out: \"Don't do this, wife! You mustn't!\"",
    hotspots: [
      {
        id: "the-slap",
        x: 25,
        y: 40,
        emoji: "✋",
        label: "The Slap",
        kind: "inspect",
        inspectText: "The sharp crack rang through the hut, leaving Chi Dau's cheek swollen and red. It was not just a slap across her face — it was a slap against the dignity of a mother, a wife, a human being.",
      },
      {
        id: "chest-punch",
        x: 40,
        y: 55,
        emoji: "👊",
        label: "The Punch to the Chest",
        kind: "inspect",
        inspectText: "The force of the Collector's blow sent Chi Dau reeling, her chest burning with pain, choking on rage she could no longer swallow.",
      },
      {
        id: "husband-trembling",
        x: 70,
        y: 45,
        emoji: "😨",
        label: "Anh Dau Trembling",
        kind: "inspect",
        inspectText: "Terrified beyond reason, he nearly fainted — yet still managed to cry out between shudders: \"Don't do this, wife! You mustn't fight them!\"",
      },
      {
        id: "defy",
        x: 50,
        y: 85,
        emoji: "🔥",
        label: "\"You dare tie up my husband? Try me!\"",
        kind: "action",
        nextNodeId: "scene-4-fight-back",
        flavorText: "Chi Dau clenched her teeth, her eyes blazing, and roared: \"You want to tie up my husband? Go ahead — and see what happens to you!\"",
      },
    ],
  },

  "scene-4-fight-back": {
    id: "scene-4-fight-back",
    ambiance: "Scene 4 — Fighting Back",
    particleTheme: "sand",
    sceneWidth: 220,
    backgroundGradient: "linear-gradient(135deg, #1a1008 0%, #0f0805 35%, #1a0808 60%, #0a0805 100%)",
    backgroundImage: `${R2}/scene_4.png`,
    narration:
      "Like lightning, Chi Dau grabbed the Tax Collector by the neck and shoved him out the door. His opium-weakened body crumpled — no match for a farmer woman's fury.\n\n" +
      "The Village Chief's servant swung his cane. Chi Dau seized it mid-air, and they wrestled — pushing, pulling, locked in struggle.\n\n" +
      "Then she grabbed his hair and swung him like a ragdoll. He crashed onto the stone threshold, sprawling in the dirt, scrambling to his feet in disbelief.\n\n" +
      "A peasant woman had beaten them both.",
    hotspots: [
      {
        id: "collector-fallen",
        x: 20,
        y: 65,
        emoji: "😵",
        label: "The Collector on the Ground",
        kind: "inspect",
        inspectText: "The feeble strength of an opium addict was no match for a farm woman's fury. He tumbled out the door, still sputtering orders to tie someone up — but no one was listening anymore.",
      },
      {
        id: "wrestling-cane",
        x: 55,
        y: 45,
        emoji: "⚔️",
        label: "Wrestling for the Cane",
        kind: "inspect",
        inspectText: "Chi Dau snatched the cane right from the servant's hands. They grappled, pushed, pulled — and the look of shock on his face said everything: he never imagined a woman could overpower him.",
      },
      {
        id: "throw-servant",
        x: 50,
        y: 85,
        emoji: "💪",
        label: "Throw the servant out",
        kind: "action",
        nextNodeId: "scene-5-aftermath",
        flavorText: "Swift as lightning, Chi Dau grabbed his hair and swung with all her might. He flew through the doorway and crashed onto the stone steps, crawling away in humiliation.",
      },
    ],
  },

  "scene-5-aftermath": {
    id: "scene-5-aftermath",
    ambiance: "✨ QUEST COMPLETE ✨",
    particleTheme: "embers",
    sceneWidth: 200,
    backgroundGradient: "linear-gradient(135deg, #1a1208 0%, #0d0a05 40%, #1a1510 70%, #0a0805 100%)",
    backgroundImage: `${R2}/scene_5.png`,
    isVictory: true,
    victoryEffect: "lamp-dim",
    narration:
      "The hut fell silent. Chi Dau stood in the center, clothes disheveled, breathing hard — but her eyes were steady, resolute.\n\n" +
      "The enforcers limped away toward the communal hall, throwing back hateful glares and muttered threats.\n\n" +
      "Anh Dau lay on the bed trembling: \"They can beat us and it's fine, but if we fight back — we go to prison!\"\n\n" +
      "Chi Dau replied, her voice quiet but unshakeable:\n\n" +
      "\"I'd rather go to prison. I will not stand by and let them torment us any longer.\"\n\n" +
      "Chi Dau was not violent. She was simply the bravest woman when pushed to the edge.\n\n" +
      "Thank you for experiencing the moment when \"the water breaks the dam.\"",
    hotspots: [],
  },
};

export const INITIAL_NODE_ID = "scene-1-caring";
