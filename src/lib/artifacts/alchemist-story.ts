import type { StoryNode } from "./game-types";

export const STORY_NODES: Record<string, StoryNode> = {
  "node-1-pyramids": {
    id: "node-1-pyramids",
    ambiance: "The Pyramids of Giza — Night",
    particleTheme: "stars",
    narration:
      "Sau hành trình dài xuyên qua sa mạc Sahara, cuối cùng cậu cũng đứng đây — trước quần thể Kim Tự Tháp vĩ đại, ngập trong ánh trăng bạc.\n\n" +
      "Cậu bé chăn cừu quỳ xuống trên cát. Nước mắt lăn dài trên gò má rám nắng. Không phải vì đau đớn, mà vì xúc động. Cậu đã đi qua sa mạc, gặp Nhà Giả Kim, học ngôn ngữ của gió và mặt trời, và giờ — giấc mơ kia đang nằm ngay dưới chân cậu.\n\n" +
      "Một con bọ hung — biểu tượng thiêng liêng của Thượng Đế trong văn hóa Ai Cập — chầm chậm bò ngang qua chỗ giọt nước mắt vừa rơi xuống cát.\n\n" +
      "\"Đó là một Dấu Hiệu,\" Nhà Giả Kim từng nói. \"Vũ trụ luôn nói với ta qua những Dấu Hiệu.\"",
    choices: [
      {
        id: "dig-here",
        emoji: "⛏️",
        label: "Bắt đầu đào cát ngay tại vị trí con bọ hung và giọt nước mắt",
        nextNodeId: "node-2-robbers",
      },
      {
        id: "wander",
        emoji: "🚶",
        label: "Đi vòng quanh Kim Tự Tháp tìm một nơi có vẻ \"giống chỗ giấu kho báu\" hơn",
        nextNodeId: null,
        effect: { statusOverride: "game_over" },
        flavorText:
          "Cậu đi lang thang suốt đêm đến kiệt sức. Khi phớt lờ những Dấu Hiệu của vũ trụ, cậu mãi lạc lối trong sa mạc. Vận mệnh không chờ đợi kẻ nghi ngờ.",
      },
    ],
  },

  "node-2-robbers": {
    id: "node-2-robbers",
    ambiance: "Beneath the Great Pyramid — Dawn",
    particleTheme: "sand",
    narration:
      "Cậu hì hục đào suốt đêm. Bàn tay phồng rộp, móng tay đen sì vì cát, nhưng cậu không dừng lại. Mồ hôi nhỏ giọt hòa vào sa mạc.\n\n" +
      "Không thấy gì cả.\n\n" +
      "Đột nhiên, những bóng đen che khuất ánh trăng. Bốn, năm, sáu bóng người. Đó là những tên cướp sa mạc — mắt sắc lạnh, gươm sáng loáng dưới trăng.\n\n" +
      "Chúng thấy cậu đào bới và tóm lấy cậu, lục soát và cướp đi túi tiền vàng — món quà cuối cùng của Nhà Giả Kim. Một tên kề gươm vào cổ cậu và quát: \"Mày đang giấu thứ gì dưới cát?\"",
    choices: [
      {
        id: "fight",
        emoji: "⚔️",
        label: "Cố gắng vùng vẫy và đánh trả để giành lại số vàng",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -60 },
        flavorText: "Cậu chiến đấu dũng cảm nhưng bị áp đảo bởi số đông. Chúng đánh cậu tơi tả, xương sườn rạn, máu chảy trên cát.",
      },
      {
        id: "run",
        emoji: "🏃",
        label: "Vùng bỏ chạy vào bóng đêm",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -40 },
        flavorText: "Cậu chạy được vài bước thì bị tóm lại. Chúng đánh cậu vì tội bỏ trốn. Đau đớn, nhưng cậu vẫn còn sống.",
      },
      {
        id: "submit",
        emoji: "🤲",
        label: "Quỳ xuống, chịu đựng trận đòn và không chống cự",
        nextNodeId: "node-3-truth",
        effect: { healthDelta: -20 },
        flavorText: "Cậu quỳ im lặng như Nhà Giả Kim đã dạy: \"Người dũng cảm không phải kẻ không sợ, mà là kẻ biết khi nào nên chịu đựng.\" Chúng đánh cậu, nhưng nhẹ hơn vì thấy cậu không phản kháng.",
      },
    ],
  },

  "node-3-truth": {
    id: "node-3-truth",
    ambiance: "The Robber Chief's Blade",
    particleTheme: "embers",
    narration:
      "Chúng đánh cậu thừa sống thiếu chết. Cậu nằm trên cát, toàn thân bầm dập, mùi máu tanh trộn với mùi cát khô.\n\n" +
      "Tên tướng cướp túm áo cậu xách lên. Lưỡi gươm sắc lạnh kề sát yết hầu. Hắn gầm lên, mắt đỏ ngầu dưới ánh trăng:\n\n" +
      "\"Nói mau! Tại sao mày lại đào bới ở đây? Mày đang giấu kho báu phải không?\"\n\n" +
      "Ranh giới giữa sự sống và cái chết chỉ còn trong gang tấc. Lưỡi gươm lạnh buốt trên da cổ cậu. Cậu phải chọn — nói dối để thoát thân, hay nói sự thật về giấc mơ mà mình đã theo đuổi suốt chặng đường.",
    choices: [
      {
        id: "lie",
        emoji: "🤐",
        label: "Nói dối: \"Tôi chỉ đang tìm nguồn nước ngầm.\"",
        nextNodeId: null,
        effect: { statusOverride: "game_over" },
        flavorText:
          "Bọn cướp không tin. Lưỡi gươm vung lên. Khi đối diện với cái chết mà vẫn chối bỏ Vận Mệnh của mình, cậu đã thất bại. Nhà Giả Kim từng nói: \"Khi ta muốn điều gì, cả vũ trụ sẽ hợp sức giúp ta đạt được.\" Nhưng vũ trụ chỉ giúp kẻ dũng cảm thừa nhận giấc mơ của mình.",
      },
      {
        id: "truth",
        emoji: "🗣️",
        label: "Thú nhận sự thật: \"Tôi đã có một giấc mơ lặp đi lặp lại. Tôi vượt sa mạc để tìm kho báu giấu gần Kim Tự Tháp.\"",
        nextNodeId: "node-4-revelation",
      },
    ],
  },

  "node-4-revelation": {
    id: "node-4-revelation",
    ambiance: "Laughter in the Desert",
    particleTheme: "stars",
    narration:
      "Tên tướng cướp khựng lại. Lưỡi gươm hạ xuống.\n\n" +
      "Rồi hắn buông cậu ra và bật cười lớn. Tiếng cười vang vọng trong đêm sa mạc, dội lại từ những phiến đá của Kim Tự Tháp, như thể chính Pharaoh cũng đang cười theo.\n\n" +
      "\"Mày quả là thằng ngu!\" hắn nói, nước mắt chảy vì cười quá nhiều. \"Chính tao cũng từng mơ — mơ hai lần — rằng tao phải sang tận Tây Ban Nha, tìm một nhà thờ bỏ hoang có cây dâu tằm mọc trong phòng thay đồ. Giấc mơ bảo tao đào rễ cây lên sẽ thấy vàng. Nhưng tao không ngu ngốc đến mức vượt sa mạc chỉ vì một giấc mơ!\"\n\n" +
      "Nói rồi, bọn chúng bỏ đi, biến mất vào bóng đêm. Để lại cậu nằm trên cát, dưới bầu trời đầy sao.",
    choices: [
      {
        id: "smile",
        emoji: "🌟",
        label: "Mỉm cười nhìn lên bầu trời đầy sao",
        nextNodeId: "node-5-victory",
      },
    ],
  },

  "node-5-victory": {
    id: "node-5-victory",
    ambiance: "✨ MISSION CLEARED ✨",
    particleTheme: "gold",
    isVictory: true,
    narration:
      "Cậu nằm đó, toàn thân bầm dập nhưng trái tim ngập tràn hạnh phúc.\n\n" +
      "Cậu bật cười — tiếng cười hòa vào gió sa mạc. Vũ trụ thật có khiếu hài hước.\n\n" +
      "Kho báu vật chất nằm ngay tại nơi cậu bắt đầu chuyến đi — dưới gốc cây dâu tằm trong nhà thờ cổ ở Tây Ban Nha, nơi cậu từng nằm mơ giấc mơ đầu tiên.\n\n" +
      "Nhưng nếu không dũng cảm thực hiện cuộc hành trình dài này, cậu sẽ không bao giờ biết được điều đó. Và quan trọng hơn — cậu sẽ không trở thành con người của hiện tại. Cậu đã tìm thấy Vận Mệnh của mình.\n\n" +
      "\"Hãy nhớ rằng, bất cứ nơi đâu trái tim ta ở, đó là nơi ta sẽ tìm thấy kho báu.\"",
    choices: [],
  },
};

export const INITIAL_NODE_ID = "node-1-pyramids";
