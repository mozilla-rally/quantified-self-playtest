import Reporter from "../lib/reporter";

const RS01Reporter = new Reporter({ collectorName: "attention" });

// Event properties that both of these event types consume.
const sharedEventProperties = {
  pageId: "string",
  url: "string",
  referrer: "string",
  eventType: "string",
  pageVisitStartTime: "number",
  pageVisitStopTime: "number",
  eventStartTime: "number",
  eventStopTime: "number",
  duration: "number",
  eventTerminationReason: "string",
  title: "string",
  ogType: "string",
  description: "string",
}

RS01Reporter.addSchema("attention", {
  ...sharedEventProperties,
  maxRelativeScrollDepth: "number",
  maxPixelScrollDepth: "number",
  scrollHeight: "number",
});

RS01Reporter.addSchema("audio", {...sharedEventProperties});

export default RS01Reporter;