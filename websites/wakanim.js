/*
Get Metadata from an episode of Wakanim.tv

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
    $('.border-list').prepend('<li class="border-list_item"><span class="border-list_title">Anilist Scrobbler</span><span id="anilist_scrobbler_notice" class="border-list_text">' + chrome.i18n.getMessage('starting') + '</span></li>');
    return true;
}

function main() {
    var regex = /https:\/\/www.wakanim.tv\/fr\/v2\/catalogue\/episode\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)/;

    if (regex.test(document.documentURI)) {
        var series_title = $('.episode_title').text();
        var episode_number = $('.episode_subtitle span span').text();
        initScrobble(series_title, episode_number, message);
    }
}

$(window).on('load', function() {
    chrome.storage.sync.get({
        ignore_wk: false
    }, function(items) {
        if (items.ignore_wk == false) {
            main();
        }
    });
});
