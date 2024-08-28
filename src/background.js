const RUTOKEN_CONFIG = {
    GLOBAL_OBJECT: {},
    HOST_NAME: "ru.rutoken.firewyrmhost",
    MIME_TYPE: "application/x-rutoken-plugin",
    PORTS: {}
  };
  
  const BROWSER_INFO = {
    isIE: /*@cc_on!@*/false || !!document.documentMode,
    isEdge: !this.isIE && !!window.StyleMedia,
    currentBrowser: (!!window.chrome && !!chrome.runtime) ? chrome : browser
  };
  
  console.log("Инициализация фонового скрипта");
  
  const handlePortConnection = (scriptPort) => {
    console.log("Соединение установлено!");
    const portName = scriptPort.name;
    const hostPort = BROWSER_INFO.currentBrowser.runtime.connectNative(RUTOKEN_CONFIG.HOST_NAME);
    
    RUTOKEN_CONFIG.PORTS[portName] = { script: scriptPort, host: hostPort };
  
    const messageHandlers = {
      scriptToHost: (msg) => hostPort.postMessage(msg),
      hostToScript: (msg) => {
        let parsedMsg = msg;
        if (BROWSER_INFO.isEdge) {
          if (msg === "edge_ack") return;
          try {
            parsedMsg = JSON.parse(msg);
          } catch (e) {
            parsedMsg = msg;
          }
        }
        scriptPort.postMessage(parsedMsg);
      }
    };
  
    scriptPort.onMessage.addListener(messageHandlers.scriptToHost);
    hostPort.onMessage.addListener(messageHandlers.hostToScript);
  
    const disconnectHandlers = {
      scriptDisconnect: () => hostPort.disconnect(),
      hostDisconnect: () => {
        const errorMsg = BROWSER_INFO.currentBrowser.runtime.lastError
          ? { error: "Отключено", message: BROWSER_INFO.currentBrowser.runtime.lastError.message }
          : { error: "Отключено" };
        
        if (errorMsg.message) {
          console.warn("Отключено:", errorMsg.message);
        }
        
        scriptPort.postMessage(errorMsg);
        scriptPort.disconnect();
      }
    };
  
    scriptPort.onDisconnect.addListener(disconnectHandlers.scriptDisconnect);
    hostPort.onDisconnect.addListener(disconnectHandlers.hostDisconnect);
  };
  
  BROWSER_INFO.currentBrowser.runtime.onConnect.addListener(handlePortConnection);