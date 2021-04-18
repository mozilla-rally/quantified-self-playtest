// for each measurement, the config must define:
// - the collector
// - the reporter
// - the schema
// - the details

// every collector file should look like this:
// basic.measurement.js
// social-media.measurement.js
// so that rollup can roll these up.

import Measurement from "./Measurement";

const basicPageStuff = new Measurement({
    namespace: 'basic',
    schema: {
            attentionCount: 'number',
            totalAttentionTime: 'number',
            url: "string",
            maxPixelScrollDepth: 'number'
        }
});

// the basicReporter is responsible for starting and stopping the
// data collection as well as reporting any payloads sent by the collectorr.
export const basicReporter = basicPageStuff.reporter;
