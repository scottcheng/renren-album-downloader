// Renren Album Downloader by Scott Cheng

$(function() {
  // Size threshold in byte
  var THRESHOLD = 1.3 * 1024 * 1024;

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-31078120-1']);
  _gaq.push(['_trackEvent', 'Album', 'visit', window.location.href]);

  var $body = $('body');
  var $dlBtn = $('<div />')
    .attr('id', 'renren_album_downloader_btn')
    .appendTo($body);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();


  $dlBtn.ajaxError(function(e, jqXHR, ajaxSettings) {
    alert('ajax error when trying to reach ' + ajaxSettings.url + '\nwill soon fix.');  // TODO
    // GA url
    _gaq.push(['_trackEvent', 'Error', 'ajaxerror', ajaxSettings.url]);
  });

  var processName = function(name) {
    return name.replace(/[\/\\:\*\?<>|"]/g, '');
  };
  
  $dlBtn.click(function() {

    // GA album url
    _gaq.push(['_trackEvent', 'Album', 'download', window.location.href]);

    // Array of photo sources
    var
      albumName = '',
      albumDesc = $.trim($('#describeAlbum').html()),  // Album description
      folderName = '',
      photos = [];

    var createInfo = function () {
      var ret = '';
      ret += 'Name: ' + albumName + '\n';
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
      // Zip and folder object
      var zip, folder;
      
      var createZip = function(firstTime) {
        zip = new JSZip();
        // Create folder to put picture into
        folder = zip.folder(folderName);
        if (firstTime) {
          folder.file('info.txt', createInfo());
        }
      };

      var downloadZip = function() {
        var url = "data:application/zip;base64," + zip.generate();
        var $ifrm = $('<iframe />')
          .css('display', 'none')
          .attr('src', url)
          .height(0)
          .width(0)
          .appendTo($body);
      };
      
      // Create zip and folder
      createZip(true);
      
      // Get the image data of each picture and put in the zip
      var
        len = photos.length,  // Number of photos
        size = 0,  // Size of current zip
        cnt = 0;  // Counts downloaded photos
      for (var i = 0; i < len; i++) {
        (function() {
          var photo = photos[i];
          $.get(photo.src, function(data) {
            cnt++;
            
            if (data.byteLength >= THRESHOLD) {
              // Man this is big! 
              window.setTimeout(function() {
                window.open(photo.src);
              }, 1500);
              return;
            }
            
            if (size + data.byteLength > THRESHOLD) {
              // Current zip is getting too large, download it
              downloadZip();

              // Create new zip
              createZip();
              size = 0;
            }

            size += data.byteLength;
            data = base64ArrayBuffer(data);
            folder.file(photo.filename, data, {base64: true});
            
            if (cnt === len) {
              downloadZip();
            }
          },
          'binary');
        })();
      }
    };

    var getSrcs = function() {
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
              console.log(photos.length);
              // GA photos length
              downloadPhotos();
            }
          });
        })();
      });
    };

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
        window.setTimeout(scrollDown, 750);
        return;
      }
      // Loop finished
      // Restore original scroll position
      $window.scrollTop(oriScrollTop);
      getSrcs();
    };
    scrollDown();
  });
});