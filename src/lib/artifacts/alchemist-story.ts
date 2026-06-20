import type { StoryNode } from "./game-types";

export const STORY_NODES: Record<string, StoryNode> = {
  "node-1-pyramids": {
    id: "node-1-pyramids",
    ambiance: "The Pyramids of Giza — Night",
    particleTheme: "stars",
    sceneWidth: 250,
    backgroundGradient: "linear-gradient(135deg, #0c1445 0%, #1a1a3e 30%, #0f1a3d 50%, #0c1445 70%, #1a1208 100%)",
    narration:
      "Sau hành trình dài xuyên qua sa mạc Sahara, cuối cùng cậu cũng đứng đây — trước quần thể Kim Tự Tháp vĩ đại, ngập trong ánh trăng bạc.\n\n" +
      "Cậu bé chăn cừu quỳ xuống trên cát. Nước mắt lăn dài trên gò má rám nắng. Một con bọ hung — biểu tượng của Thượng Đế — chầm chậm bò ngang qua chỗ giọt nước mắt vừa rơi xuống cát.\n\n" +
      "\"Đó là một Dấu Hiệu,\" Nhà Giả Kim từng nói.",
    hotspots: [
      {
        id: "dig-here",
        x: 35,
        y: 75,
        emoji: "⛏️",
        label: "Đào cát tại vị trí con bọ hung",
        kind: "action",
        nextNodeId: "node-2-robbers",
      },
      {
        id: "scarab",
        x: 30,
        y: 80,
        emoji: "🪲",
        label: "Con bọ hung",
        kind: "inspect",
        inspectText: "Một con bọ hung nhỏ đang bò chậm rãi trên cát. Trong văn hóa Ai Cập, nó là biểu tượng của sự tái sinh và Thượng Đế.",
      },
      {
        id: "wander",
        x: 80,
        y: 60,
        emoji: "🚶",
        label: "Đi vòng quanh Kim Tự Tháp",
        kind: "action",
        nextNodeId: null,
        effect: { statusOverride: "game_over" },
        flavorText: "Cậu đi lang thang suốt đêm đến kiệt sức. Khi phớt lờ những Dấu Hiệu của vũ trụ, cậu mãi lạc lối trong sa mạc.",
      },
      {
        id: "moon",
        x: 60,
        y: 15,
        emoji: "🌙",
        label: "Mặt trăng",
        kind: "inspect",
        inspectText: "Mặt trăng bạc chiếu sáng những phiến đá cổ đại. Đây là Kim Tự Tháp Giza — nơi giấc mơ đã dẫn cậu đến.",
      },
    ],
  },

  "node-2-robbers": {
    id: "node-2-robbers",
    ambiance: "Beneath the Great Pyramid — Dawn",
    particleTheme: "sand",
    sceneWidth: 250,
    backgroundGradient: "linear-gradient(135deg, #1a1208 0%, #2a1a08 25%, #0a0a0f 50%, #1a0808 75%, #0a0a0f 100%)",
    narration:
      "Cậu hì hục đào suốt đêm. Không thấy gì cả.\n\n" +
      "Đột nhiên, những bóng đen che khuất ánh trăng. Đó là những tên cướp sa mạc. Chúng tóm lấy cậu, cướp đi túi tiền vàng — món quà cuối cùng của Nhà Giả Kim.\n\n" +
      "\"Mày đang giấu thứ gì dưới cát?\"",
    hotspots: [
      {
        id: "fight",
        x: 20,
        y: 55,
        emoji: "⚔️",
        label: "Đánh trả bọn cướp",
        kind: "action",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -60 },
        flavorText: "Cậu chiến đấu dũng cảm nhưng bị áp đảo. Xương sườn rạn, máu chảy trên cát.",
      },
      {
        id: "run",
        x: 75,
        y: 65,
        emoji: "🏃",
        label: "Bỏ chạy vào bóng đêm",
        kind: "action",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -40 },
        flavorText: "Cậu chạy được vài bước thì bị tóm lại và bị đánh vì tội bỏ trốn.",
      },
      {
        id: "submit",
        x: 45,
        y: 80,
        emoji: "🤲",
        label: "Quỳ xuống, không chống cự",
        kind: "action",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -20 },
        flavorText: "\"Người dũng cảm không phải kẻ không sợ, mà là kẻ biết khi nào nên chịu đựng.\" Chúng đánh cậu, nhưng nhẹ hơn.",
      },
      {
        id: "gold-bag",
        x: 50,
        y: 70,
        emoji: "💰",
        label: "Túi tiền vàng",
        kind: "inspect",
        inspectText: "Túi tiền vàng — món quà cuối cùng của Nhà Giả Kim trước khi chia tay. Bọn cướp đã giật lấy nó.",
      },
    ],
  },

  "node-3-truth": {
    id: "node-3-truth",
    ambiance: "The Robber Chief's Blade",
    particleTheme: "embers",
    sceneWidth: 200,
    backgroundGradient: "linear-gradient(135deg, #1a0505 0%, #0f0505 30%, #1a0808 60%, #0a0505 100%)",
    narration:
      "Tên tướng cướp túm áo cậu xách lên. Lưỡi gươm sắc lạnh kề sát yết hầu.\n\n" +
      "\"Nói mau! Tại sao mày đào bới ở đây? Mày đang giấu kho báu phải không?\"\n\n" +
      "Ranh giới giữa sự sống và cái chết chỉ còn trong gang tấc.",
    hotspots: [
      {
        id: "lie",
        x: 25,
        y: 50,
        emoji: "🤐",
        label: "Nói dối: \"Tôi chỉ đang tìm nước ngầm.\"",
        kind: "action",
        nextNodeId: null,
        effect: { statusOverride: "game_over" },
        flavorText: "Bọn cướp không tin. Lưỡi gươm vung lên. Khi đối diện với cái chết mà vẫn chối bỏ Vận Mệnh, cậu đã thất bại.",
      },
      {
        id: "truth",
        x: 70,
        y: 50,
        emoji: "🗣️",
        label: "Nói sự thật về giấc mơ",
        kind: "action",
        nextNodeId: "node-4-revelation",
      },
      {
        id: "sword",
        x: 48,
        y: 35,
        emoji: "🗡️",
        label: "Lưỡi gươm",
        kind: "inspect",
        inspectText: "Lưỡi gươm sắc lạnh kề sát yết hầu cậu. Một chuyển động sai — và tất cả sẽ kết thúc.",
      },
    ],
  },

  "node-4-revelation": {
    id: "node-4-revelation",
    ambiance: "Laughter in the Desert",
    particleTheme: "stars",
    sceneWidth: 250,
    backgroundGradient: "linear-gradient(135deg, #0c1445 0%, #060618 30%, #0c1445 60%, #0a0a2e 100%)",
    narration:
      "Tên tướng cướp khựng lại, rồi bật cười lớn. Tiếng cười vang vọng trong đêm sa mạc.\n\n" +
      "\"Mày quả là thằng ngu! Chính tao cũng từng mơ — rằng phải sang Tây Ban Nha, tìm nhà thờ bỏ hoang có cây dâu tằm. Đào rễ cây lên sẽ thấy vàng. Nhưng tao không ngu đến mức vượt sa mạc chỉ vì một giấc mơ!\"\n\n" +
      "Bọn chúng bỏ đi, để lại cậu nằm trên cát.",
    hotspots: [
      {
        id: "smile",
        x: 50,
        y: 30,
        emoji: "🌟",
        label: "Mỉm cười nhìn bầu trời đầy sao",
        kind: "action",
        nextNodeId: "node-5-victory",
      },
      {
        id: "robber-tracks",
        x: 80,
        y: 75,
        emoji: "👣",
        label: "Dấu chân bọn cướp",
        kind: "inspect",
        inspectText: "Dấu chân chúng dần biến mất trên cát. Tên tướng cướp vô tình đã tiết lộ nơi cất giấu kho báu thật sự — ngay tại nơi cậu bắt đầu chuyến đi.",
      },
      {
        id: "constellation",
        x: 35,
        y: 15,
        emoji: "✨",
        label: "Chòm sao",
        kind: "inspect",
        inspectText: "Những ngôi sao lấp lánh trên bầu trời sa mạc. Cậu nhớ lời Nhà Giả Kim: \"Hãy nhớ rằng, bất cứ nơi đâu trái tim ta ở, đó là nơi ta sẽ tìm thấy kho báu.\"",
      },
    ],
  },

  "node-5-victory": {
    id: "node-5-victory",
    ambiance: "✨ MISSION CLEARED ✨",
    particleTheme: "gold",
    sceneWidth: 200,
    backgroundGradient: "radial-gradient(ellipse at 50% 40%, #1a1408 0%, #0a0a0f 70%)",
    isVictory: true,
    narration:
      "Cậu nằm đó, toàn thân bầm dập nhưng trái tim ngập tràn hạnh phúc.\n\n" +
      "Kho báu vật chất nằm ngay tại nơi cậu bắt đầu chuyến đi — dưới gốc cây dâu tằm trong nhà thờ cổ ở Tây Ban Nha.\n\n" +
      "Nhưng nếu không dũng cảm thực hiện cuộc hành trình này, cậu sẽ không bao giờ biết được điều đó. Cậu đã tìm thấy Vận Mệnh của mình.\n\n" +
      "\"Hãy nhớ rằng, bất cứ nơi đâu trái tim ta ở, đó là nơi ta sẽ tìm thấy kho báu.\"",
    hotspots: [],
  },
};

export const INITIAL_NODE_ID = "node-1-pyramids";
