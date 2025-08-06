import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5000", // Adjust if your dev server runs on another port
  },
});
