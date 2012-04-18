$(function() {
  var $body = $('body');
  var $dlBtn = $('<div />')
    .attr('id', 'renren_album_downloader_btn')
    .appendTo($body);
  
  $dlBtn.click(function() {
    // Array of photo sources
    var albumName = '';
    var photos = [];

    var downloadPhotos = function() {
      // Create zip object
      var zip = new JSZip();
      // Create folder to put picture into
      var folder = zip.folder(albumName);
      
      // Get the image data of each picture and put in the zip
      var len = photos.length;
      var cnt = 0;  // Counts downloaded images
      for (var i = 0; i < len; i++) {
        (function() {
          var photo = photos[i];
          if (photo.title.length === 0) {
            photo.title = albumName + '_' + i;
          }
          $.get(photo.src, function(data) {
            data = base64ArrayBuffer(data);
            folder.file(photo.title + '.jpg', data, {base64: true});
            cnt++;
            if (cnt === len) {
              // Fetched all the pictures, trigger zip download
              location.href = "data:application/zip;base64," + zip.generate();
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
          albumName = photoObj.currentPhoto.albumName;
          var photo = {
            src: photoObj.currentPhoto.large,
            title: photoObj.currentPhoto.title
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


