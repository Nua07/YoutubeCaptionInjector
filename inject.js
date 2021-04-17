//https://gist.github.com/x0a/a78f6cebe3356c35a44e88b371f3a03a
console.log("started");
console.log("onbeforescriptexecute" in document);
(function () {
  if ("onbeforescriptexecute" in document) return; // Already natively supported
  console.log("beforescriptexecute pollyfill");
  let scriptWatcher = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (node.tagName === "SCRIPT") {
          let syntheticEvent = new CustomEvent("beforescriptexecute", {
            detail: node,
            cancelable: true,
          });
          if (!document.dispatchEvent(syntheticEvent)) {
            node.remove();
          }
        }
      }
    }
  });
  scriptWatcher.observe(document, {
    childList: true,
    subtree: true,
  });
})();

let inject = `
let xhr = new XMLHttpRequest();
xhr.open("GET", "https://caption.nua07.kro.kr/available_caption?vid="+a.videoId, false)
xhr.send(null)

let res = JSON.parse(xhr.responseText)
if (res) {
    if (!a.playerResponse.captions) {
        a.playerResponse.captions = {
            "playerCaptionsRenderer": {},
            "playerCaptionsTracklistRenderer": {
                "captionTracks": [],
                "audioTracks": [{
                    "captionTrackIndices": []
                }],
                "translationLanguages": [],
                "defaultAudioTrackIndex": 0
            }
        }
    }

    for (let cap of res) {
        a.playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks.push({
            "baseUrl": "https://caption.nua07.kro.kr/caption_data?id="+cap.id,
            "name": {
                "simpleText": cap.lang+" (custom)"
            },
            "vssId": "custom."+cap.lang,
            "languageCode": cap.lang,
            "isTranslatable": true
        })
    }

    a.playerResponse.captions.playerCaptionsTracklistRenderer.audioTracks[0].captionTrackIndices = Object.keys(a.playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks).map(s => Number(s))
    //console.log(a.playerResponse.captions)
};
`;
let enable = true;
function ondata(data) {
  enable = data.enable == undefined ? true : data.enable;
  if (enable)
    window.addEventListener(
      "beforescriptexecute",
      function (e) {
        let src = e.target.src || e.detail.src;
        if (src.indexOf("base.js") != -1) {
          e.preventDefault();
          let xhr = new XMLHttpRequest();
          xhr.open("GET", src, false);
          xhr.send(null);
          console.log("onload");
          try {
            let script_txt = xhr.responseText;
            let script = document.createElement("script");
            script.type = "text/javascript";

            let idx = /var \w+=a\.playerResponse\.captions;/g.exec(script_txt)
              .index;
            script_txt =
              script_txt.slice(0, idx) + inject + script_txt.slice(idx);
            let name = /var (\w+)=\w+\((\w+).baseUrl\)/g.exec(script_txt);
            script_txt = script_txt.replace(
              /var (\w+)=\w+\(\w+.baseUrl\)/g,
              `var ${name[1]}=${name[2]}.baseUrl`
            );

            script.textContent = script_txt;
            var head = document.getElementsByTagName("head")[0];
            head.appendChild(script);
          } catch (e) {
            console.log(e);
          }
        }
      },
      true
    );
}

if ("browser" in window) {
  browser.storage.local.get("enable").then(ondata);
} else {
  chrome.storage.local.get("enable", ondata);
}
