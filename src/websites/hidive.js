/*!
Get Metadata from an episode of hidive.com (testing)

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
    var regex = /https:\/\/www.hidive.com\/stream\/([a-z-A-Z])+\/s([0-9])+e([0-9])+/;

    if (regex.test(document.documentURI)) {
        var series_title = $('.bottom-gutter-15 > h1 > a').text();
        var regex2 = /Episode ([0-9]+)/;
        var episode_number = regex2.exec($('#StreamTitleDescription > h2').first().text())[1];
        initScrobble(series_title, episode_number, message);
    }
}

$(window).on('load', function() {
    chrome.storage.sync.get({
        ignore_hd: false
    }, function(items) {
        if (items.ignore_hd == false) {
            main();
        }
    });
});
