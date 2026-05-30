import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Reputation-tier badge colours referenced from the SRS slide deck.
        tier: {
          new: "#9CA3AF",
          active: "#10B981",
          trusted: "#3B82F6",
          champion: "#F59E0B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
