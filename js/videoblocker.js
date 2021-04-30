var containerList = [{
    container: 'ytd-compact-video-renderer',
    channelname: '.ytd-channel-name'
  },
  {
    container: 'ytd-rich-item-renderer',
    channelname: '.ytd-channel-name a.yt-simple-endpoint'
  }
];
document.addEventListener('DOMContentLoaded', function(event) {
  chrome.runtime.sendMessage({ 'name': 'pageActionLoaded' });
  getSettings(function(storage) {
    if (storage.version.updated === true) {
      var container = document.createElement('div');
      container.classList.add('videoblocker-container');
      document.body.appendChild(container);
      var inner = document.createElement('div');
      inner.classList.add('videoblocker-inner');
      container.appendChild(inner);
      var content = document.createElement('div');
      content.classList.add('videoblocker-content');
      content.innerHTML = '' +
        '<h1><img src="' + chrome.extension.getURL("images/icons/icon32.png") + '" alt="__MSG_extName__"> <span>Video Blocker - Extension updated (5.2.2)</span></h1>' +
        '<hr>' +
        '<p>The Video Blocker extension has been successfully updated. Below, I have listed the new and improved features.</p>' +
        '<ul>' +
        '<li><strong>Enable/disable redirect</strong> - Toggle the redirection to the homepage when a blocked video is accessed from a link.</li>' +
        '<li><strong>Various fixes</strong> - Various fixes that should solve some issues and improve stability.</li>' +
        '</ul>' +
        '<p>More information can be found on the settings page under the \'Help\' section.</p>' +
        '<hr>' +
        '<p style="text-align:center; margin-bottom:0; font-weight:500;"><a id="videoblocker-closewindow" href="#">Close this window (until the next update)</a></p>';
      inner.appendChild(content);
      document.getElementById('videoblocker-closewindow').addEventListener('click', function(event) {
        document.querySelector('.videoblocker-container').remove();
        setSetting('version', { number: chrome.runtime.getManifest().version, updated: false, installed: false });
      }, false);
    }
    if (storage.version.installed === true) {
      var container = document.createElement('div');
      container.classList.add('videoblocker-container');
      document.body.appendChild(container);
      var inner = document.createElement('div');
      inner.classList.add('videoblocker-inner');
      container.appendChild(inner);
      var content = document.createElement('div');
      content.classList.add('videoblocker-content');
      content.innerHTML = '' +
        '<h1><img src="' + chrome.extension.getURL("images/icons/icon32.png") + '" alt="__MSG_extName__"> <span>Video Blocker - Extension installed</span></h1>' +
        '<hr>' +
        '<p>The Video Blocker extension has been successfully installed. Below, I have listed the key features.</p>' +
        '<ul>' +
        '<li>Block videos from specific YouTube channels by adding them manually or via right click on a video thumbnail. *</li>' +
        '<li>Block videos on YouTube with specific keywords in the title</li>' +
        '<li>Set a password to prevent e.g. children to remove items from the \'blocked\' list. (The extension can still be removed without entering the password though.)</li>' +
        '<li>Export your blocked items and import them on a different computer.</li>' +
        '</ul>' +
        '<p>More information can be found on the settings page under the \'Help\' section.</p>' +
        '<hr>' +
        '<p>*"via right click on a video thumbnail" other extensions and/or tampermonkey/greasemonkey scripts may or may not break this functionality.</p>' +
        '<hr>' +
        '<p style="text-align:center; margin-bottom:0; font-weight:500;"><a id="videoblocker-closewindow" href="#">Close this window (until the next update)</a></p>';
      inner.appendChild(content);
      document.getElementById('videoblocker-closewindow').addEventListener('click', function(event) {
        document.querySelector('.videoblocker-container').remove();
        setSetting('version', { number: chrome.runtime.getManifest().version, updated: false, installed: false });
      }, false);
    }
  });
  containerList = containerList.map(container => Object.assign({containers: 0}, container))


  window.onload = () => setInterval(hideVideos, 1000)
});

function hideVideos() {
  var pageChannelName = undefined;
  if (document.querySelector('#channel-title') !== null)
    pageChannelName = document.querySelector('#channel-title').textContent.trim();
  else if (document.querySelector('#owner-name a') !== null)
    pageChannelName = document.querySelector('#owner-name a').textContent.trim();
  getItems(function(storage) {
    var items = storage;
    loop1: for (var i = 0; i < containerList.length; i++) {
      var containers = document.body.querySelectorAll(containerList[i].container);
      if (containerList[i].containers === containers.length)
        continue;
      containerList[i].containers = containers.length;
      loop2: for (var j = 0; j < containers.length; j++) {
        if (!containers[j].querySelector(containerList[i].channelname)) { continue; }
        var channelname = containers[j].querySelector(containerList[i].channelname).textContent,
          block = false,
          blockPage = false;
        loop3: for (var k = 0; k < items.length; k++) {
          var key = items[k].key,
            type = items[k].type
          if (pageChannelName && pageChannelName === key) {
            blockPage = true;
          }
          if (channelname === key) {
            block = true;
          }

          if (blockPage === true) {
            if (/.+&list=.+/.test(window.location.href) === true) {
              document.body.querySelector('#player-api .ytp-next-button').click();
              break loop1;
            } else {
              getSettings(function(storage) {
                if (storage.redirect === true) {
                  window.location.replace('/');
                }
              });
            }
          }
          if (block === true) {
            containers[j].remove();
            break;
          }
        }
        if (block === false) {
          containers[j].style.visibility = 'visible';
        }
      }
    }
  });
  fixThumbnails();
}
var contextChannelName, container;
window.addEventListener('contextmenu', function(event) {
  contextChannelName = null;
  container = null;
  for (var i = 0; i < containerList.length; i++) {
    if (event.target.closest(containerList[i].container) && event.target.closest(containerList[i].container).querySelector(containerList[i].channelname) !== null) {
      container = containerList[i]
      contextChannelName = event.target.closest(containerList[i].container).querySelector(containerList[i].channelname).textContent;
    }
    if (contextChannelName !== null)
      break;
  }
});
chrome.runtime.onMessage.addListener(function(message) {
  if (message.name === 'contextMenuClicked' && contextChannelName !== null) {
    container.containers = 0;
    addItem({ key: contextChannelName, type: 'channel' }, hideVideos);
  }
});

function fixThumbnails() {
  var allThumbs = document.body.querySelectorAll(".thumb-link img, .yt-thumb img");
  for (var i = 0; i < allThumbs.length; i++) {
    if (allThumbs[i].hasAttribute('data-thumb') && allThumbs[i].getAttribute('data-thumb') !== allThumbs[i].getAttribute('src'))
      allThumbs[i].setAttribute('src', allThumbs[i].getAttribute('data-thumb'));
  }
}
//# sourceMappingURL=videoblocker.js.map
