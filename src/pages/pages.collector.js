/* 
page.collector.js

This collector captures page-level details.
It will emit after the end of every attention event
and replaces whatever entry exists for this particular page id.

* pageId (primary key)
* url
* startTime
* title
* meta keywords
* metaDescription
* ogDescription
* ogType
* ogImage
* ogUrl
* ogProductPluralTitle
* ogProductPriceAmount
* ogProductPriceCurrency
* maxRelativeScrollDepth
* maxAbsoluteScrollDepth
* largestPageHeight
*/

import Collector from '../../lib/collector';
import { getContentByElementName, getContentByTagProperty } from './probes';
const pageCollector = new Collector();

function onEventEnd() {
    return (collector, pageInfo, pageManager) => {
        const state = collector.get();
        const maxScrollHeight = state.maxScrollHeight || 0;
        const maxPixelScrollDepth = state.maxPixelScrollDepth || 0;

        const title = getContentByElementName("title", document) || "";
        // standards
        const ogTitle =getContentByTagProperty("og:title", document) || ""; 
        const ogDescription = getContentByTagProperty("og:description", document) || "";
        const ogType = getContentByTagProperty("og:type", document) || "";
        const ogImage = getContentByTagProperty("og:image", document) || "";
        const ogURL = getContentByTagProperty("og:url", document) || "";
        collector.send("page", {
            pageId: pageManager.pageId,
            url: pageManager.url,
            title,
            ogTitle,
            ogDescription,
            ogType,
            ogImage,
            ogURL,
            maxScrollHeight, 
            maxPixelScrollDepth
        });
    }
}

pageCollector.on('attention-stop', onEventEnd());
pageCollector.on('page-visit-stop', onEventEnd());

function collectScrollInformation(state) {

    const h = document.documentElement;
    const b = document.body;

    const maxScrollHeight = Math.max(h.scrollHeight || b.scrollHeight || 0, state.maxScrollHeight || 0, 0);

    const maxPixelScrollDepth =
        Math.min(maxScrollHeight,
            Math.max(
                (state.maxPixelScrollDepth || 0), 
                (h.scrollTop || b.scrollTop) + 
                window.innerHeight
            )
        );
    
    state.maxPixelScrollDepth = maxPixelScrollDepth;
    state.maxScrollHeight = maxScrollHeight;
}

pageCollector.on('interval', (collector) => { collector.updateState(collectScrollInformation); }, 1000);

pageCollector.run();