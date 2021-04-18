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

basicCollector.collect(
    'attention-stop', 
    (state, pageInfo, pageManager) => {
        state.attentionEnd = pageInfo.timeStamp;
        state.attentionCount += 1;
        state.totalAttentionTime += state.attentionEnd - state.attentionStart;
        delete state.attentionStart;
        delete state.attentionEnd;
    }
);

basicCollector.collect('interval',
    (state, pageInfo, pageManager) => {
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
basicCollector.sendOn("attention-stop", { namespace: "basic" });
basicCollector.sendOn("page-visit-stop", { namespace: "basic" });
basicCollector.run();