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
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['atoken', 'uid'], function (items) {
            if (!items.atoken) {
                reject(false);
            } else {
                resolve(items);
            }
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
                    if (json.data.length == 0) {
                        resolve(0);
                    } else {
                        resolve(json.data[0].attributes.progress);
                    }
                });
            }).catch(function(reason) {
                resolve(false);
            });
        });
    });
}

function scrobbleAnime(animeId, episode) {
    getCredentials().then(function (userdata) {
        var url = 'https://kitsu.io/api/edge/library-entries?filter[animeId]=' + encodeURIComponent(animeId) + '&filter[userId]=' + encodeURIComponent(userdata.uid),
            options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json',
                    'Authorization': 'Bearer ' + userdata.atoken,
                }
            }

        fetch(url, options).then(function(response) {
            response.json().then(function(json) {
                if (json.data.length == 0) {
                    url2 = 'https://kitsu.io/api/edge/library-entries';
                    options.method = 'POST',
                    options.body = JSON.stringify({
                        type: 'libraryEntries',
                        attributes: {
                            status: 'current',
                            progress: episode
                        },
                        relationships: {
                            anime: {
                                data: {
                                    type: 'anime',
                                    id: animeId
                                },
                            },
                            user: {
                                data: {
                                    type: 'users',
                                    id: userdata.uid
                                }
                            }
                        }
                    });
                } else {
                    url2 = 'https://kitsu.io/api/edge/library-entries/' + json.data[0].id;
                    options.method = 'PATCH';
                    options.body = JSON.stringify({
                        data: {
                            id: json.data[0].id,
                            type: 'libraryEntries',
                            attributes: {
                                status: 'current',
                                progress: episode
                            }
                        }
                    });
                }
                fetch(url2, options).then(function (response) {
                    chrome.browserAction.setBadgeText({text: '+'});
                    chrome.browserAction.setBadgeBackgroundColor({color: '#167000'});
                }).catch(function(error) {
                    console.error(error);
                });
            })
        }).catch(function(error) {
            console.error(error);
        });
    });
}

function checkLoop(tabId) {
    try {
        chrome.tabs.get(tabId, function(tab) {
            if (!tab.audible) {
                mainTimer.pause();
                window.setTimeout(checkLoop, 2500, tabId);
            } else {
                if (mainTimer.isPaused()) {
                    mainTimer.resume();
                }
                window.setTimeout(checkLoop, 2500, tabId);
            }
        });
    } catch (error) {
        mainTimer.pause();
        mainTimer = undefined;
    }
}

/* Timer class */
function Timer(callback, delay, ...params) {
    var timerId, start, remaining = delay, paused;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
        paused = true;
    };

    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining, ...params);
        paused = false;
    };

    this.isPaused = function() { return paused; };

    this.getRemaining = function() { return remaining; };

    this.setRemaining = function(time) { remaining = time; };

    this.resume();
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