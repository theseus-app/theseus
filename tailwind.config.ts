// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}", // src 구조면 추가
    ],
    theme: {
        extend: {
            "colors": {
                "primary": '#337ab7'
            }
        },
    },
    plugins: [
        // require("@tailwindcss/forms"),
        // require("@tailwindcss/typography"),
        // require("@tailwindcss/aspect-ratio"),
    ],
} satisfies Config;
