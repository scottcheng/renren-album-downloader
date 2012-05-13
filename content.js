// Renren Album Downloader by Scott Cheng
// Content script

var conf = {
  // Size threshold in byte
  THRESHOLD: 1.3 * 1024 * 1024,
  
  // Download trigger interval
  DLD_ITV: 3500,

  // Scroll screen interval
  SCR_ITV: 750,

  // Open new window for huge photo timeout
  OPEN_TO: 3000,

  // Reposition download button interval
  REPOSITION_ITV: 250,

  // Hide download button after finish timeout
  HIDE_TO: 2500,

  // Get photo data interval
  GET_PHOTO_ITV: 100
};

var util = (function() {
  var obj = {};

  obj.processName = function(name) {
    return name.replace(/[\/\\:\*\?<>|"]/g, '');
  };

  return obj;
})();

var view = (function() {
  var obj = {};

  var
    $body,
    $textWrapper,
    $icon,
    $hint,
    $info,
    $btn,
    $progressBar,
    $progressBarText,
    $progressBarWrapper;

  var state = '';

  var disabled = false;

  obj.init = function() {
    state = 'init';
    $body = $('body');

    $('<link />')
      .attr({
        rel: 'stylesheet',
        type: 'text/css',
        href: chrome.extension.getURL('style.css')
      })
      .appendTo('head');

    $btn = $('<div />')
      .attr('id', 'renren_album_downloader_btn');
    $info = $('<div />')
      .attr('id', 'renren_album_downloader_btn_info')
      .appendTo($btn);
    $hint = $('<div />')
      .attr('id', 'renren_album_downloader_btn_hint')
      .addClass('clearFloat')
      .appendTo($btn);
    $icon = $('<div />')
      .attr('id', 'renren_album_downloader_btn_icon')
      .addClass('default')
      .appendTo($hint);
    $textWrapper = $('<div />')
      .attr('id', 'renren_album_downloader_btn_text')
      .html(chrome.i18n.getMessage('hint'))
      .appendTo($hint);
    $btn.appendTo($body);

    $btn.ajaxError(function(e, jqXHR, ajaxSettings) {
      chrome.extension.sendRequest({
        e: 'ajaxError',
        opt: {
          url: ajaxSettings.url
        }
      });
      downloader.onError(ajaxSettings.url);
    });
    
    $btn.click(function() {
      if (disabled) {
        return;
      }
      disabled = true;
      $btn.addClass('disabled');

      chrome.extension.sendRequest({
        e: 'clickDownload'
      });

      view.start();

      view.scrollToBottom(function() {
        // Start getting photos
        album.start();
      });
    });

    (function() {
      var oriRight = 24;  // window.parseInt($btn.css('right'));
      var repositionBtn = function() {
        var $friendsPanel = $('#friends-panel');
        var $sidebar = $friendsPanel.children('div');
        if ($friendsPanel.hasClass('side-panel') && $sidebar.hasClass('actived')) {
          // Sidebar is here, watch out
          var newRight = $sidebar.width() + oriRight;
          $btn.css('right', newRight);
        } else {
          $btn.css('right', oriRight);
        }
        window.setTimeout(repositionBtn, conf.REPOSITION_ITV);
      };
      repositionBtn();
    })();
  };

  obj.getBody = function() {
    return $body;
  };

  obj.scrollToBottom = function(callback) {
    state = 'downloading';

    // Scroll to bottom to load all the photo links
    var $window = $(window);
    var
      oriScrollTop = $window.scrollTop(),
      curScrollTop = 0;
    var scrollDown = function() {
      curScrollTop += $window.height();
      if (curScrollTop < $(document).height()) {
        $window.scrollTop(curScrollTop);
        // Continue loop
        window.setTimeout(scrollDown, conf.SCR_ITV);
        return;
      }
      // Loop finished
      // Restore original scroll position
      $window.scrollTop(oriScrollTop);
      callback && callback();
    };
    scrollDown();
  };

  obj.start = function() {
    state = 'analyzing';
    $btn.addClass('expanded');
    $info.html(chrome.i18n.getMessage('msgAnalyzing'));
    for (var i = 0; i < 8; i++) {
      $('<div />').appendTo($icon);
    }
    $icon
      .removeClass('default')
      .removeClass('finished')
      .addClass('spinning');
  };

  var createProgressBar = function() {
    $progressBarWrapper = $('<div />')
      .attr('id', 'renren_album_downloader_progress_bar_wrapper');
    $progressBar = $('<div />')
      .attr('id', 'renren_album_downloader_progress_bar')
      .appendTo($progressBarWrapper);
    $progressBarText = $('<div />')
      .attr('id', 'renren_album_downloader_progress_bar_text')
      .appendTo($progressBarWrapper);
    $progressBarWrapper
      .prependTo($btn)
      .slideDown();
  };

  obj.startDownload = function() {
    state = 'downloading';
    createProgressBar();
    $info.html(chrome.i18n.getMessage('msgDownloading'));
  };

  obj.updateDownloadProgress = function(cur, ttl) {
    $progressBarText.html(chrome.i18n.getMessage('dldProgress', [cur.toString(), ttl.toString()]));
    $progressBar.width((cur / ttl * 100) + '%');
  };

  obj.startZipping = function() {
    state = 'zipping';
    $progressBarWrapper.slideUp(function() {
      $progressBarWrapper.remove();
    });
    $info.html(chrome.i18n.getMessage('msgZipping'));
  };

  obj.finish = function() {
    state = 'finished';
    $info.html(chrome.i18n.getMessage('msgFinished'));
    disabled = false;
    $btn.removeClass('disabled');
    $icon
      .removeClass('spinning')
      .addClass('finished')
      .empty();
    window.setTimeout(function() {
      $btn.removeClass('expanded');
    }, conf.HIDE_TO);
  };

  return obj;
})();

var downloader = (function() {
  var obj = {};

  var
    queue = [],  // Download queue
    isStarted = false,  // Marks if all download has been added to queue
    zip = null,
    folder = null,
    curSize = 0,
    folderName = '',
    cnt = 0,
    len = 0,
    errList = [];  // Size of current zip

  var triggerDownload = function(url) {
    var $ifrm = $('<iframe />')
      .css('display', 'none')
      .attr('src', url)
      .height(0)
      .width(0)
      .appendTo(view.getBody());
  };

  var checkQueue = function() {
    if (isStarted) {
      var zip2Dld = queue.splice(0, 1)[0];  // Get the first element
      if (zip2Dld) {
        var url = 'data:application/zip;base64,' + zip2Dld.generate();
        triggerDownload(url);
      }
    }
    if (!isStarted || queue.length > 0) {
      window.setTimeout(checkQueue, conf.DLD_ITV);
    } else {
      chrome.extension.sendRequest({
        e: 'finishDownload'
      });
      view.finish();
    }
  };

  var createZip = function(info) {
    zip = new JSZip;
    // Create folder to put picture into
    folder = zip.folder(folderName);
    if (info) {
      folder.file('info.txt', info);
    }
    curSize = 0;
  };

  var start = function() {
    var errLen = errList.length;
    if (errLen > 0) {
      var errorsTxt = '';
      errorsTxt += chrome.i18n.getMessage('errorTxtDesc');
      errorsTxt += '\r\n\r\n';
      for (var i in errList) {
        errorsTxt += errList[i] + '\r\n';
      }
      folder.file('errors.txt', errorsTxt);
    }
    queue.push(zip);
    view.startZipping();
    isStarted = true;
  };

  obj.onError = function(url) {
    len--;
    errList.push(url);
    view.updateDownloadProgress(cnt, len);
    if (len === cnt) {
      start();
    }
  };
  
  obj.add = function(data, photo) {
    cnt++;

    if (data.byteLength >= conf.THRESHOLD) {
      // Man this is big! 
      window.setTimeout(function() {
        window.open(photo.src);
      }, conf.OPEN_TO);
      return;
    }
    
    if (curSize + data.byteLength > conf.THRESHOLD) {
      // Current zip is getting too large, push it to queue
      queue.push(zip);

      // Create new zip
      createZip();
    }

    curSize += data.byteLength;
    data = base64ArrayBuffer(data);
    folder.file(photo.filename, data, {base64: true});

    view.updateDownloadProgress(cnt, len);
    if (cnt === len) {
      start();
    }
  };

  obj.init = function(info, folderName_, len_) {
    folderName = folderName_;
    len = len_;
    cnt = 0;
    zip = null,
    folder = null,
    curSize = 0,
    isStarted = false;
    queue = [];
    errList = [];

    // Create zip and folder
    createZip(info);
    checkQueue();
  };

  return obj;
})();

var album = (function() {
  var obj = {};

  // Array of photo sources
  var
    albumName = '',
    albumDesc = '',  // Album description
    folderName = '',
    photos = [];

  var createInfo = function () {
    var ret = '';
    ret += albumName + '\r\n\r\n';
    albumDesc = $.trim($('#describeAlbum').html());
    if (albumDesc.length > 0) {
      ret += albumDesc + '\r\n\r\n';
    }
    var len = photos.length;
    for (var idx = 1; idx <= len; idx++) {
      for (var i = 0; i < len; i++) {
        if (photos[i].idx === idx) {
          if (photos[i].title.length > 0) {
            ret += idx + '. ' + photos[i].title + '\r\n';
          }
          break;
        }
      }
    }
    return ret;
  };

  var downloadPhotos = function() {
    var len = photos.length;  // Number of photos
    view.startDownload(len);

    chrome.extension.sendRequest({
      e: 'startDownload', 
      opt: {
        num: len
      }
    });

    downloader.init(createInfo(), folderName, len);

    // Get the image data of each photo and send to downloader
    var cnt = 0;  // Counts downloaded photos
    var addToQueue = function(idx) {
      if (idx >= len) {
        return;
      }
      (function() {
        var photo = photos[idx];
        $.get(photo.src, function(data) {
          cnt++;
          downloader.add(data, photo);
        },
        'binary');
      })();
      window.setTimeout(function() {
        addToQueue(idx + 1);
      }, conf.GET_PHOTO_ITV);
    };
    addToQueue(0);
  };

  obj.start = function() {
    // Get all the sources and put in photos array
    photos = [];
    var cnt = 0;
    $('div.photo-list li > a.picture').each(function(idx, ele) {
      cnt++;
      var picPageHref = $(ele).attr('href');  // URL of the photo page
      (function() {
        var curIdx = idx;
        // Go to the photo page and get photo URL
        $.get(picPageHref, function(data) {
          var photoStrMat = data.match(/photosJson.+{.+}.*;/);
          if (!photoStrMat) {
            return;
          }
          var photoStr = photoStrMat[0].match(/{.+}/)[0];
          var photoObj = $.parseJSON(photoStr);
          folderName = 'Renren_album_' + photoObj.currentPhoto.albumId;
          albumName = photoObj.currentPhoto.albumName;
          var src = photoObj.currentPhoto.large;
          var ext = src.match(/.\w{3,4}$/)[0];
          var photo = {
            src: src,
            title: photoObj.currentPhoto.title,
            filename: (curIdx + 1) + ext,
            idx: curIdx + 1
          };
          photos.push(photo);
          cnt--;
          if (cnt === 0) {
            downloadPhotos();
          }
        });
      })();
    });
  };

  return obj;
})();


chrome.extension.sendRequest({
  e: 'visitAlbum'
});

view.init();