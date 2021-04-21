import Collector from "../../src/Collector";

const fcn1 = (state) => { state.value = 10 };
const fcn2 = (state) => { state.value = 20; state.text = 'test'; };
const fcn3 = (state, params) => { state.time = params.timeStamp; };

function mockPageManager() {
    const PM = {};
    PM.sendMessage = () => {};
    const pageVisitStartCallbacks = [];
    PM.onPageVisitStart = {
        listeners: pageVisitStartCallbacks,
        addListener: (callback) => { pageVisitStartCallbacks.push(callback) },
        send: (params = { timeStamp: 1000 }) => { 
            pageVisitStartCallbacks.forEach(fcn => { fcn(params); } );
        }
    }
    const pageVisitStopCallbacks = [];
    PM.onPageVisitStop = {
        listeners: pageVisitStopCallbacks,
        addListener: (callback) => { pageVisitStopCallbacks.push(callback) },
        send: (params = { timeStamp: 1000 }) => { 
            pageVisitStopCallbacks.forEach(fcn => { fcn(params); } ) 
        }
    }
    const pageAttentionUpdateCallbacks = [];
    PM.onPageAttentionUpdate = {
        listeners: pageAttentionUpdateCallbacks,
        addListener: (callback) => { pageAttentionUpdateCallbacks.push(callback) },
        send: (params = { timeStamp: 1000 }) => { 
            pageAttentionUpdateCallbacks.forEach(fcn => { fcn(params); } ) 
        }
    }
    const pageAudioUpdateCallbacks = [];
    PM.onPageAudioUpdate = {
        listeners: pageAudioUpdateCallbacks,
        addListener: (callback) => { pageAudioUpdateCallbacks.push(callback) },
        send: (params = { timeStamp: 1000 }) => { 
            pageAudioUpdateCallbacks.forEach(fcn => { fcn(params); } ) 
        }
    }
    PM.sendMessage = jest.fn();
    return PM;
}

describe('Collector.js', function() {
   let collector;
   beforeEach(function() {
       collector = new Collector();
       global.PageManager = mockPageManager();
   })
   describe('constructor', function() {
       it('keeps in local state the initialState and namespace', function() {
           expect(collector._state).toEqual({});
           const collectorTwo = new Collector({ initialState: { test: 100 }});
           expect(collectorTwo._state).toEqual({ test: 100 });
       })
   })
   describe('.collect', function() {
       it('throws if the event is unrecognized', function() {
           expect(() => collector.collect('whatever', () => {})).toThrow();
       })
       it('throws if arguments are not correct', function() {
            expect(() => collector.collect()).toThrow();
            expect(() => collector.collect('page-visit-start')).toThrow();
            expect(() => collector.collect(10, () => {})).toThrow();
            expect(() => collector.collect('page-visit-start', 10)).toThrow();
       })
       it('adds callbacks to collectors', function() {
           collector.collect('page-visit-start', fcn1);
           expect('page-visit-start' in collector.collectors).toBe(true);
           expect(collector.collectors['page-visit-start'][0]).toBe(fcn1);
           collector.collect('page-visit-start', fcn2);
           expect('page-visit-start' in collector.collectors).toBe(true);
           expect(collector.collectors['page-visit-start'][0]).toBe(fcn1);
           expect(collector.collectors['page-visit-start'][1]).toBe(fcn2);
           expect(collector.collectors['page-visit-start'].length).toBe(2);
           collector.collect('page-visit-stop', fcn3);
           expect('page-visit-stop' in collector.collectors).toBe(true);
           expect(collector.collectors['page-visit-stop'][0]).toBe(fcn3);
       })
   })

   // FIXME: these tests really got out of hand. Yeesh.
   describe("_addCallbacksToListener", function() {
        it('adds to the onPageVisitStart listener', function() {
            collector.collect('page-visit-start', fcn1);
            collector.collect('page-visit-start', fcn2);
            collector.collect('page-visit-start', fcn3);
            collector._addCallbacksToListener('page-visit-start');
            expect(PageManager.onPageVisitStart.listeners.length).toBe(1);
            PageManager.onPageVisitStart.send({ timeStamp: 1000});
        })
        it('transforms the state object', function() {
            collector.collect('page-visit-start', fcn1);
            collector.collect('page-visit-start', fcn2);
            collector.collect('page-visit-start', fcn3);
            collector._addCallbacksToListener('page-visit-start');
            PageManager.onPageVisitStart.send({ timeStamp: 60000000 });
            expect(collector._state).toEqual({ value: 20, text: 'test', time: 60000000 });
        })
        it('calls PageManager.sendMessage when there is a string (the namespace) as the second argument', function() {
            collector.collect('page-visit-start', fcn1);
            collector.collect('page-visit-start', fcn2);
            collector.collect('page-visit-start', fcn3);
            // this function will send whatever the payload is to the "test" namespace as-is
            collector.report("page-visit-start", "test");
            collector._addCallbacksToListener('page-visit-start');
            PageManager.onPageVisitStart.send({ timeStamp: 60000000 });
            expect(PageManager.sendMessage.mock.calls.length).toBe(1);
            expect(PageManager.sendMessage.mock.calls[0][0]).toEqual({ type: "test", value: 20, text: "test", time: 60000000 });
        })
        it('calls PageManager.sendMessage when collector.report has a function as the second argument', function() {
            collector.collect('page-visit-start', fcn1);
            collector.collect('page-visit-start', fcn2);
            collector.collect('page-visit-start', fcn3);
            collector.report("page-visit-start", (state, send) => { send('test', state) });

            collector._addCallbacksToListener('page-visit-start');
            PageManager.onPageVisitStart.send({ timeStamp: 60000000 });
            expect(PageManager.sendMessage.mock.calls.length).toBe(1);
            expect(PageManager.sendMessage.mock.calls[0][0]).toEqual({ type: "test", value: 20, text: "test", time: 60000000 });
        })
        it('handles PageManager events during a full single-page lifecycle', function() {
            const pageVisitStart1 = (state, { timeStamp }) => { state.time = timeStamp; state.count = 1; };
            const pageAttentionStart1 = (state, { timeStamp }) => { state.time = timeStamp; state.count += 1; };
            const pageAttentionStop1 = (state, { timeStamp }) => { state.time = timeStamp; state.count += 1; };
            const pageAttentionStop2 = (state, { timeStamp }) => { state.time = timeStamp; state.count += 1; state.extra = true; };
            const pageVisitStop1 = (state, { timeStamp }) => { state.time = timeStamp; state.count += 1; };
            collector.collect('page-visit-start', pageVisitStart1);
            collector.collect('attention-start', pageAttentionStart1);
            collector.collect('attention-stop', pageAttentionStop1);
            collector.collect('attention-stop', pageAttentionStop2);
            collector.collect('page-visit-stop', pageVisitStop1);
            collector.report("page-visit-stop", (state, send) => { send('test', state) });

            collector._addCallbacksToListener('page-visit-start');
            collector._addCallbacksToListener('attention-start');
            collector._addCallbacksToListener('attention-stop');
            collector._addCallbacksToListener('page-visit-stop');

            // run through each PageManager event.
            PageManager.onPageVisitStart.send({ timeStamp: 6000000 });
            global.PageManager.pageHasAttention = true;
            PageManager.onPageAttentionUpdate.send({ timeStamp: 6000010 });
            global.PageManager.pageHasAttention = false;
            PageManager.onPageAttentionUpdate.send({ timeStamp: 6000020 });
            PageManager.onPageVisitStop.send({ timeStamp: 6000030 });

            expect(collector._state).toEqual({ time: 6000030, count: 5, extra: true});
            expect(PageManager.sendMessage.mock.calls[0][0]).toEqual({ type: "test", time: 6000030, count: 5, extra: true });
        })
        it('handles a single interval collection', function() {
            jest.useFakeTimers();
            collector.collect('interval', (state) => {
                state.count = (state.count || 0) + 1;
            }, 500);
            collector._addCallbacksToListener('interval');
            jest.advanceTimersByTime(1501);
            expect(collector._state).toEqual({ count: 3 });
        })
        it('handles multiple simultaneous interval collections', function() {
            jest.useFakeTimers();
            collector.collect('interval', (state) => {
                state.count1 = (state.count1 || 0) + 1;
            }, 500);
            collector.collect('interval', (state) => {
                state.count2 = (state.count2 || 0) + 1;
            }, 200);
            collector._addCallbacksToListener('interval');
            jest.advanceTimersByTime(1501);
            expect(collector._state).toEqual({ count1: 3, count2: 7 });
        })
    })
});