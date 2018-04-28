/*!
Get Metadata from an episode of netflix.com (beta)

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
    $('.player-status').append('<span id="anilist_scrobbler_notice">Anilist Scrobbler : ' + chrome.i18n.getMessage('starting') + '</span>');
    return true;
}

function main() {
    var regex = /https:\/\/www.netflix.com\/watch\/([a-zA-Z0-9-]+)/;

    if (regex.test(document.documentURI)) {
        var series_title = $('.player-status-main-title').text();
        var episode_number = $('.player-status:nth-child(2)').text().split(' ').splice(-1);
        initScrobble(series_title, episode_number, message);
    }
}

jQuery.fn.exists = function() {
    return this.length > 0;
}

function checkDOMChange2() {
    if ($('.player-status').exists()) {
        chrome.storage.sync.get({
            ignore_nf: false
        }, function(items) {
            if (items.ignore_nf == false) {
                main();
            }
        });
    } else {
        setTimeout(checkDOMChange2, 100);
    }
}

function checkDOMChange() {
    if ($('.player-status').exists()) {
        chrome.storage.sync.get({
            ignore_nf: false
        }, function(items) {
            if (items.ignore_nf == false) {
                $('.episode-list-description-container').each(function() {
                    // checkDOMChange2();
                    console.log('Bind');
                    $(this).on('click', function() {
                        console.log('Click on episode list');
                        setTimeout(checkDOMChange2, 550);
                    });
                });
                $('.player-next-episode').on('click', function() {
                    console.log('Next player');
                    setTimeout(checkDOMChange2, 550);
                });
                /*$('.playRing').each(async function(index) {
                    // checkDOMChange2();
                    console.log("Bind");
                    $(this).on('click', async function(e) {
                        console.log("Click on a play on index");
                        setTimeout(checkDOMChange2, 550);
                    });
                });*/
                main();
            }
        });
    } else {
        setTimeout(checkDOMChange, 100);
    }
}

checkDOMChange();
