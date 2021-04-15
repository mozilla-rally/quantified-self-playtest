// import { Rally, runStates } from "@mozilla/rally";
import browser from "webextension-polyfill";
import EventStreamInspector from "./event-stream-inspector";
import { onPageData } from "./attention-reporter";

const inspector = new EventStreamInspector();
  
function collectEventDataAndSubmit(devMode) {
  inspector.initialize();
  // note: onPageData calls startMeasurement.
  onPageData.addListener(async (data) => {
    if (devMode) {
      console.debug("RS01.event", data);
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

// export default async function runStudy(devMode) {
//     const rally = new Rally();
//     try {
//       await rally.initialize(
//         "zero-one",
//         {
//           "crv": "P-256",
//           "kid": "zero-one",
//           "kty": "EC",
//           "x": "edhPpqhgK9dD7NaqhQ7Ckw9sU6b39X7XB8HnA366Rjs",
//           "y": "GzsfM19n-iH-DVR0iKEoA8BE2CFF46wR__siJ3SdiNs"
//         },          
//       devMode,
//       (newState) => {
//           if (newState === runStates.RUNNING) {
//           // if the study is running but wasn't previously, let's re-initiate the onPageData listener.
//           console.debug("~~~ RS01 running ~~~");
//           collectEventDataAndSubmit(rally, devMode);
//           } else {
//           console.debug("~~~ RS01 not running ~~~");
//           // stop the measurement here.
//           stopMeasurement();
//           }
//       })
//     } catch (err) {
//       throw new Error(err);
//     }
//     // if initialization worked, commence data collection.
//     console.debug("~~~ RS01 running ~~~");
//     collectEventDataAndSubmit(rally, devMode);
//     return rally;
// }
