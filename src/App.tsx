import './App.scss';

import { useEffect, useState } from 'react';

import BigKnob from './components/BigKnob/BigKnob';

function App() {
    const [gain, setGain] = useState<number>(
        window.props.getPropertyValue('gain')
    );
    const [tone, setTone] = useState<number>(
        window.props.getPropertyValue('tone')
    );
    const [crush, setCrush] = useState<number>(
        window.props.getPropertyValue('crush')
    );

    useEffect(() => {
        if (!window.pluginCore.getDawPropertiesChangeLoadingEnabled())
            window.props.setPropertyValue('gain', gain);
    }, [gain]);
    useEffect(() => {
        if (!window.pluginCore.getDawPropertiesChangeLoadingEnabled())
            window.props.setPropertyValue('tone', tone);
    }, [tone]);
    useEffect(() => {
        if (!window.pluginCore.getDawPropertiesChangeLoadingEnabled())
            window.props.setPropertyValue('crush', crush);
    }, [crush]);

    useEffect(() => {
        window.props.onPropertyChange('gain', (value: number) => {
            setGain(value);
        });
        window.props.onPropertyChange('tone', (value: number) => {
            setTone(value);
        });
        window.props.onPropertyChange('crush', (value: number) => {
            setCrush(value);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className='app'>
            <div className='app-main'>
                <img src={'owlydist.svg'} className='app-logo' alt='logo' />
                <div className='knobs-layout'>
                    <div className='row-big'>
                        <BigKnob
                            title='GAIN'
                            smooth={true}
                            movementPowerAdjust={2}
                            value={gain}
                            color={1}
                            size='large'
                            backgroundImageUrl={'nuberg.png'}
                            onChange={(v: number) => setGain(v)}
                            onActivityChange={(active: boolean) =>
                                window.pluginCore.setDawPropertiesChangeLoadingEnabled(
                                    !active
                                )
                            }
                        />
                    </div>
                    <div className='row-small'>
                        <BigKnob
                            title='TONE'
                            value={tone}
                            color={3}
                            size='small'
                            onChange={(v: number) => setTone(v)}
                            onActivityChange={(active: boolean) =>
                                window.pluginCore.setDawPropertiesChangeLoadingEnabled(
                                    !active
                                )
                            }
                        />
                        <BigKnob
                            title='CRUSH'
                            value={crush}
                            color={4}
                            size='small'
                            onChange={(v: number) => setCrush(v)}
                            onActivityChange={(active: boolean) =>
                                window.pluginCore.setDawPropertiesChangeLoadingEnabled(
                                    !active
                                )
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
