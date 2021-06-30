// this is in the content script domain.
import Collector from '../../lib/collector';

const RS01Collector = new Collector();

/**
 * 
 * @param {*} documentElement 
 * @returns {string} the content or innerText of the selected DOM element
 */
    function getContentsHavingSelector(str, documentElement) {
    const e = documentElement.querySelector(str);
    return e === null ? undefined : e.content || e.innerText;
}

/**
 * 
 * @param {*} documentElement 
 * @returns {string} the content of the title element
 */
function getTitle(documentElement) {
    return getContentsHavingSelector("title", documentElement);
}

/**
 * 
 * @param {*} documentElement 
 * @returns {string} the content of the meta og:type tag
 */
function getOGType(documentElement) {
    return getContentsHavingSelector("meta[property='og:type']", documentElement);
}

/**
 * 
 * @param {*} documentElement 
 * @returns {string} the content of the meta og:description tag
 */
function getOGDescription(documentElement) {
    return getContentsHavingSelector("meta[property='og:description']", documentElement);
}

/**
 * 
 * @param {*} documentElement 
 * @returns {string} the content of the meta description tag
 */
function getMetaDescription(documentElement) {
    return getContentsHavingSelector("meta[name='description']", documentElement);
}


function finalizeEventState(eventType, lastState, timeStamp, reason) {
    const state = { ...lastState };
    const startTime = eventType === 'attention' ? state.attentionStartTime : state.audioStartTime;
    const stopTime = timeStamp;
    state.eventStartTime = startTime;
    state.eventStopTime = stopTime;
    state.duration = stopTime - startTime;
    state.pageVisitStopTime = timeStamp;
    delete state.attentionStartTime;
    delete state.attentionStopTime;
    delete state.audioStartTime;
    delete state.audioStopTime;
    delete state.attentionAcquired;
    delete state.audioAcquired;

    if (eventType === 'audio') {
        delete state.maxPixelScrollDepth;
        delete state.maxRelativeScrollDepth;
        delete state.scrollHeight;
    }

    state.eventTerminationReason = reason;
    state.eventType = eventType;
    return state;
}

function collectHeaderElements(state) {
    state.title = getTitle(document) || "";
    state.description = getOGDescription(document) || getMetaDescription(document) || "";
    state.ogType = getOGType(document) || "";
}

function collectScrollInformation(state) {
    const scrollHeight = document.documentElement.scrollHeight;

    const maxPixelScrollDepth =
        Math.min(scrollHeight,
            Math.max((state.maxPixelScrollDepth), 
                window.scrollY + document.documentElement.clientHeight)
    );

    state.maxPixelScrollDepth = maxPixelScrollDepth;
    state.scrollHeight = scrollHeight;
}

RS01Collector.on(
    "page-visit-start", 
    (collector, params, pageManager) => {
        // initializing relevant variables.
        collector.updateState(state => {
            state.pageVisitStartTime = params.timeStamp;
            state.referrer = pageManager.referrer;
            state.url = pageManager.url;
            state.pageId = pageManager.pageId;
            state.maxRelativeScrollDepth = 0;
            state.maxPixelScrollDepth = 0;
            state.scrollHeight = 0;
        });
    }
)

RS01Collector.on(
    "attention-start", 
    (collector, pageInfo) => {
        collector.updateState(state => {
            state.attentionStartTime = pageInfo.timeStamp;
            state.attentionAcquired = true;
        });
        collector.updateState(collectHeaderElements);
    }
);

RS01Collector.on('audio-start',
    (collector, pageInfo) => {
        collector.updateState(state => {
            state.audioStartTime = pageInfo.timeStamp;
            state.audioAcquired = true;
        })
    }
)

RS01Collector.on(
    'attention-stop', 
    (collector, pageInfo) => {
        const finalState = finalizeEventState('attention', collector.get(), pageInfo.timeStamp, 'attention-stop');
        collector.send('attention', finalState);
    }
);

RS01Collector.on(
    'audio-stop', 
    (collector, pageInfo) => {
        const finalState = finalizeEventState('audio', collector.get(), pageInfo.timeStamp, 'audio-stopped');
        collector.send('audio', finalState);
    }
);

// collect the scroll depth on an interval.
// This is a nicety but is functionally identical to running setInterval.
RS01Collector.on('interval', (collector) => {
    collector.updateState(collectScrollInformation);
}, 1000);

RS01Collector.on(
    `page-visit-stop`,
    (collector, pageInfo, pageManager) => {
        // close out the event if the current page the attention
        let finalState;
        if (pageManager.pageHasAttention) {
            finalState = finalizeEventState('attention', collector.get(), pageInfo.timeStamp, "page-visit-stop");
            collector.send('attention', finalState);
        }
        if (pageManager.hasAudio) {
            // event has already been closed out.
            finalState = finalizeEventState('audio', collector.get(), pageInfo.timeStamp, "page-visit-stop");
            collector.send('audio', finalState);
        }
    }
)

RS01Collector.run();