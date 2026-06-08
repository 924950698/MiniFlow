import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { kimiApiPlugin } from './vite-plugin-kimi-api';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.MOONSHOT_API_KEY ?? '';
  const apiBase = env.MOONSHOT_API_BASE ?? 'https://api.moonshot.cn/v1';

  return {
    plugins: [react(), kimiApiPlugin(apiKey, apiBase)],
  };
});
