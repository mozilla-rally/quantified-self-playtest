// Tell eslint that PageManager isn't actually undefined
/* global PageManager */

import { produce } from "immer/dist/immer.cjs.production.min";

const EVENTS = ['interval', 'page-visit-start', 'page-visit-stop', 'attention-start', 'attention-stop', 'audio-start', 'audio-stop'];

export default class Collector {
    constructor(args = {}) {
        const initialState = args.initialState;
        // If no initial state is passed in, opt for a plain object.
        this._state = {...(initialState || {})};
        this.collectors = {};
        this.reporters = {};
        this.collectionIntervals = [];
    }

    collect(event, callback, timing) {
        if (!EVENTS.includes(event)) throw Error(`collect received an unrecognized event type "${event}"`);
        if (!(callback instanceof Function)) throw Error(`the collect callback must be a function. Instead received ${typeof callback}`);
        if (event === 'interval') {
            this.collectionIntervals.push({
                callback, timing
            })
        } else {
            this.collectors[event] = [...(this.collectors[event] || []), callback];
        }
    }

    report(event, callback) {
        if (!EVENTS.includes(event)) throw Error(`report received an unrecognized event type "${event}"`);
        if (!(callback instanceof Function || typeof callback === 'string')) throw Error(`the report callback must be a function or string. Instead received ${typeof callback}`);
        this.reporters[event] = [...(this.reporters[event] || []), callback];
    }

    _sendTo(schemaNamespace, payload) {
        PageManager.sendMessage({
            type: schemaNamespace,
            ...payload
        })
    }

    _executeCollectionCallbacks(event, params) {
        this.collectors[event].forEach((callback) => {
            this._state = produce(this._state, (state) => {
                callback(state, params, PageManager);
            })
        });
    }

    _executeReportingCallbacks(event, params) {
        this.reporters[event].forEach((callbackOrNamespace) => {
            const finalState = produce(this._state, () => {});
            if (typeof callbackOrNamespace === 'string') {
                this._sendTo(callbackOrNamespace, finalState);
            } else if (typeof callbackOrNamespace === 'function') {
                callbackOrNamespace(finalState, this._sendTo, params, PageManager);
            } else {
                throw Error("report argument must be")
            }
            
        });
    }

    _addCallbacksToListener(event) {
        if ((event !== 'interval') && !(event in this.collectors) && !(event in this.reporters)) { return; }
        if (event === 'interval') {
            this.collectionIntervals.forEach((interval) => {
                interval.id = setInterval(() => {
                    this._state = produce(this._state, (state) => {
                        interval.callback(state, { timeStamp: +new Date() }, PageManager);
                    })
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

        // run page visit start asap if PageManager is already running.
        if (event === 'page-visit-start' && PageManager.pageVisitStarted) {
            this._executeCollectionCallbacks('page-visit-start', { timeStamp: PageManager.pageVisitStartTime });
            return;
        }

        pageManagerEvent.addListener((params) => {
            // run all the functions for this pageManagerEvent.
            // FIXME: requires cleanup at some point
            // 
            const thisCallbackShouldBeRun = 
            (event === 'attention-start' && PageManager.pageHasAttention) || // actual attention start
            (event === 'attention-stop' && !PageManager.pageHasAttention) || // actual attention end
            (event === 'audio-start' && PageManager.pageHasAudio) || // actual audio start
            (event === 'audio-stop' && !PageManager.pageHasAudio) || // actual audio end
            (event === 'page-visit-start' || event === 'page-visit-stop');

            if (event in this.collectors && thisCallbackShouldBeRun) {
                this._executeCollectionCallbacks(event, params);
            }
            if (event in this.reporters && thisCallbackShouldBeRun) {
                this._executeReportingCallbacks(event, params);
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