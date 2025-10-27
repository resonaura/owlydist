import { ConsolePlaceTag, ConsoleTools } from '../tools/console';

import { PlayheadEvent } from '../interfaces/PlayheadEvent';
// SimpleFX utilities not required for distortion/bitcrush graph
import { WindowProperty } from '../global/WindowProps';
import { default as core } from '@elemaudio/plugin-renderer';
import { el as elementary } from '@elemaudio/core';

let consolePlaceTag = new ConsolePlaceTag({
    text: 'PluginCore',
    background: 'black',
    color: 'white',
});

export class PluginCore {
    private coreReady = false;

    private coreNeedsRerender = false;
    private dawPropertiesChangeLoadingEnabled = true;

    private sampleRate: number;

    public constructor(sampleRate = 48000) {
        this.sampleRate = sampleRate;
    }

    private rerenderCore() {
        if (!this.coreReady) {
            ConsoleTools.warn(
                "Core can't be rendered because it's not initialized.",
                consolePlaceTag
            );
            return;
        }

        const gain = window.props.getPropertyValue('gain') ?? 0.5;
        const tone = window.props.getPropertyValue('tone') ?? 0.5;
        const crush = window.props.getPropertyValue('crush') ?? 0.0;

        let dryLeft = elementary.in({ channel: 0 });
        let dryRight = elementary.in({ channel: 1 });

        // Map UI to parameters
        const drive = 1 + gain * 20; // 1..21
        const cutoffHz = 300 + tone * 7700; // 300..8000 Hz
        const bits = 16 - Math.round(crush * 12); // 16..4
        const levels = Math.max(2, Math.pow(2, bits) - 1);

        // Pre-filter then waveshaper
        let preL = elementary.lowpass(cutoffHz, 0.7, dryLeft);
        let preR = elementary.lowpass(cutoffHz, 0.7, dryRight);
        let distL = elementary.mul(0.25, elementary.tanh(elementary.mul(drive, preL)));
        let distR = elementary.mul(0.25, elementary.tanh(elementary.mul(drive, preR)));

        // Bitcrusher (symmetric rounding quantizer to avoid DC bias/noise at silence)
        const signL = elementary.select(elementary.ge(distL, 0), 1, -1);
        const signR = elementary.select(elementary.ge(distR, 0), 1, -1);
        const magL = elementary.abs(distL);
        const magR = elementary.abs(distR);
        const qStepsL = elementary.floor(
            elementary.add(0.5, elementary.mul(levels, magL))
        );
        const qStepsR = elementary.floor(
            elementary.add(0.5, elementary.mul(levels, magR))
        );
        const crushL = elementary.div(
            elementary.mul(signL, qStepsL),
            levels
        );
        const crushR = elementary.div(
            elementary.mul(signR, qStepsR),
            levels
        );

        // Optional gate to absolute silence when input is near zero
        const gateL = elementary.leq(elementary.abs(dryLeft), 1e-6);
        const gateR = elementary.leq(elementary.abs(dryRight), 1e-6);
        const outL = elementary.select(gateL, 0, crushL);
        const outR = elementary.select(gateR, 0, crushR);

        let mixedLeft = outL;
        let mixedRight = outR;

        let meterLeft = elementary.meter({ name: 'left' }, mixedLeft);
        let meterRight = elementary.meter({ name: 'right' }, mixedRight);

        core.render(meterLeft, meterRight);

        ConsoleTools.log('Audio core rendered', consolePlaceTag);
    }

    public getDawPropertiesChangeLoadingEnabled(): boolean {
        return this.dawPropertiesChangeLoadingEnabled;
    }

    public setDawPropertiesChangeLoadingEnabled(enabled: boolean) {
        if (enabled !== this.dawPropertiesChangeLoadingEnabled) {
            this.dawPropertiesChangeLoadingEnabled = enabled;
            ConsoleTools.log(
                'DAW properties change event LOCK ' +
                    (enabled ? 'disabled' : 'enabled'),
                consolePlaceTag
            );
        }
    }

    public init() {
        core.on('playhead', function (e: PlayheadEvent) {
            window.props.setPropertyValue('bpm', e.bpm);
        });

        window.props.onChange((prop: WindowProperty) => {
            ConsoleTools.log(
                "Global prop '" + prop.name + "' changed to " + prop.value,
                consolePlaceTag
            );

            this.coreNeedsRerender = true;

            let state = {} as any;

            window.props.getAllPropsExcept('bpm').forEach((prop) => {
                state[prop.name] = prop.value;
            });

            if (!this.dawPropertiesChangeLoadingEnabled) {
                core.dispatch('setParameterValue', prop);
                ConsoleTools.log('Changes sended to DAW', consolePlaceTag);
            }

            core.dispatch('saveState', JSON.stringify(state));
            ConsoleTools.log('State sended to DAW', consolePlaceTag);
        });

        setInterval(() => {
            if (this.coreNeedsRerender) {
                this.rerenderCore();
                this.coreNeedsRerender = false;
            }
        }, 100);

        core.on('error', (e) => ConsoleTools.error(e));

        core.on('meter', function (e) {
            /*if (e.source === 'left') {
                window.props.setPropertyValue('audioPeakL', e.max);
            }
            if (e.source === 'right') {
                window.props.setPropertyValue('audioPeakR', e.max);
            }*/
        });
        core.on('parameterValueChange', (e) => {
            if (this.dawPropertiesChangeLoadingEnabled) {
                ConsoleTools.log(
                    'Received update from DAW for property "' +
                        e.paramId +
                        '". Value: "' +
                        e.value,
                    consolePlaceTag
                );
                window.props.setPropertyValue(e.paramId, e.value);
            }
        });
        core.on('loadState', (e) => {
            let parsedData = JSON.parse(e.value);

            ConsoleTools.log(
                'Received state from DAW: ',
                consolePlaceTag,
                parsedData
            );

            if (parsedData) {
                Object.keys(parsedData).forEach((key) => {
                    window.props.setPropertyValue(
                        key,
                        parsedData[key] ?? window.props.getPropertyValue(key)
                    );
                });
            }

            this.rerenderCore();
        });

        core.on('load', () => {
            ConsoleTools.log('Audio core loaded', consolePlaceTag);
            this.coreReady = true;

            this.rerenderCore();
            core.dispatch('resize', { width: 880, height: 550 });
        });

        core.initialize();
    }
}
