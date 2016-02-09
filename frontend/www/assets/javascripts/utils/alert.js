var Alert = {
  show: function(msg, title, btnName) {
    if(navigator.notification) {
      navigator.notification.alert(
          msg,  // message
          Alert.dismissed,  // callback
          title,   // title
          btnName  // buttonName
      );
    }
    else {  
      alert(msg);
    }
  },
  dismissed: function() {}
}