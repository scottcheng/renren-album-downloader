想要备份朋友的珍贵照片吗？
想要收集那些脑残或奇葩的相册吗？
想要私藏暗恋的那个人的所有照片吗？

人人相册下载器会把相册里的所有照片打包成zip，然后送到你的硬盘上。


使用说明
====

1. 进入一个人人相册页面。
   * 不是相册分享页面，如果你在一个相册分享页面，请点击相册标题下面的链接进入真正的相册页面。

2. 点击“下载整个相册”。
   * 强烈建议在“缩略图”模式下使用，否则滚动到页面末尾会花很久。

3. 页面会滚动到底，然后开始下载zip。
   * 如果相册很大，插件会生成多个zip下载。因此，如果Chrome提示需要下载多个文件，请点击允许。
   * 在下载未完成之前，你可以随意切换到其他tab，但是请不要关闭相册页面，或是点击相册页面上的链接进入其他页面。

4. 所有zip下载完成之后，进入下载文件夹，将所有zip解压到同一文件夹（比如解压到当前位置）。
   * 请不要解压到不同的位置（如解压到各自的文件夹），不然你会遇到麻烦的。
   * 不用担心把来自不同相册的zip混在一起。把它们一起解压（同样需要解压到同一个文件夹），不同相册的照片就会进入各自的文件夹了。

5. 解压后，你会看到一个名字叫Renren_album_<albumId>的文件夹，里面有：
   * 相册里所有的照片，按照原相册中的顺序命名；
   * info.txt，里面有相册名、相册描述，以及所有照片的描述。


已知的问题
====

* 用data URI下载大文件（> 1.3 MB）会导致Chrome崩溃。因此，大的相册被分成了多个zip。由于同样的原因，过于大的照片会被显示在新tab里（而不是塞到zip里）。

* 用中文命名文件或文件夹会导致zip出错。因此，目前把所有可能出现中文的内容（相册标题、相册描述、照片描述）全部塞到了info.txt中，而不是直接作为文件名。

* 在Ubuntu系统下，从zip中解压出的同名文件夹不会合并，而会成为不同的文件夹。


- - - - -


Renren album downloader will pack up all the photos in an arbitrary Renren album in zips, and send to your disk. 

How to use
====

1. Go to a Renren album that you want. 
   * Not a album share page (yet). If you happen to be in a album share page, please click on the link below the album name to the real album page. 

2. Click "Download album". 
   * Using in thumb view is strongly recommended. Scrolling down to the bottom will take eternity otherwise. 

3. Wait for the page to automatically scroll to the bottom, and the zips to download. 
   * The downloader will generate multiple zips for large albums. So if Chrome prompts about downloading multiple files, please click "Allow". 
   * Do *NOT* leave the album page (e.g. click a link on the page) or close the tab until all downloads finish. Feel free to switch to other tabs, though. 

4. After all zips are on your disk, go to your default download folder, and extract all the zips to *one* folder (e.g. click "extract here"). 
   * Do *not* extract to separate folders, that would make your life much harder. 
   * Do not worry about mixing up zips from different albums. Just extract all of them (again, to the same folder), and do not overwrite any existing files. Different albums will go to their respective folders. 

5. After extraction, you will find a folder named Renren_album_<albumId>, inside of which all the photos are named with its index in the album. Also there is an info.txt, where you can find the real album name as well as titles for all the photos (if appropriate). You may rename the folder to the album name if you want to. 


Known Issues
====

* Downloading large files (> 1.3 MB) with data URI will cause Chrome to crash. This is why large albums are divided into several zips. For the same reason, extra-large photos will be opened in new tabs (rather than zipped), and you are welcomed to download them yourself. This should rarely happen, though. :)

* Naming folders / files with Chinese characters sometimes make zips to corrupt. Therefore, all the Chinese stuff (album name, album description, and photo descriptions) are put into info.txt, rather than used in folder / file names. 

* When extracting zips in Ubuntu, folders with the same name will not merge, but will become different folders with unique names. 