import * as PageManager from "../WebScience/Utilities/PageManager.js";
import * as Messaging from "../WebScience/Utilities/Messaging.js";
import * as Events from "../WebScience/Utilities/Events.js";

export default class Reporter {
    constructor({ collectorName, matchPatterns = ['<all_urls>'] }) {
        this.matchPatterns = matchPatterns;
        this.collectorName = collectorName;
        this.schemas = [];
        this.notifyAboutPrivateWindows = false;
        this.onPageData = new Events.Event({
            addListenerCallback: this._addListener.bind(this),
            removeListenerCallback: this._removeListener.bind(this)});
    }

    _addListener(listener, options) {
        this._startMeasurement(options);
    }

    _removeListener(listener) {
        // if (!this.hasAnyListeners()) {
            this._stopMeasurement();
        // }
    }

    _pageDataListener(pageData) {
        // If the page is in a private window and the module should not measure private windows,
        // ignore the page
        if(!(this.notifyAboutPrivateWindows) && pageData.privateWindow) {
            return;
        }
    
        // Delete the type string from the content script message
        delete pageData.type;
        this.onPageData.notifyListeners([ pageData ]);
    }

    addSchema(schemaNamespace, schema) {
        this.schemas.push({ schema, schemaNamespace });
    }

    async _startMeasurement(matchPatterns = ['<all_urls>']) {
        await PageManager.initialize();

        this.registeredContentScript = await browser.contentScripts.register({
            matches: this.matchPatterns,
            js: [{
                file: `/dist/content-scripts/${this.collectorName}.collector.js`
            }],
            runAt: "document_start"
        });
        if (!this.schemas.length) { throw Error('the reporter must have at least one schema') }
        this.schemas.forEach(({ schemaNamespace, schema }) => {
            Messaging.registerListener(schemaNamespace, this._pageDataListener.bind(this), schema);
        })
    }

    async _stopMeasurement() {
        this.schemas.forEach(({ schemaNamespace }) => {
            Messaging.unregisterListener(schemaNamespace, this._pageDataListener);    
        })
        
        this.registeredContentScript.unregister();
        this.registeredContentScript = null;
        this.notifyAboutPrivateWindows = false;
    }

    addListener(callback, options) {
        this.onPageData.addListener(callback, options);
    }
}