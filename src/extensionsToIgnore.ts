/**
 * List of extensions to ignore. These extensions won't be served by prerender.
 * If you want to serve this type of files, please consider to use a CDN.
 *
 * TODO: Add more exact description
 */
export const extensionsToIgnore = [
  '.js',
  '.css',
  '.xml',
  '.less',
  '.pdf',
  '.txt',
  '.rss',
  '.zip',
  '.rar',
  '.exe',
  '.wmv',
  '.mov',
  '.psd',
  '.ai',
  '.xls',
  '.swf',
  '.dat',
  '.dmg',
  '.iso',
  '.flv',
  '.torrent',
  '.webmanifest',

  /**
   * Office documents
   */
  '.doc',
  '.docx',
  '.docm',
  '.dot',
  '.dotx',
  '.dotm',
  '.xls',
  '.xlsx',
  '.xlsm',
  '.xls',
  '.xltx',
  '.xltm',
  '.xlsb',
  '.xlam',
  '.ppt',
  '.pptx',
  '.pptm',
  '.pps',
  '.ppsx',
  '.ppsm',
  '.pot',
  '.potx',
  '.potm',
  '.ppam',
  '.sld',
  '.sldx',
  '.sldm',
  '.onetoc',
  '.onetoc2',
  '.onetmp',
  '.onepkg',
  '.thmx',

  /**
   * Fonts
   */
  '.eot',
  '.otf',
  '.ttc',
  '.ttf',
  '.woff2',
  '.woff',

  /**
   * Browser compatible media types
   * @see https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers
   */
  '.3gp',
  '.3g2',
  '.3gpp',
  '.3gpp2',
  '.aac',
  '.adts',
  '.amr',
  '.avi',
  '.awb',
  '.drc',
  '.flac',
  '.m4a',
  '.m4b',
  '.m4p',
  '.m4v',
  '.mogg',
  '.mp3',
  '.mp4',
  '.mp4a',
  '.mp4b',
  '.mpc',
  '.mpg',
  '.mpeg',
  '.ogg',
  '.oga',
  '.opus',
  '.wav',
  '.webm',

  /**
   * Browser compatible image types
   * @see https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
   *
   */
  '.apng',
  '.avif',
  '.gif',
  '.jpg',
  '.jpeg',
  '.jfif',
  '.pjpeg',
  '.pjp',
  '.png',
  '.svg',
  '.webp',
  '.bmp',
  '.ico',
  '.cur',
  '.tif',
  '.tiff',
];
