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
        this.eventHandlers = {};
        this.eventIntervals = [];
    }

    get() {
        return produce(this._state, () => {});
    }

    updateState(callback) {
        this._state = produce(this._state, callback);
        return this._state;
    }

    send(namespace, payload) {
        PageManager.sendMessage({
            type: namespace,
            ...payload
        });
    }

    on(event, callback, timing) {
        if (!EVENTS.includes(event)) throw Error(`collect received an unrecognized event type "${event}"`);
        if (!(callback instanceof Function)) throw Error(`the collect callback must be a function. Instead received ${typeof callback}`);
        if (event === 'interval') {
            this.eventIntervals.push({
                callback, timing
            })
        } else {
            this.eventHandlers[event] = [...(this.eventHandlers[event] || []), callback];
        }
    }

    _executeEventCallbacks(event, params) {
        this.eventHandlers[event].forEach((callback) => {
            callback(this, params, PageManager);
        });
    }

    _runIntervals() {
        this.eventIntervals.forEach((interval) => {
            interval.id = setInterval(() => {
                interval.callback(this, { timeStamp: +new Date() }, PageManager);
            }, interval.timing);
        });
    }

    _addCallbacksToListener(event) {
        if ((event !== 'interval') && !(event in this.eventHandlers)) { return; }
        if (event === 'interval') {
            this._runIntervals();
            return;
        }

        let pageManagerEvent;
        if (event === 'page-visit-start') { pageManagerEvent = PageManager.onPageVisitStart; }
        else if (event === 'page-visit-stop') { pageManagerEvent = PageManager.onPageVisitStop; }
        else if (event === 'attention-start') { pageManagerEvent = PageManager.onPageAttentionUpdate; }
        else if (event === 'attention-stop') { pageManagerEvent = PageManager.onPageAttentionUpdate; }
        else if (event === 'audio-start') { pageManagerEvent = PageManager.onPageAudioUpdate; }
        else if (event === 'audio-stop') { pageManagerEvent = PageManager.onPageAudioUpdate; }
        else { throw Error(`event "${event}" not recognized`); }

        // run page visit start asap if PageManager is already running.
        if (event === 'page-visit-start' && PageManager.pageVisitStarted) {
            this._executeEventCallbacks('page-visit-start', { timeStamp: PageManager.pageVisitStartTime });
            return;
        }

        pageManagerEvent.addListener((params) => {
            const thisCallbackShouldBeRun = 
            (event === 'attention-start' && PageManager.pageHasAttention) || // actual attention start
            (event === 'attention-stop' && !PageManager.pageHasAttention) || // actual attention end
            (event === 'audio-start' && PageManager.pageHasAudio) || // actual audio start
            (event === 'audio-stop' && !PageManager.pageHasAudio) || // actual audio end
            (event === 'page-visit-start' || event === 'page-visit-stop');
            if (event in this.eventHandlers && thisCallbackShouldBeRun) {
                this._executeEventCallbacks(event, params);
            }
        });
    }

    _addAllCallbacks() {
        this._addCallbacksToListener('page-visit-start');
        this._addCallbacksToListener('attention-start');
        this._addCallbacksToListener('audio-start');
        this._addCallbacksToListener('attention-stop');
        this._addCallbacksToListener('audio-stop');
        this._addCallbacksToListener('page-visit-stop');
        // this._addCallbacksToListener('interval');
    }

    run() {
        if ("PageManager" in window) {
            this._addAllCallbacks();
        } else {
            if(!("pageManagerHasLoaded" in window)) {
                window.pageManagerHasLoaded = [];
            }
            window.pageManagerHasLoaded.push(this._addAllCallbacks.bind(this));
        }
    }
}