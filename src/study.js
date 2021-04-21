// import { Rally, runStates } from "@mozilla/rally";
import browser from "webextension-polyfill";
import EventStreamInspector from "./event-stream-inspector";
import Reporter from "./Reporter";

const basicReporter = new Reporter({ collectorName: "basic" });
basicReporter.addSchema("attentionEvent", {
  attentionCount: 'number',
  totalAttentionTime: 'number',
  url: "string",
  maxPixelScrollDepth: 'number'
});

const inspector = new EventStreamInspector();
  
function collectEventDataAndSubmit(devMode) {
  inspector.initialize();
  // note: onPageData calls startMeasurement.
  basicReporter.addListener(async (data) => {
    if (devMode) {
      console.debug("attentionEvent", data);
    }
    inspector.storage.push(data);
  }, {
      matchPatterns: ["<all_urls>"],
      privateWindows: false
  });
}

function openPage() {
  browser.runtime.openOptionsPage().catch(e => {
    console.error(`Study Add-On - Unable to open the control panel`, e);
  });
}

export default async function runStory(devMode) {
  collectEventDataAndSubmit(devMode);
  
  browser.browserAction.onClicked.addListener(openPage);
}
