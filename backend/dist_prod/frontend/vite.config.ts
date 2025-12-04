

// vite.config.js (or .ts)
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from "vite-plugin-svgr";
import path from 'path';

// This console.log is OUTSIDE and BEFORE the defineConfig callback.
// It will execute as soon as Node.js parses this file.
console.log('[VITE_CONFIG_FILE_PARSED] This vite.config.js file is being parsed by Node.js');

export default defineConfig(({ command, mode }) => {
  // These logs are INSIDE the defineConfig callback.
  // They will execute when Vite calls this function to get the configuration.
  console.log(`[VITE_CONFIG_CALLBACK_ENTERED] defineConfig callback entered. Command: '${command}', Mode: '${mode}'`);

  const CWD = process.cwd(); // process.cwd() is the Current Working Directory for the Node process (your project root)
  console.log(`[VITE_CONFIG_DEBUG] Current working directory (process.cwd()): '${CWD}'`);
  console.log(`[VITE_CONFIG_DEBUG] Attempting to load .env files for mode: '${mode}' from directory: '${CWD}'`);

  const loadedEnv = loadEnv(mode, CWD, ''); // Load all env vars from .env files in CWD for the current mode

  console.log('[VITE_CONFIG_DEBUG] Raw object returned by loadEnv():', JSON.stringify(loadedEnv, null, 2));

  if (loadedEnv.VITE_API_URL) {
    console.log(`[VITE_CONFIG_DEBUG] SUCCESS: VITE_API_URL found by loadEnv(). Value: '${loadedEnv.VITE_API_URL}'`);
  } else {
    console.error(`[VITE_CONFIG_DEBUG] ERROR: VITE_API_URL was NOT FOUND by loadEnv() for mode '${mode}'. Check your .env.${mode} file in '${CWD}'.`);
  }

  // BUILD_TARGET is set by cross-env in your package.json scripts
  const buildTarget = process.env.BUILD_TARGET;
  const isMobileBuild = buildTarget === 'mobile';

  console.log(`[vite.config.js - INTERNAL STATE] Mode: '${mode}', Command: '${command}', BUILD_TARGET: '${buildTarget}', isMobileBuild: ${isMobileBuild}`);

  const projectRoot = CWD; // Using CWD as the definitive project root

  let viteOperationalRoot;
  let outputDirectory;
  let baseConfig;
  let publicDirOptionValue;
  let entryHtmlFileAbsolutePath;

  if (isMobileBuild) {
    console.log("[vite.config.js - Mobile Logic] Mobile build detected.");
    viteOperationalRoot = path.resolve(projectRoot, 'public_mobile');
    outputDirectory = path.resolve(projectRoot, 'dist_mobile');
    baseConfig = './';
    entryHtmlFileAbsolutePath = path.resolve(viteOperationalRoot, 'index.html');
    publicDirOptionValue = '.'; // Relative to viteOperationalRoot
    console.log(`[vite.config.js - Mobile Logic] Vite Root: '${viteOperationalRoot}', Output: '${outputDirectory}', Base: '${baseConfig}', Public Assets: '${publicDirOptionValue}', Entry HTML: '${entryHtmlFileAbsolutePath}'`);
  } else { // Web build
    console.log("[vite.config.js - Web Logic] Web build detected.");
    viteOperationalRoot = projectRoot;
    outputDirectory = path.resolve(projectRoot, 'dist_web');
    entryHtmlFileAbsolutePath = path.resolve(viteOperationalRoot, 'index.html');
    publicDirOptionValue = 'public'; // Relative to viteOperationalRoot
    if (command === 'build' && (mode === 'production' || mode === 'test' || mode === 'preview' || mode === 'team')) {
      baseConfig = '/static/';
    } else { // development or other build modes not specified
      baseConfig = '/';
    }
    console.log(`[vite.config.js - Web Logic] Vite Root: '${viteOperationalRoot}', Output: '${outputDirectory}', Base: '${baseConfig}', Public Assets: '${publicDirOptionValue}', Entry HTML: '${entryHtmlFileAbsolutePath}'`);
  }

  const configToReturn = {
    root: viteOperationalRoot,
    base: baseConfig,
    publicDir: publicDirOptionValue,
    plugins: [
      react(),
      svgr({ svgrOptions: { icon: true, exportType: "named", namedExport: "ReactComponent" } }),
    ],
    // Explicitly define environment variables for client-side import.meta.env
    // Vite should do this automatically for VITE_ prefixed variables,
    // but this makes it very explicit.
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(loadedEnv.VITE_API_URL),
      // Add other VITE_ prefixed vars here if they are also problematic
      // 'import.meta.env.VITE_SOME_OTHER_KEY': JSON.stringify(loadedEnv.VITE_SOME_OTHER_KEY),
    },
    server: {
      proxy: {
        '/admin': { target: 'http://localhost:8000', changeOrigin: true, secure: false, rewrite: (path: any) => path },
        '/static': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
        '/media': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        // ... your other proxies from the original config
      },
      host: '0.0.0.0',
      port: 3000,
    },
    build: {
      outDir: outputDirectory,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: entryHtmlFileAbsolutePath
        }
      },
    },
    resolve: {
      alias: {
        // Ensure 'src' path is correct relative to the actual project root (CWD)
        '@': path.resolve(projectRoot, 'src'),
      }
    }
  };

  console.log('[VITE_CONFIG_RETURN] Returning Vite configuration object.');
  return configToReturn;
});