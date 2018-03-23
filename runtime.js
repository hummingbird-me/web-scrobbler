/*
Main runtime

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
var scrobbling = {error: null};
var error;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action == 'initScrobble') {
        console.log('initScrobble');
        var url = 'https://kitsu.io/api/edge/anime?filter[text]=' + encodeURIComponent(message.series_title),
            options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json'
                }
            };
        
        fetch(url, options).then(function(response) {
            response.json().then(function(jsondata) {
                if (jsondata.data.length == 0) {
                    scrobbling = {error: 'notfound'};
                    console.log('No results');
                } else if (jsondata.data.length == 1) {
                    getAnimeProgress(jsondata.data[0].id).then(function(animeProgress) {
                        console.log('hey there !');
                        scrobbling = {error: 'none', animeData: jsondata.data[0], progress: animeProgress};
                    });
                } else {
                    // to do
                    getAnimeProgress(jsondata.data[0].id).then(function(animeProgress) {
                        console.log('hey there bis !');
                        scrobbling = {error: 'none', animeData: jsondata.data[0], progress: animeProgress};
                    });
                }
            });
        }).catch(function(reason) {
            error = [true, reason];
        });
    } else if (message.action == 'getScrobbling') {
        sendResponse(scrobbling);
    }
});