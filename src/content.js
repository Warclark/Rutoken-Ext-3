(() => {
    const RUTOKEN_CONFIG = {
        nextId: 1,
        ports: {},
        browser: (!!window.chrome && !!chrome.runtime) ? chrome : browser,
        extId: (!!window.chrome && !!chrome.runtime) ? chrome.runtime.id : browser.runtime.id,
        objId: "C3B7563B-BF85-45B7-88FC-7CFF1BD3C2DB",
        handlers: {}
    };

    const isValidRutokenMessage = (data) => {
        return data && data.rutoken && data.rutoken.ext === RUTOKEN_CONFIG.extId
            && data.rutoken.source === "webpage" && data.rutoken.action;
    };

    window.addEventListener("message", (event) => {
        if (event.source !== window || !event.data) return;

        if (!isValidRutokenMessage(event.data)) return;

        const handler = RUTOKEN_CONFIG.handlers[event.data.rutoken.action];
        handler ? handler(event.data.rutoken) : console.warn(`Неизвестное действие: ${event.data.rutoken.action}`);
    }, false);

    RUTOKEN_CONFIG.handlers.initialize = () => {
        fetchAndInjectScript("src/webpage.js")
            .then(scriptContent => {
                const injectedScript = `
                    (() => {
                        const extId = '${RUTOKEN_CONFIG.extId}';
                        const objId = '${RUTOKEN_CONFIG.objId}';
                        const trash = { firebreath: {extid: extId}};
                        const extension = window[objId];
                        (() => {
                            ${scriptContent}
                        })();
                    })();
                `;
                injectScriptToPage(injectedScript);
            })
            .catch(() => console.warn("Не удалось инициализировать расширение Rutoken"));
    };

    RUTOKEN_CONFIG.handlers.createWyrmhole = () => {
        const portName = `FireWyrmPort${RUTOKEN_CONFIG.nextId++}`;
        const port = RUTOKEN_CONFIG.browser.runtime.connect(RUTOKEN_CONFIG.extId, {name: portName});
        RUTOKEN_CONFIG.ports[portName] = port;

        const sendMessageToPage = (eventType, message = null) => {
            window.postMessage({
                rutoken: {
                    ext: RUTOKEN_CONFIG.extId,
                    source: "content",
                    event: eventType,
                    port: portName,
                    message
                }
            }, "*");
        };

        sendMessageToPage("created");

        port.onMessage.addListener(msg => sendMessageToPage("message", msg));
        port.onDisconnect.addListener(() => {
            sendMessageToPage("disconnected");
            delete RUTOKEN_CONFIG.ports[portName];
        });
    };

    RUTOKEN_CONFIG.handlers.sendToPort = ({port, message}) => {
        RUTOKEN_CONFIG.ports[port] 
            ? RUTOKEN_CONFIG.ports[port].postMessage(message)
            : console.warn(`Недопустимый порт: ${port}`);
    };

    const fetchAndInjectScript = (path) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    (xhr.status >= 200 && xhr.status < 300) ? resolve(xhr.responseText) : reject(xhr);
                }
            };
            xhr.open("GET", RUTOKEN_CONFIG.browser.extension.getURL(path));
            xhr.send();
        });
    };

    const injectScriptToPage = (scriptContent) => {
        const script = document.createElement('script');
        script.textContent = scriptContent;
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
    };

    (() => {
        const initScript = `
            (${(extId, objId) => {
                const extension = window[objId] = {};
                const isIE = /*@cc_on!@*/false || !!document.documentMode;
                const isEdge = !isIE && !!window.StyleMedia;
                
                if (isEdge) {
                    window["EdgeExtension_CJSCAktiv-Soft.AdapterRutokenPlugin_d5nnqc4r3dr54"] = extension;
                } else {
                    window["ealcmcikjjkdafcbilgflbmecfcandon"] = extension;
                }

                extension.initialize = () => {
                    if (extension.initializePromise) {
                        throw "Инициализация уже была вызвана";
                    }

                    extension.initializePromise = {};

                    return new Promise((resolve, reject) => {
                        extension.initializePromise.resolve = resolve;
                        extension.initializePromise.reject = reject;

                        window.postMessage({ rutoken: { ext: extId, source: "webpage", action: "initialize" } }, "*");
                    });
                };
            }})(${JSON.stringify(RUTOKEN_CONFIG.extId)}, ${JSON.stringify(RUTOKEN_CONFIG.objId)})
        `;
        injectScriptToPage(initScript);
    })();
})();