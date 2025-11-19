import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VersLibreEditor',
      fileName: (format) => `vers-libre-editor.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ['react', 'react-dom'],
      output: {
        // Global vars for UMD build
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        // Preserve module structure
        preserveModules: false,
        // Asset file names
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'vers-libre-editor.css';
          }
          return assetInfo.name;
        }
      }
    },
    // Generate sourcemaps for debugging
    sourcemap: true,
    // Output directory
    outDir: 'dist',
    // Clean output directory before build
    emptyOutDir: true
  },
  // CSS handling
  css: {
    modules: {
      // Scope CSS to prevent conflicts
      scopeBehaviour: 'local',
      generateScopedName: 'vle-[name]__[local]___[hash:base64:5]'
    }
  },
  // Development server (for testing)
  server: {
    port: 3000,
    open: '/demo.html'
  }
});
