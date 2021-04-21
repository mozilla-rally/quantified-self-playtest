// this is in the content script domain.
import Collector from './Collector';

const basicCollector = new Collector();

basicCollector.collect(
    "page-visit-start", 
    (state) => {
        // initializing relevant variables.
        state.attentionCount = 0;
        state.totalAttentionTime = 0;
        state.maxPixelScrollDepth = 0;
    }
)

basicCollector.collect(
    "attention-start", 
    (state, pageInfo, pageManager) => {
        state.attentionStart = pageInfo.timeStamp;
        // update the url in case it has changed.
        state.url = pageManager.url;
    }
);

function closeOutEvent(state, timeStamp) {
    state.attentionCount += 1;
    state.totalAttentionTime += timeStamp - state.attentionStart;
    delete state.attentionStart;
}

basicCollector.collect(
    'attention-stop', 
    (state, pageInfo) => {
        closeOutEvent(state, pageInfo.timeStamp);
    }
);

basicCollector.collect(
    `page-visit-stop`,
    (state, pageInfo, pageManager) => {
        // close out the event if the current page the attention
        if (pageManager.pageHasAttention) {
            closeOutEvent(state, pageInfo.timeStamp);
        }
    }
)

basicCollector.collect('interval',
    (state) => {
        const scrollHeight = document.documentElement.scrollHeight;
        const maxPixelScrollDepth =
            Math.min(scrollHeight,
                Math.max((state.maxPixelScrollDepth), 
                    window.scrollY + document.documentElement.clientHeight)
            );
        state.maxPixelScrollDepth = maxPixelScrollDepth;
    }, 1000);

// emit the payload on attention-stop and when the page is up.
// you can include any number of namespace definitions after the event,
// and it will send to each one of these.
//basicCollector.sendOn("attention-stop", { schemaNamespace: "attentionEvent" });
//basicCollector.sendOn("page-visit-stop", { schemaNamespace: "attentionEvent" });
basicCollector.report('attention-stop', "attentionEvent");

basicCollector.report('page-visit-stop', (state, send, pageInfo, pageManager) => {
    // a page visit might stop (e.g. closing an inactive tab) without having
    // the user's focus.
    if (pageManager.pageHasAttention) {
        send("attentionEvent", state);
    }
})
basicCollector.run();