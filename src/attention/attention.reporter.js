import Reporter from "../../lib/reporter";

const attention = new Reporter({ collectorName: "attention" });

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

attention.addSchema("attention", {
  ...sharedEventProperties,
  maxRelativeScrollDepth: "number",
  maxPixelScrollDepth: "number",
  scrollHeight: "number",
});

attention.addSchema("audio", {...sharedEventProperties});

export default attention;