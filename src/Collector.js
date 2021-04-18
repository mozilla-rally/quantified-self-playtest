// Tell eslint that PageManager isn't actually undefined
/* global PageManager */

import { produce } from "immer/dist/immer.cjs.production.min";

const EVENTS = ['interval', 'page-visit-start', 'page-visit-stop', 'attention-start', 'attention-stop', 'audio-start', 'audio-stop'];

export default class Collector {
    constructor(args) {
        const initialState = args.initialState;
        this._state = initialState ? {...initialState} : {};
        this.collectors = {};
        this.reporters = {};
        this.collectionIntervals = [];
    }

    collect(event, callback, timing) {
        if (!EVENTS.includes(event)) throw Error(`collect received an unrecognized event type "${event}"`);
        if (!(callback instanceof Function)) throw Error(`the callback must be a function. Instead received ${typeof callback}`);
        if (event === 'interval') {
            this.collectionIntervals.push({
                callback, timing
            })
        } else {
            this.collectors[event] = [...(this.collectors[event] || []), callback];
        }
    }

    sendOn(event, ...configs) {
        if (!EVENTS.includes(event)) throw Error(`sendOn received an unrecognized event type "${event}"`);
        if (configs.length === 0) throw Error(`sendOn requires at least one defined configuration`)
        this.reporters[event] = [...(this.reporters[event] || []), configs];
    }

    _addCallbacksToListener(event) {
        if ((event !== 'interval') && !(event in this.collectors) && !(event in this.reporters)) { return; }

        // FIXME: add tests
        if (event === 'interval') {
            this.collectionIntervals.forEach((interval) => {
                console.debug('running interrval')
                interval.id = setInterval(() => {
                    this._state = produce(this._state, (state) => {
                        interval.callback(state, { timeStamp: +new Date() }, PageManager);
                    })
                    //interval.callback(this._state, { timeStamp: +new Date() }, PageManager);
                }, interval.timing);
            });
            return;
        }

        let pageManagerEvent;
        switch (event) {
            case 'page-visit-start': {
                pageManagerEvent = PageManager.onPageVisitStart;
                break;
            }
            case 'page-visit-stop': {
                pageManagerEvent = PageManager.onPageVisitStop;
                break;
            }
            case 'attention-start': {
                pageManagerEvent = PageManager.onPageAttentionUpdate;
                break;
            }
            case "attention-stop": {
                pageManagerEvent = PageManager.onPageAttentionUpdate;
                break;
            }
            case "audio-start": {
                pageManagerEvent = PageManager.onPageAudioUpdate;
                break;
            }
            case "audio-stop": {
                pageManagerEvent = PageManager.onPageAudioUpdate;
                break;
            }
            default: {
                throw Error(`event "${event}" not recognized`);
            }
        }

        const produceState = (event, params) => {
            this.collectors[event].forEach((callback) => {
                this._state = produce(this._state, (state) => {
                    callback(state, params, PageManager);
                })
                //callback(this._state, params, PageManager);
            });
        }

        // FIXME: we need tests for this.
        const reportState = (namespace, callback) => {
            // do nothing with callback for now but
            // once we figure out produce, it should be
            // creating a final state to be reported.
            let finalState = this._state;
            if (callback) {
                finalState = produce(this._state, (state) => {
                    callback(state, PageManager);
                })
            }
            PageManager.sendMessage({
                type: namespace,
                ...finalState
            });
        }

        // run page visit start asap if PageManager is already running.
        if (event === 'page-visit-start' && PageManager.pageVisitStarted) {
            produceState('page-visit-start', { timeStamp: PageManager.pageVisitStartTime });
            return;
        }

        pageManagerEvent.addListener((params) => {
            // run all the functions for this pageManagerEvent.
            // FIXME: requires cleanup at some point
            if (event in this.collectors) {
                if ((event === 'attention-start' && PageManager.pageHasAttention)) {
                    console.log('COLLECT', event);
                    produceState('attention-start', params);
                } else if (event === 'attention-stop' && !PageManager.pageHasAttention) {
                    console.log('COLLECT', event);
                    produceState('attention-stop', params);
                } else if (event === 'audio-start' && PageManager.pageHasAudio) {
                    console.log('COLLECT', event);
                    produceState('audio-start', params);
                } else if (event === 'audio-stop' && !PageManager.pageHasAudio) {
                    console.log('COLLECT', event);
                    produceState('audio-stop', params);
                } else if (event === 'page-visit-start' || event === 'page-visit-stop') {
                    console.log('COLLECT', event);
                    produceState(event, params);
                }
            }
            if (event in this.reporters) {
                this.reporters[event].forEach((reportingConfigs) => {
                    const thisShouldBeReported = 
                        (event === 'attention-start' && PageManager.pageHasAttention) || // actual attention start
                        (event === 'attention-stop' && !PageManager.pageHasAttention) || // actual attention end
                        (event === 'audio-start' && PageManager.pageHasAudio) || // actual audio start
                        (event === 'audio-stop' && !PageManager.pageHasAudio) || // actual audio end
                        (event === 'page-visit-start' || event === 'page-visit-stop');
                    if (thisShouldBeReported) {
                        console.log('REPORT', event, this._state);
                        reportingConfigs.forEach(({ namespace, callback }) => {
                            reportState(namespace, callback);
                        })
                    }
                });
            }
        });
    }

    _addAllCallbacks() {
        this._addCallbacksToListener('page-visit-start');
        this._addCallbacksToListener('attention-start');
        this._addCallbacksToListener('audio-start');
        this._addCallbacksToListener('page-visit-stop');
        this._addCallbacksToListener('attention-stop');
        this._addCallbacksToListener('audio-stop');
        this._addCallbacksToListener('interval');
    }

    run() {
        if ("PageManager" in window) {
            console.log('calling all callbacks for Collector here')
            this._addAllCallbacks();
        } else {
            if(!("pageManagerHasLoaded" in window)) {
                window.pageManagerHasLoaded = [];
            }
            window.pageManagerHasLoaded.push(this._addAllCallbacks.bind(this));
        }
    }
}