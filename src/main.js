// import { Rally, runStates } from "@mozilla/rally";
import browser from "webextension-polyfill";
import EventStreamInspector from "../lib/event-stream-inspector";
import attention from "./attention.reporter";
import head from './head.reporter';

const inspector = new EventStreamInspector();
  
function collectEventDataAndSubmit(devMode) {
  inspector.initialize();
  // note: onPageData calls startMeasurement.
  head.addListener(async (data) => {
      console.debug('head contents:', data);
  }, {
    matchPatterns: ["<all_urls>"],
    privateWindows: false
});
  attention.addListener(async (data) => {
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

function letsGetCollecting(devMode) {
  collectEventDataAndSubmit(devMode);
  browser.browserAction.onClicked.addListener(openPage);
}

letsGetCollecting(__ENABLE_DEVELOPER_MODE__);