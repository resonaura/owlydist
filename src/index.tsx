import './index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import App from './App';
import { PluginCore } from './audio-core/PluginCore';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WindowProps } from './global/WindowProps';

let rootElement = document.getElementById('root');

if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

declare global {
    interface Window {
        props: WindowProps;
        pluginCore: PluginCore;
    }
}

window.props = new WindowProps([
    { name: 'gain', value: 0.5 },
    { name: 'tone', value: 0.6 },
    { name: 'crush', value: 0.2 },
]);

window.pluginCore = new PluginCore();
window.pluginCore.init();

console.log(process.env);