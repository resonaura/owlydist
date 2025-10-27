import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig(
    ({ command, mode }: { command: 'serve' | 'build'; mode: string }) => {
        let httpsOption: any = true; // fallback to HTTP unless valid certs are found

        // Keep previous behavior for impulse directory across dev/build
        // In dev, use URL-relative path so the browser fetches from Vite's public dir
        let impulseDir = 'impulses';
        if (command === 'build') {
            if (process.platform === 'win32') {
                impulseDir =
                    'C:/Program Files/Common Files/VST3/Owly DIST.vst3/Contents/Resources/assets/impulses';
            } else if (process.platform === 'darwin') {
                impulseDir =
                    'Library/Audio/Plug-ins/VST3/Owly DIST.vst3/Contents/Resources/assets/impulses';
            } else {
                impulseDir = './impulses';
            }
        }

        const port = parseInt(process.env.PORT || '3000', 10);
        const host = process.env.HOST || '127.0.0.1';

        const plugins: PluginOption[] = [...react()];
        plugins.push(
            basicSsl({
                certDir: path.resolve(__dirname, './.cert'),
            })
        );

        return {
            plugins,
            base: './',
            publicDir: 'public',
            server: {
                host,
                port,
                strictPort: false,
                open: false,
                https: httpsOption,
            },
            build: {
                outDir: 'build',
                assetsDir: 'static',
                sourcemap: true,
                emptyOutDir: true,
            },
            define: {
                // Provide process.env used in the app without refactoring code
                'process.env': {
                    NODE_ENV: mode,
                    REACT_APP_IMPULSE_DIR: impulseDir,
                },
            },
        };
    }
);
