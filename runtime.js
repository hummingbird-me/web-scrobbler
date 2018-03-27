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
var scrobbling = {error: null, origin: null};
var error;
var mainTimer;
// Reset runtime
chrome.browserAction.setBadgeText({text: ''});
chrome.browserAction.setBadgeBackgroundColor({color: '#a86d00'});
getCredentials().catch(function(reason) {
    chrome.notifications.create('kitsuLogin', {
        type: 'basic',
        iconUrl: '../img/logo230.png',
        title: chrome.i18n.getMessage('welcomeNotificationTitle'),
        message: chrome.i18n.getMessage('welcomeNotificationMessage')
    });
    chrome.notifications.onClicked.addListener(function(notificationId) {
        if (notificationId == 'kitsuLogin') {
            chrome.runtime.openOptionsPage();
            chrome.notifications.clear('kitsuLogin');
        }
    });
    scrobbling = {error: 'noacc'};
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (scrobbling.origin == tabId && typeof mainTimer == 'object') {
        if (typeof changeInfo.url == 'string') {
            console.log({tabId: tabId, timer: mainTimer, event: 'tab changed url'});
            mainTimer.pause();
            mainTimer = undefined;
            chrome.browserAction.setBadgeText({text: ''});
        } else if (typeof changeInfo.audible == 'boolean' && changeInfo.audible) {
            console.log({tabId: tabId, timer: mainTimer, event: 'audible', remaining: mainTimer.getRemaining()});
            if (mainTimer.isPaused()) {
                mainTimer.resume();
            }
        } else if (typeof changeInfo.audible == 'boolean' && !changeInfo.audible) {
            console.log({tabId: tabId, timer: mainTimer, event: 'not audible'});
            if (!mainTimer.isPaused()) {
                mainTimer.pause();
            }
        }
    }
});
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (scrobbling.origin == tabId && typeof mainTimer == 'object') {
        console.log({tabId: tabId, timer: mainTimer, event: 'tab closed'});
        mainTimer.pause();
        mainTimer = undefined;
        chrome.browserAction.setBadgeText({text: ''});
    }
});
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
                    chrome.browserAction.setBadgeText({text: '?'});
                    chrome.browserAction.setBadgeBackgroundColor({color: '#a86d00'});
                } else if (jsondata.data.length == 1) {
                    getAnimeProgress(jsondata.data[0].id).then(function(animeProgress) {
                        console.log('hey there !');
                        scrobbling = {error: 'none', animeData: jsondata.data[0], progress: animeProgress, episode: message.episode_number, origin: sender.tab.id};
                        if (jsondata.data[0].attributes.episodeLength == null) {
                            scrobbling.notice = chrome.i18n.getMessage('timeNull');
                            chrome.browserAction.setBadgeText({text: '!'});
                            chrome.browserAction.setBadgeBackgroundColor({color: '#a86d00'});
                        } else {
                            chrome.browserAction.setBadgeText({text: 'OK'});
                            chrome.browserAction.setBadgeBackgroundColor({color: '#167000'});
                            mainTimer = new Timer(scrobbleAnime, parseInt(jsondata.data[0].attributes.episodeLength * 0.75 * 60 * 1000), jsondata.data[0].id, message.episode_number);
                        }
                    });
                } else {
                    // TODO : promptAnime ?
                    getAnimeProgress(jsondata.data[0].id).then(function(animeProgress) {
                        console.log('hey there bis !');
                        scrobbling = {error: 'none', animeData: jsondata.data[0], progress: animeProgress, episode: message.episode_number, origin: sender.tab.id};
                        if (jsondata.data[0].attributes.episodeLength == null) {
                            scrobbling.notice = chrome.i18n.getMessage('timeNull');
                            chrome.browserAction.setBadgeText({text: '!'});
                            chrome.browserAction.setBadgeBackgroundColor({color: '#a86d00'});
                        } else {
                            chrome.browserAction.setBadgeText({text: 'OK'});
                            chrome.browserAction.setBadgeBackgroundColor({color: '#167000'});
                            mainTimer = new Timer(scrobbleAnime, parseInt(jsondata.data[0].attributes.episodeLength * 0.75 * 60 * 1000), jsondata.data[0].id, message.episode_number);
                        }                    
                    });
                }
            });
        }).catch(function(reason) {
            error = [true, reason];
        });
    } else if (message.action == 'getScrobbling') {
        sendResponse(scrobbling);
    } else if (message.action == 'scrobbleNow') {
        scrobbleAnime(scrobbling.animeData.id, scrobbling.episode);
        sendResponse(true);
    } else {
        console.error('Unknown runtime message', message);
        sendResponse(false);
    }
});