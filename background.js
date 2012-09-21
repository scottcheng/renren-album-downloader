var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-31078120-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var deparameterizeURL = function(url) {
  if (url.indexOf('getalbumprofile') >= 0) {
    return url;
  }
  var len = url.length;
  for (var i = len - 1; i >= 0; i--) {
    if (url[i] === '?') {
      return url.substr(0, i);
    }
    if (url[i] === '/') {
      break;
    }
  }
};

var reqListeners = {
  visitAlbum: function(opt, sender) {
    _gaq.push(['_trackEvent', 'Album', 'visit', deparameterizeURL(sender.tab.url)]);
  },

  clickDownload: function(opt, sender) {
    _gaq.push(['_trackEvent', 'Album', 'clickDownload', deparameterizeURL(sender.tab.url)]);
  },

  startDownload: function(opt, sender) {
    _gaq.push(['_trackEvent', 'Album', 'startDownload', deparameterizeURL(sender.tab.url), opt.num]);
  },

  finishDownload: function(opt, sender) {
    _gaq.push(['_trackEvent', 'Album', 'finishDownload', deparameterizeURL(sender.tab.url)]);
  },

  ajaxError: function(opt, sender) {
    _gaq.push(['_trackEvent', 'Error', 'ajaxerror', opt.url]);
  }
};

chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
  if (req.e === 'getOption') {
    ret = {value: localStorage[req.name]};
    ret && sendResponse(ret);
    return;
  }

  var func = reqListeners[req.e];
  var ret;
  func && (ret = func(req.opt, sender));
  ret && sendResponse(ret);
});


if (localStorage['firstRun'] === undefined) {
  window.open('options.html');
  localStorage['firstRun'] = false;
}