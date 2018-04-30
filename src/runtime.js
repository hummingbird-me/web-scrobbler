/*!
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
/* exported scrobbling, mainTimer*/
var scrobbling = {error: null, origin: null, chooseData: []};
var mainTimer;
// Reset runtime
chrome.browserAction.setBadgeText({text: ''});
chrome.browserAction.setBadgeBackgroundColor({color: '#a86d00'});
// Check the token state
getCredentials().then(function(result) {
    var url = 'https://kitsu.io/api/edge/users?filter[self]=true',
        options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
                'Authorization': 'Bearer ' + result.atoken
            },
        };

    fetch(url, options).then(function(data) {
        data.json().then(function(jsondata) {
            if (jsondata.meta.count === 0) {
                chrome.notifications.create('kitsuBadToken', {
                    type: 'basic',
                    iconUrl: '../img/logo230.png',
                    title: chrome.i18n.getMessage('badTokenNotificationTitle'),
                    message: chrome.i18n.getMessage('badTokenNotificationMessage')
                });
        
                scrobbling.error = 'exptoken';
            }
        });  
    });
}).catch(function(reason) {
    console.warn('No account', reason);
    chrome.notifications.create('kitsuLogin', {
        type: 'basic',
        iconUrl: '../img/logo230.png',
        title: chrome.i18n.getMessage('welcomeNotificationTitle'),
        message: chrome.i18n.getMessage('welcomeNotificationMessage')
    });
    
    scrobbling.error = 'noacc';
});

chrome.notifications.onClicked.addListener(function(notificationId) {
    if (notificationId == 'kitsuLogin' || notificationId == 'kitsuBadToken') {
        chrome.runtime.openOptionsPage();
        chrome.notifications.clear(notificationId);
    }
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (scrobbling.origin == tabId && typeof mainTimer == 'object') {
        if (typeof changeInfo.url == 'string') {
            console.log({tabId: tabId, timer: mainTimer, event: 'tab changed url', tab: tab});
            mainTimer.pause();
            mainTimer = undefined;
            scrobbling = {error: null, origin: null, chooseData: []};
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
        console.log({tabId: tabId, timer: mainTimer, event: 'tab closed', removeInfo: removeInfo});
        mainTimer.pause();
        mainTimer = undefined;
        chrome.browserAction.setBadgeText({text: ''});
        scrobbling = {error: null, origin: null, chooseData: []};
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
                        getFeed(scrobbling.animeData.id, scrobbling.episode).then(function(data) {
                            scrobbling.discussdata = data;
                        });
                    });
                } else {
                    // TODO : promptAnime ?
                    getAnimeProgress(jsondata.data[0].id).then(function(animeProgress) {
                        console.log('hey there bis !');
                        scrobbling = {error: 'none', animeData: jsondata.data[0], progress: animeProgress, episode: message.episode_number, origin: sender.tab.id, chooseData: jsondata.data};
                        if (jsondata.data[0].attributes.episodeLength == null) {
                            scrobbling.notice = chrome.i18n.getMessage('timeNull');
                            chrome.browserAction.setBadgeText({text: '!'});
                            chrome.browserAction.setBadgeBackgroundColor({color: '#a86d00'});
                        } else {
                            chrome.browserAction.setBadgeText({text: 'OK?'});
                            chrome.browserAction.setBadgeBackgroundColor({color: '#f7ca42'});
                            mainTimer = new Timer(scrobbleAnime, parseInt(jsondata.data[0].attributes.episodeLength * 0.75 * 60 * 1000), jsondata.data[0].id, message.episode_number);
                        }
                        getFeed(scrobbling.animeData.id, scrobbling.episode).then(function(data) {
                            scrobbling.discussdata = data;
                        });               
                    });
                }
            });
        }).catch(function(reason) {
            scrobbling.error = 'neterr';
            scrobbling.trace = reason;
        });
    } else if (message.action == 'setScrobbling') {
        console.log(message);
        console.log(scrobbling.chooseData);
        mainTimer.pause();
        getAnimeProgress(scrobbling.chooseData[message.id].id).then(function(animeProgress) {
            console.log('setScrobbling !');
            if (scrobbling.chooseData[message.id].attributes.episodeLength == null) {
                scrobbling.notice = chrome.i18n.getMessage('timeNull');
                chrome.browserAction.setBadgeText({text: '!'});
                chrome.browserAction.setBadgeBackgroundColor({color: '#a86d00'});
            } else {
                chrome.browserAction.setBadgeText({text: 'OK'});
                chrome.browserAction.setBadgeBackgroundColor({color: '#167000'});
                mainTimer = new Timer(scrobbleAnime, parseInt(scrobbling.chooseData[message.id].attributes.episodeLength * 0.75 * 60 * 1000), scrobbling.chooseData[message.id].id, scrobbling.episode);
            }
            scrobbling = {error: 'none', animeData: scrobbling.chooseData[message.id], progress: animeProgress, episode: scrobbling.episode, origin: scrobbling.origin, chooseData: []};
            getFeed(scrobbling.animeData.id, scrobbling.episode).then(function(data) {
                scrobbling.discussdata = data;
                sendResponse(true);
            }); 
        });
    } else if (message.action == 'getScrobbling') {
        sendResponse(scrobbling);
    } else if (message.action == 'scrobbleNow') {
        scrobbleAnime(scrobbling.animeData.id, scrobbling.episode);
        scrobbling.notice = chrome.i18n.getMessage('scrobbled');
        sendResponse(true);
    } else {
        console.error('Unknown runtime message', message);
        sendResponse(false);
    }
});