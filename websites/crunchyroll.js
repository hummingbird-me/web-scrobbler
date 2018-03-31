/*
Get Metadata from an episode of Crunchyroll

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

function message() {
    $('#template_body').prepend('<div class="message-container cf"><div class="message-list"><div id="anilist_scrobbler_notice" class="message-item clearfix message-type-warning">Anilist Scrobbler : ' + chrome.i18n.getMessage('starting') + '</div></div></div>');
    return true;
}

function main() {
    var regex = /http:\/\/www.crunchyroll.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)/;
    var regex2 = /\((Season|Saison) ([0-9])\)/;
    var regex3 = /(Season|Saison) ([0-9])/;

    if (regex.test(document.documentURI) && document.documentURI != 'http://www.crunchyroll.com/videos/anime') {
        var episodeId = null;
        episodeId = retrieveWindowVariables(['DYNAMIC.MEDIA_ID']);
        episodeId = episodeId['DYNAMIC.MEDIA_ID'];
        if (episodeId == null) {
            // Fallback by documentURI (firefox)
            var uri = document.documentURI;
            episodeId = uri.substr(uri.length - 6);
        }
        $.get('http://www.crunchyroll.com/xml?req=RpcApiVideoPlayer_GetMediaMetadata&media_id=' + episodeId, function(data) {
            var series_title = data.getElementsByTagName('series_title')[0].innerHTML;
            series_title = series_title.replace(regex2, '');
            series_title = series_title.replace(regex3, '');
            var episode_number = data.getElementsByTagName('episode_number')[0].innerHTML;

            initScrobble(series_title, episode_number, message);
        }, 'xml');
    }

}

$(window).on('load', function() {
    chrome.storage.sync.get({
        ignore_cr: false
    }, function(items) {
        if (items.ignore_cr == false) {
            main();
        }
    });
});
