var flurryid = "";

function setFlurryId() {
  if (window.device && window.device.platform) {
    if (window.device.platform == "Android") {
      flurryid = '';
    }
    if (window.device.platform == "iOS") {
      flurryid = '';
    }
  }  
}
