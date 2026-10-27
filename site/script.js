(function () {
  var FEED =
    'https://raw.githubusercontent.com/OPBSUTHAR/omnia/main/public/updates/latest.json';

  function compare(a, b) {
    var left = String(a || '')
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map(function (part) {
        return parseInt(part, 10) || 0;
      });
    var right = String(b || '')
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map(function (part) {
        return parseInt(part, 10) || 0;
      });
    for (var i = 0; i < 3; i += 1) {
      if ((left[i] || 0) > (right[i] || 0)) return 1;
      if ((left[i] || 0) < (right[i] || 0)) return -1;
    }
    return 0;
  }

  function text(id, value) {
    var node = document.getElementById(id);
    if (node && value) node.textContent = value;
  }

  function disableDesktop(id, noteId) {
    var link = document.getElementById(id);
    if (link) {
      link.classList.add('disabled');
      link.setAttribute('aria-disabled', 'true');
      link.href = 'https://github.com/OPBSUTHAR/orbisnova/releases';
      link.textContent = 'Shipping in v1.1.0';
    }
    var note = document.getElementById(noteId);
    if (note) note.textContent = 'The first desktop installer ships with v1.1.0';
  }

  fetch(FEED + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function (feed) {
      var version = String(feed.version || '').replace(/^v/i, '');
      text('version-pill', 'v' + version + ' available');
      text('feed-version', 'v' + version);
      text(
        'feed-status',
        'Latest published build. Installed copies check this feed automatically.'
      );

      if (feed.windowsUrl) {
        var windows = document.getElementById('windows-link');
        if (windows) windows.href = feed.windowsUrl;
      }
      if (feed.linuxUrl) {
        var linux = document.getElementById('linux-link');
        if (linux) linux.href = feed.linuxUrl;
      }

      if (compare(version, '1.1.0') < 0) {
        disableDesktop('windows-link', 'windows-note');
        disableDesktop('linux-link', 'linux-note');
      }

      var notes = document.getElementById('release-notes');
      if (notes && Array.isArray(feed.notes) && feed.notes.length) {
        notes.innerHTML = '';
        feed.notes.slice(0, 6).forEach(function (note) {
          var item = document.createElement('li');
          item.textContent = note;
          notes.appendChild(item);
        });
      }
    })
    .catch(function () {
      text('feed-status', 'Could not reach the release feed. Downloads still work below.');
    });
})();
