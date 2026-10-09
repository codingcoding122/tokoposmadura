/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0F172A',     // Slate gelap untuk navbar & background
          emerald: '#10B981',  // Emerald green untuk status & aksen
          wa: '#25D366',       // Hijau khas WhatsApp untuk checkout
          danger: '#EF4444',   // Merah warning untuk stok menipis & utang
        },
      },
    },
  },
  plugins: [],
}