/*!
Get Metadata from an episode of animedigitalnetwork.fr

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
    $('.adn-big-title h1 span').append('<span id="anilist_scrobbler_notice">Anilist Scrobbler : ' + chrome.i18n.getMessage('starting') + '</span></li>');
    return true;
}

function main() {
    var regex = /http:\/\/animedigitalnetwork.fr\/video\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)/;
    if (regex.test(document.documentURI)) {
        var series_title = $('.adn-big-title h1 a').text().replace('Nouvelle Saison', '');
        var episode_number = $('.current .adn-playlist-block a').attr('title').replace('Épisode ', '');
        initScrobble(series_title, episode_number, message);
    }
}

$(window).on('load', function() {
    chrome.storage.sync.get({
        ignore_adn: false
    }, function(items) {
        if (items.ignore_adn == false) {
            main();
        }
    });
});
