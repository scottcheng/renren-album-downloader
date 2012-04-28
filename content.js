// Renren Album Downloader by Scott Cheng
// Content script

var conf = {
  // Size threshold in byte
  THRESHOLD: 1.3 * 1024 * 1024,
  
  // Download trigger interval
  DLD_ITV: 1500,

  // Scroll screen interval
  SCR_ITV: 750,

  // Open new window for huge photo timeout
  OPEN_TO: 3000
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
    $dldBtn;

  var state = '';

  obj.init = function() {
    state = 'init';
    $body = $('body');
    $dldBtn = $('<div />')
      .attr('id', 'renren_album_downloader_btn')
      .appendTo($body);
  };

  obj.getBody = function() {
    return $body;
  };

  obj.getDldBtn = function() {
    return $dldBtn;
  };

  obj.scrollToBottom = function(callback) {
    state = 'downloading';

    // TODO add a spinner, use CSS to make it spin

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

  obj.finish = function() {
    state = 'finished';
    $dldBtn.addClass('finished');
  };

  return obj;
})();

var Downloader = (function() {
  var
    queue = [],  // Download queue
    isFinished = false,  // Marks if all download has been added to queue
    zip = null,
    folder = null,
    curSize = 0,
    folderName = '';  // Size of current zip

  var triggerDownload = function(url) {
    var $ifrm = $('<iframe />')
      .css('display', 'none')
      .attr('src', url)
      .height(0)
      .width(0)
      .appendTo(view.getBody());
  };

  var checkQueue = function() {
    var zip2Dld = queue.splice(0, 1)[0];  // Get the first element
    if (zip2Dld) {
      var url = "data:application/zip;base64," + zip2Dld.generate();
      triggerDownload(url);
    }
    if (!isFinished || queue.length > 0) {
      window.setTimeout(checkQueue, conf.DLD_ITV);
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
  
  var add = function(data, photo) {
    if (data.byteLength >= conf.THRESHOLD) {
      // Man this is big! 
      window.setTimeout(function() {
        window.open(photo.src);
      }, conf.OPEN_TO);
      return;
    }
    
    if (curSize + data.byteLength > conf.THRESHOLD) {
      // Current zip is getting too large, download it
      queue.push(zip);

      // Create new zip
      createZip();
    }

    curSize += data.byteLength;
    data = base64ArrayBuffer(data);
    folder.file(photo.filename, data, {base64: true});
  };

  var finish = function() {
    queue.push(zip);
    isFinished = true;
  };

  return function(info, _folderName) {
    folderName = _folderName;
    this.add = add;
    this.finish = finish;

    // Create zip and folder
    createZip(info);
    checkQueue();
  }
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
    ret += 'Name: ' + albumName + '\n';
    albumDesc = $.trim($('#describeAlbum').html());
    if (albumDesc.length > 0) {
      ret += 'Description: ' + albumDesc + '\n';
    }
    ret += '\n';
    var len = photos.length;
    for (var idx = 1; idx <= len; idx++) {
      for (var i = 0; i < len; i++) {
        if (photos[i].idx === idx) {
          if (photos[i].title.length > 0) {
            ret += idx + '. ' + photos[i].title + '\n';
          }
          break;
        }
      }
    }
    return ret;
  };

  var downloadPhotos = function() {
    var len = photos.length;  // Number of photos

    chrome.extension.sendRequest({
      e: 'startDownload', 
      opt: {
        num: len
      }
    });

    var downloader = new Downloader(createInfo(), folderName);

    // Get the image data of each photo and send to downloader
    var cnt = 0;  // Counts downloaded photos
    for (var i = 0; i < len; i++) {
      (function() {
        var photo = photos[i];
        $.get(photo.src, function(data) {
          cnt++;
          downloader.add(data, photo);
          if (cnt === len) {
            downloader.finish();
          }
        },
        'binary');
      })();
    }
  };

  obj.start = function() {
    // Get all the sources and put in photos array
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
          // limit length of album name (i.e. folder name) to 20
          folderName = 'album' + photoObj.currentPhoto.albumId;
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

$(function() {

  chrome.extension.sendRequest({
    e: 'visitAlbum'
  });

  view.init();

  view.getDldBtn().ajaxError(function(e, jqXHR, ajaxSettings) {
    alert('ajax error when trying to reach ' + ajaxSettings.url + '\nwill soon fix.');  // TODO
    chrome.extension.sendRequest({
      e: 'ajaxError',
      opt: {
        url: ajaxSettings.url
      }
    });
  });
  
  view.getDldBtn().click(function() {

    chrome.extension.sendRequest({
      e: 'clickDownload'
    });

    view.scrollToBottom(function() {
      // Start getting photos
      album.start();
    });
  });
});