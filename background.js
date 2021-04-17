let enable = true;

chrome.storage.local.get("enable", (data) => {
  enable = data.enable == undefined ? true : data.enable;
  if (enable) {
    chrome.browserAction.setIcon({ path: "enable.png" });
  } else {
    chrome.browserAction.setIcon({ path: "disable.png" });
  }
});

chrome.browserAction.onClicked.addListener(function (tab) {
  console.log(enable);
  enable = !enable;
  chrome.storage.local.set({ enable });
  if (enable) {
    chrome.browserAction.setIcon({ path: "enable.png" });
  } else {
    chrome.browserAction.setIcon({ path: "disable.png" });
  }
});
