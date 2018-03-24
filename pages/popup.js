/*
    This file is part of Kitsu Web Scrobbler.

    Kitsu Web Scrobbler is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Kitsu Web Scrobbler is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Kitsu Web Scrobbler.  If not, see <http://www.gnu.org/licenses/>.
*/
//Localize by replacing __MSG_***__ meta tags
var objects = document.getElementsByTagName('html');
for (var j = 0; j < objects.length; j++) {
    var obj = objects[j];

    var valStrH = obj.innerHTML.toString();
    var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
        return v1 ? chrome.i18n.getMessage(v1) : '';
    });

    if (valNewH != valStrH) {
        obj.innerHTML = valNewH;
    }
}

chrome.runtime.sendMessage({action: 'getScrobbling'}, function (scrobbling) {
    if (scrobbling.error == 'none') {
        $('#animecover').attr('src', scrobbling.animeData.attributes.coverImage.tiny);
        $('#title').text(scrobbling.animeData.attributes.canonicalTitle);
        $('#synopsis').text(scrobbling.animeData.attributes.synopsis);
        $('#notice').text(scrobbling.notice);
        $('.progress').progress({
            total: scrobbling.animeData.attributes.episodeCount
        });
        $('.progress').progress('set progress', scrobbling.progress);
        $('.label').append(scrobbling.progress + '/' + scrobbling.animeData.attributes.episodeCount);
        $('#scrobblenow').click(function() {
            chrome.runtime.sendMessage({action: 'scrobbleNow'}, function(response) {
                console.log('scrobbled');
                $('#notice').text(chrome.i18n.getMessage('scrobbled'));
                $('#scrobblenow').remove();
            });
        });
    } else if (scrobbling.error == null) {
        $('#content').empty();
    }
});