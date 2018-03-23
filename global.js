/*
Global helpers file

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

function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = '';
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += 'if (typeof ' + currVariable + ' !== \'undefined\') $(\'body\').attr(\'tmp_' + currVariable + '\', ' + currVariable + ');\n'
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        ret[currVariable] = $('body').attr('tmp_' + currVariable);
        $('body').removeAttr('tmp_' + currVariable);
    }

    $('#tmpScript').remove();

    return ret;
}

function getCredentials() {
    return new Promise(resolve => {
        chrome.storage.local.get(['atoken', 'uid'], function (items) {
            resolve(items);
        });
    });
}

function getAnimeProgress(animeId) {
    return new Promise(resolve => {
        getCredentials().then(function(userdata) {
            var url = 'https://kitsu.io/api/edge/library-entries?filter[userId]=' + encodeURIComponent(userdata.uid) + '&filter[animeId]=' + encodeURIComponent(animeId),
                options = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/vnd.api+json',
                        'Accept': 'application/vnd.api+json',
                        'Authorization': 'Bearer ' + userdata.atoken,
                    }
                };

            fetch(url, options).then(function(response) {
                response.json().then(function(json) {
                    resolve(json.data[0].attributes.progress);
                });
            }).catch(function(reason) {
                resolve(false);
            });
        });
    });
}

function initScrobble(series_title, episode_number, prepend_message) {
    console.log({
        'series_tiltle': series_title,
        'epnumber': episode_number,
        'prepend_message': prepend_message,
        'action': 'initScrobble'
    });
    chrome.runtime.sendMessage({action: 'initScrobble', series_title: series_title, episode_number: episode_number, prepend_message: prepend_message});
}