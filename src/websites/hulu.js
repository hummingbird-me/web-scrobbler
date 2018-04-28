/*!
Get Metadata from an episode of hulu.com

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
    $('h1.video-titles').append('<span id="anilist_scrobbler_notice" style="font-family: Flama; font-size: 15px;">Anilist Scrobbler : ' + chrome.i18n.getMessage('starting') + '</span>');
    return true;
}

function main() {
    var regex = /https:\/\/www.hulu.com\/watch\/([0-9]+)/;

    if (regex.test(document.documentURI)) {
        var title = $('title').text();
        var regex1 = /Watch\s*(.*?)\s*Season/g;
        var regex2 = /Episode\s*(.*?)\s*\| Hulu/g;
        var series_title = regex1.exec(title)[1];
        var episode_number = regex2.exec(title)[1];
        initScrobble(series_title, episode_number, message);
    }
}

$(window).on('load', function() {
    chrome.storage.sync.get({
        ignore_hulu: false
    }, function(items) {
        if (items.ignore_hulu == false) {
            main();
            $('title').bind('DOMSubtreeModified', function() {
                $('h1.video-titles #anilist').remove();
                main();
            });
        }
    });
});
