// Renren Album Downloader by Scott Cheng
// Content script

var conf = {
  // Scroll screen interval
  SCR_ITV: 750,

  // Reposition download button interval
  REPOSITION_ITV: 250,

  // Hide download button after finish timeout
  HIDE_TO: 2500,

  // Get photo data interval
  GET_PHOTO_ITV_H: 1500,
  GET_PHOTO_ITV_L: 150,
  GET_PHOTO_ITV: 150
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

  obj.startDownload = function(ttl) {
    state = 'downloading';
    $info.html(chrome.i18n.getMessage('msgDownloading'));
    createProgressBar();
    this.updateDownloadProgress(0, ttl);
  };

  obj.updateDownloadProgress = function(cur, ttl) {
    $progressBarText.html(chrome.i18n.getMessage('dldProgress', [cur.toString(), ttl.toString()]));
    $progressBar.width((cur / ttl * 100) + '%');
  };

  obj.startZipping = function(callback) {
    state = 'zipping';
    $info.html(chrome.i18n.getMessage('msgZipping'));
    $progressBarWrapper.slideUp(function() {
      $progressBarWrapper.remove();
      callback && callback();
    });
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
    zip = null,
    folder = null,
    zipName = '',
    folderName = '',
    cnt = 0,
    len = 0,
    errList = [];

  var dataURI2Blob = function(dataURI) {
    // by @Stoive from StackOverflow

    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var bb = new (window.BlobBuilder || window.WebKitBlobBuilder);
    bb.append(ab);
    return bb.getBlob(mimeString);
  };

  var triggerDownload = function(uri, filename) {
    saveAs(dataURI2Blob(uri), filename);
  };

  var createZip = function(info) {
    zip = new JSZip;
    // Create folder to put picture into
    folder = zip.folder(folderName);
    if (info) {
      folder.file('info.txt', info);
    }
  };

  var startZipping = function() {
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
    view.startZipping(function() {
      var uri = 'data:application/zip;base64,' + zip.generate();
      triggerDownload(uri, zipName);
      chrome.extension.sendRequest({
        e: 'finishDownload'
      });
      view.finish();
    });
  };

  obj.onError = function(url) {
    len--;
    errList.push(url);
    view.updateDownloadProgress(cnt, len);
    if (len === cnt) {
      startZipping();
    }
  };
  
  obj.add = function(data, photo) {
    cnt++;

    var base64Data = base64ArrayBuffer(data);
    folder.file(photo.filename, base64Data, {base64: true});

    view.updateDownloadProgress(cnt, len);
    if (cnt === len) {
      startZipping();
    }
  };

  obj.init = function(info, folderName_, len_, zipName_) {
    folderName = folderName_;
    len = len_;
    zipName = zipName_;
    cnt = 0;
    zip = null,
    folder = null,
    errList = [];

    // Create zip and folder
    createZip(info);
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
    var br = '\r\n';
    var dbbr = br + br;
    ret += albumName + dbbr;
    albumDesc = $.trim($('#describeAlbum').html());
    if (albumDesc.length > 0) {
      ret += albumDesc + dbbr;
    }
    ret += window.location.origin + window.location.pathname;
    if (window.location.pathname === '/getalbumprofile.do') {
      ret += window.location.search;
    }
    ret += dbbr;
    var len = photos.length;
    for (var idx = 1; idx <= len; idx++) {
      for (var i = 0; i < len; i++) {
        if (photos[i].idx === idx) {
          if (photos[i].title.length > 0) {
            ret += idx + '. ' + photos[i].title + br;
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

    downloader.init(createInfo(), folderName, len, albumName + '.zip');

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

          // Adjust GET_PHOTO_ITV
          conf.GET_PHOTO_ITV = data.byteLength > 1048576 ? conf.GET_PHOTO_ITV_H : conf.GET_PHOTO_ITV_L;
          data = null;
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
          folderName = 'renren-album-' + photoObj.currentPhoto.albumId;
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