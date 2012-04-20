$(function() {
  // Size threshold in byte
  var THRESHOLD = 1.5 * 1024 * 1024;

  var $body = $('body');
  var $dlBtn = $('<div />')
    .attr('id', 'renren_album_downloader_btn')
    .appendTo($body);
  
  $dlBtn.click(function() {
    // Array of photo sources
    var albumName = '';
    var photos = [];

    var downloadPhotos = function() {
      // Zip and folder object
      var zip, folder;
      
      var createZip = function() {
        zip = new JSZip();
        // Create folder to put picture into
        folder = zip.folder(albumName);
      };
      
      var triggerDownload = function() {
        var url = "data:application/zip;base64," + zip.generate();
        var $ifrm = $('<iframe />')
          .css('display', 'none')
          .attr('src', url)
          .height(0)
          .width(0)
          .appendTo('body');
        setTimeout(function() {
          $ifrm.remove();
        }, 200);
      };
      
      // Create zip and folder
      createZip();
      
      // Get the image data of each picture and put in the zip
      var len = photos.length;  // Number of photos
      var size = 0;  // Size of current zip
      var cnt = 0;  // Counts downloaded photos
      for (var i = 0; i < len; i++) {
        (function() {
          var photo = photos[i];
          photo.title = (i + 1) + '.' + photo.title + '.jpg';
          $.get(photo.src, function(data) {
            if (size + data.byteLength > THRESHOLD) {
              // Current zip is getting too large, download it
              triggerDownload();

              // Create new zip
              createZip();
              size = 0;
            }
            size += data.byteLength;
            data = base64ArrayBuffer(data);
            folder.file(photo.title, data, {base64: true});
            cnt++;
            if (cnt === len) {
              triggerDownload();
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
        
        // Go to the photo page and get photo URL
        $.get(picPageHref, function(data) {
          var photoStrMat = data.match(/photosJson.+{.+}.*;/);
          if (!photoStrMat) {
            return;
          }
          var photoStr = photoStrMat[0].match(/{.+}/)[0];
          var photoObj = $.parseJSON(photoStr);
          albumName = photoObj.currentPhoto.albumName.replace(/\//g, ' ');
          var photo = {
            src: photoObj.currentPhoto.large,
            title: photoObj.currentPhoto.title.replace(/\//g, ' ')
          }
          photos.push(photo);
          cnt--;
          if (cnt === 0) {
            console.log(photos.length);
            downloadPhotos();
          }
        });
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
        setTimeout(scrollDown, 500);
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


