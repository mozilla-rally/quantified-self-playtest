/** generates the intermediate background script which
 * stitches together all the modules needed to run this collection effort.
 * There's probably a better way to do this but I'm ok with this as it is now.
 */

function imports(config) {
    return config.map(module => {
        return `import ${module.namespace} from "../${module.src + module.namespace + '.reporter.js'}";`
    }).join('\n');
}

function storage(config) {
    return `
const RALLY_TV_DB = new Dexie("RallyTV");    
RALLY_TV_DB.version(1).stores({
    ${config.map(c => {
        return `${c.namespace}: "++id,createdAt"`
    }).join(',\n')}
});
`
}

function instantiation(config) {
    return config.map(module => {
        return `
${module.namespace}.addListener(
    async (data) => {
        if (__ENABLE_DEVELOPER_MODE__) {
                console.debug("${module.namespace}", data);
        }
        // ${module.namespace}.storage.add(data);
        await RALLY_TV_DB["${module.namespace}"].add(data);
    }, {
        matchPatterns: ${JSON.stringify(module.matchPatterns) ||'["<all_urls>"]'},
        privateWindows: false
    }
);
`}).join('\n') 
}

function optionsPage() {
    return `
function openPage() {
    browser.runtime.openOptionsPage().catch(e => {
        console.error(\`Study Add-On - Unable to open the control panel\`, e);
    });
}
browser.browserAction.onClicked.addListener(openPage);    
    `
}

export default function generateBackgroundScript(config) {
    return `
import Dexie from "dexie";
import browser from "webextension-polyfill";
import EventStreamInspector from "../lib/event-stream-inspector";
${imports(config)};
${storage(config)}
const inspector = new EventStreamInspector(RALLY_TV_DB);
inspector.initialize();
${instantiation(config)}
${optionsPage()}
`
}