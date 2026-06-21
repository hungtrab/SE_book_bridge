export type ArtifactMeta = {
  slug: string;
  title: string;
  subtitle: string;
  book: string;
  author: string;
  thumbnail: string;
  accentColor: string;
  scenes: number;
};

export const ARTIFACTS: ArtifactMeta[] = [
  {
    slug: "the-alchemist",
    title: "Secrets Beneath the Pyramids",
    subtitle: "The Alchemist",
    book: "The Alchemist",
    author: "Paulo Coelho",
    thumbnail: "https://pub-7cade8eb643747dca43395d8b4505070.r2.dev/artifacts/alchemist/scene_1.png",
    accentColor: "#c9a84c",
    scenes: 5,
  },
  {
    slug: "tuc-nuoc-vo-bo",
    title: "Tức Nước Vỡ Bờ",
    subtitle: "When the Water Rises",
    book: "Tắt Đèn",
    author: "Ngô Tất Tố",
    thumbnail: "https://pub-7cade8eb643747dca43395d8b4505070.r2.dev/artifacts/tat-den/scene_1.png",
    accentColor: "#8B4513",
    scenes: 5,
  },
];
