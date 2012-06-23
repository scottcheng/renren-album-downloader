Renren Album Downloader
====

A Chrome extension which enables you to download a Renren album with one click

See in [Chrome Web Store](https://chrome.google.com/webstore/detail/enmkdplopmpkfnlefdldpkbcmihgcdec)


- - - - -


Renren album downloader packs up all the photos in an arbitrary Renren album in a zip, and sends it to your disk.


How to use
====

1. Go to a Renren album that you want.
   * Not a album share page (yet). If you happen to be in a album share page, please click on the link below the album name to the real album page.

2. Click "Download album".

3. Wait for the page to automatically scroll to the bottom, and the zip to download.
   * Do *NOT* leave the album page (e.g. click a link on the page) or close the tab until the download finish. Feel free to switch to other tabs, though.

4. Inside of the zip, you will find a folder named renren-album-${albumId}, inside of which all the photos are named with its index in the album. Also there is an info.html, where you can view the album in a new way, with the album name, description, and photo titles.


Known Issues
====

* Could crash Chrome when downloading *huge* albums, say 2 MB gifs * 120.

* Naming folders / files with Chinese characters sometimes leads to corrupted zips. Therefore, all the Chinese stuff (album name, album description, and photo descriptions) are put into info.html, rather than used in folder / file names.


- - - - -


想要备份朋友的珍贵照片吗？
想要收集那些脑残或奇葩的相册吗？
想要私藏暗恋的那个人的所有照片吗？

人人相册下载器会把相册里的所有照片打包成zip，然后送到你的硬盘上。


使用说明
====

1. 进入一个人人相册页面。
   * 不是相册分享页面。如果你刚好在一个相册分享页面，请点击相册标题下面的链接进入真正的相册页面，再使用插件。

2. 点击“下载整个相册”。

3. 页面会滚动到底，然后开始下载zip。
   * 在下载未完成之前，你可以随意切换到其他tab，但是请不要关闭相册页面，或是点击相册页面上的链接进入其他页面。

4. 在zip文件中，你会看到一个名字叫renren-album-${albumId}的文件夹，里面有：
   * 相册里所有的照片，按照原相册中的顺序命名；
   * info.html，里面有相册名、相册描述和所有照片。


已知的问题
====

* 下载巨大相册的时候可能导致Chrome crash，比如120张2MB的gif。

* 用中文命名文件或文件夹有可能会导致zip出错。因此，目前把所有可能出现中文的内容（相册标题、相册描述、照片描述）全部塞到了info.html中，而不是直接作为文件名。