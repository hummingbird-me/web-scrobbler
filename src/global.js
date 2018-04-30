/*!
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
/*eslint no-unused-vars: "off"*/
/*global scrobbling, mainTimer*/

/**
 * Retrieve actual window variables
 * @param {Array} variables Set of variables to retrieve
 * @returns {Array} Set of variables
 */
function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = '';
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += 'if (typeof ' + currVariable + ' !== \'undefined\') $(\'body\').attr(\'tmp_' + currVariable + '\', ' + currVariable + ');\n';
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (i = 0; i < variables.length; i++) {
        currVariable = variables[i];
        ret[currVariable] = $('body').attr('tmp_' + currVariable);
        $('body').removeAttr('tmp_' + currVariable);
    }

    $('#tmpScript').remove();

    return ret;
}

if (!String.prototype.format) {
    /**
     * format string (like C++)
     * @param {String} str strings to parse
     */
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
            ;
        });
    };
}

/**
 * Get Credentials
 * @returns {Promise} {atoken, uid}
 */
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

/**
 * Do an API request to kitsu.io
 * @param {string} endpoint api endpoint
 * @param {Request} options fetch options, auth is by default added
 */
function doAPIRequest(endpoint, options) {
    return new Promise((resolve, reject) => {
        getCredentials().then(userdata => {
            var url = 'https://kitsu.io/{0}'.format(endpoint);
            if (!options.headers) options.headers = {
                Authorization: 'Bearer {0}'.format(userdata.atoken),
                'Content-Type': 'application/vnd.api+json',
                Accept: 'application/vnd.api+json'
            };
            fetch(url, options).then(response => {
                if (!response.ok) reject({error: 'fetchf', response: response});
                response.json().then(json => {
                    resolve(json);
                });
            });
        });
    });
}

/**
 * Get anime progress by its id
 * @param {Number} animeId id of the anime
 * @returns {Promise} {Number} progress
 */
function getAnimeProgress(animeId) {
    return new Promise(resolve => {
        getCredentials().then(function(userdata) {
            doAPIRequest('https://kitsu.io/api/edge/library-entries?filter[userId]={0}&filter[animeId]={1}'.format(encodeURIComponent(userdata.uid), encodeURIComponent(animeId)), {method: 'GET'}).then(json => {
                if (json.data.length == 0) {
                    resolve(0);
                } else {
                    resolve(json.data[0].attributes.progress);
                }
            });
        });
    });
}

/**
 * Follow the post
 * @param {Number} postid ID of the Post
 * @returns {Promise} {Number} ID of the Post Follow
 */
function followPost(postid) {
    return new Promise((resolve, reject) => {
        getCredentials().then(userdata => {
            doAPIRequest('api/edge/post-follows', {method: 'POST', body: JSON.stringify({
                data: {
                    relationships: {
                        user: {
                            data: {
                                id: userdata.uid,
                                type: 'users'
                            }
                        },
                        post: {
                            data: {
                                id: postid,
                                type: 'posts'
                            }
                        }
                    },
                    type: 'post-follows'
                }
            })}).then(json => {
                resolve(json.data.id);
            }).catch(reason => {
                reject(reason);
            });
        });
    });
}

/**
 * Like a post by its ID
 * @param {Number} postId ID of the Post
 * @returns {Promise} {Number} ID of the Post Like
 */
function likePost(postId) {
    return new Promise((resolve, reject) => {
        getCredentials().then(userdata => {
            doAPIRequest('api/edge/post-likes', {method: 'POST', body: JSON.stringify({
                data: {
                    relationships: {
                        user: {
                            data: {
                                id: userdata.uid,
                                type: 'users'
                            }
                        },
                        post: {
                            data: {
                                id: postId,
                                type: 'posts'
                            }
                        }
                    },
                    type: 'post-likes'
                }
            })}).then(json => {
                resolve(json.data.id);
            }).catch(reason => {
                reject(reason);
            });
        });
    });
}

/**
 * Remove the like of a post by its id
 * @param {Number} postId ID of the post
 * @returns {Promise} true
 * @throws {Promise} fetch failed
 */
function unlikePost(postId) {
    return new Promise((resolve, reject) => {
        getCredentials().then((userdata) => {
            doAPIRequest('api/edge/post-likes?filter%5BpostId%5D={0}&filter%5BuserId%5D={1}'.format(postId, userdata.uid), {method: 'GET'}).then(result => {
                if (result.meta.count == 0) resolve(true);
                else doAPIRequest('api/edge/post-likes/{0}'.format(result.data[0].id), {method: 'DELETE'}).then(r => {
                    if (r.ok) resolve(true); else reject({error: 'fetchf'});
                });
            });
        });
    });
}

/**
 * Post in episode feed
 * @param {Number} animeId ID of the anime
 * @param {Number} episode Episode number
 * @param {Object} content {text: '', spoiler: bool, nsfw: bool}
 */
function postFeed(animeId, episode, content) {
    return new Promise((resolve, reject) => {
        getCredentials().then(userdata => {
            doAPIRequest('api/edge/episodes?filter%5BmediaType%5D=Anime&filter%5BmediaId%5D={0}&page%5Boffset%5D={1}&page%5Blimit%5D=1'.format(animeId, (parseInt(episode) - 1)), {method: 'POST'}).then(jsondata => {
                if (jsondata.data.length === 0) {
                    reject({error: 'noepfeed'});
                } else {
                    doAPIRequest('api/edge/posts', {method: 'POST', body: JSON.stringify({
                        data: {
                            attributes: {
                                content: content.text,
                                spoiler: content.spoiler,
                                nsfw: content.nsfw
                            },
                            type: 'posts',
                            relationships: {
                                media: {
                                    data: {
                                        type: 'anime',
                                        id: animeId
                                    }
                                },
                                spoiledUnit: {
                                    data: {
                                        type: 'episodes',
                                        id: jsondata.data[0].id
                                    }
                                },
                                user: {
                                    data: {
                                        type: 'users',
                                        id: userdata.uid
                                    }
                                }
                            }
                        }
                    })}).then(data => {
                        resolve(data);
                    });
                }
            });
        });
    });
}

/**
 * Update/Create library entry (scrobble)
 * @param {Number} animeId ID of the anime
 * @param {Number} episode Episode number
 */
function scrobbleAnime(animeId, episode) {
    getCredentials().then(function (userdata) {
        console.log({animeId: animeId, episode: episode, event: 'scrobbling !'});
        var url = 'https://kitsu.io/api/edge/library-entries?filter[animeId]=' + encodeURIComponent(animeId) + '&filter[userId]=' + encodeURIComponent(userdata.uid),
            options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'Accept': 'application/vnd.api+json',
                    'Authorization': 'Bearer ' + userdata.atoken,
                }
            };

        doAPIRequest('https://kitsu.io/api/edge/library-entries?filter[animeId]={0}&filter[userId]={1}'.format(encodeURIComponent(animeId), encodeURIComponent(userdata.uid)), {method: 'GET'}).then(json => {
            if (json.data.length == 0) {
                var url2 = 'https://kitsu.io/api/edge/library-entries';
                options.method = 'POST',
                options.body = JSON.stringify({
                    data: {
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
                    }
                });
            } else {
                var rewatch, rewatchCount;
                if (json.data[0].attributes.status == 'completed') {
                    rewatch = true;
                    rewatchCount = json.data[0].attributes.reconsumeCount + 1;
                    console.log('Will mark as a rewatch');
                } else {
                    rewatch = json.data[0].attributes.reconsuming;
                    rewatchCount = json.data[0].attributes.reconsumeCount;
                }
                var options = {
                    body: JSON.stringify({
                        method: 'PATCH',
                        data: {
                            id: json.data[0].id,
                            type: 'libraryEntries',
                            attributes: {
                                status: 'current',
                                progress: episode,
                                reconsuming: rewatch,
                                reconsumeCount: rewatchCount
                            }
                        }
                    })
                };
                doAPIRequest('https://kitsu.io/api/edge/library-entries/{0}'.format(json.data[0].id), options).then(json => {
                    chrome.browserAction.setBadgeText({text: '+'});
                    chrome.browserAction.setBadgeBackgroundColor({color: '#167000'});
                    scrobbling.scrobbled = true;
                    mainTimer.pause();
                });
            }
        });
    });
}

/**
 * Feed coroutine : parse the result of getFeed()
 * @param {JSON} jsondata fetch result
 * @return {Promise} parsed result
 */
function parseFeedResult(jsondata) {
    return new Promise((resolve, reject) => {
        var postsIds = [];
        if (jsondata.data.length === 0) resolve([]);
        getCredentials().then(userdata => {
            var comments = [];
            var posts = [];
            for (var i = 0; i < jsondata.data.length; i++) {
                jsondata.data[i].activity = jsondata.included.find(element => {
                    return (element.type == 'activities' && element.id == jsondata.data[i].relationships.activities.data[0].id);
                });
                jsondata.data[i].user = jsondata.included.find(element => {
                    return (element.type == 'users' && element.id == jsondata.data[i].activity.relationships.actor.data.id);
                });
                if (!jsondata.data[i].activity.relationships.target.data) {
                    jsondata.data[i].post = jsondata.included.find(element => {
                        return (element.id == jsondata.data[i].activity.relationships.subject.data.id);
                    });
                    jsondata.data[i].comments = [];
                    doAPIRequest('api/edge/post-likes?filter%5BpostId%5D={0}&filter%5BuserId%5D={1}'.format(jsondata.data[i].post.id, userdata.uid), {method: 'GET'}).then(result => {
                        if (result.meta.count == 1) jsondata.data[i].liked = true;
                        if (result.meta.count != 1) jsondata.data[i].liked = false;
                    });
                    console.log({iteration: i, type: 'post', data: jsondata.data[i]});
                    posts.push(jsondata.data[i]);
                } else {
                    var tmp1 = jsondata.data[i];
                    var tmp2 = jsondata.data[i];
                    tmp1.post = jsondata.included.find(element => {
                        return (element.id == tmp1.activity.relationships.target.data.id);
                    });
                    tmp1.user = jsondata.included.find(element => {
                        return (element.id == tmp1.post.relationships.user.data.id);
                    });
                    tmp1.comments = [];
                    doAPIRequest('api/edge/post-likes?filter%5BpostId%5D={0}&filter%5BuserId%5D={1}'.format(tmp1.post.id, userdata.uid), {method: 'GET'}).then(result => {
                        if (result.meta.count == 1) tmp1.liked = true;
                        if (result.meta.count != 1) tmp1.liked = false;
                    });
                    posts.push(tmp1);
                    tmp2.post = jsondata.included.find(element => {
                        return (element.id == tmp2.activity.relationships.target.data.id);
                    });
                    tmp2.comment = jsondata.included.find(element => {
                        return (element.id == tmp2.activity.relationships.subject.data.id);
                    });
                    tmp2.comment.author = jsondata.included.find(element => {
                        return (element.id == tmp2.comment.relationships.user.data.id);
                    });
                    doAPIRequest('api/edge/comment-likes?filter%5BcommentId%5D={0}&filter%5BuserId%5D={1}'.format(tmp2.comment.id, userdata.uid), {method: 'GET'}).then(result => {
                        if (result.meta.count == 1) tmp2.liked = true;
                        if (result.meta.count != 1) tmp2.liked = false;
                    });
                    console.log({iteration: i, type: 'comment', data: tmp2});
                    comments.push(tmp2);
                }
            }
            for (i = 0; i < comments.length; i++) {
                for (var ii = 0; ii < posts.length; ii++) {
                    console.log({post: posts[ii], comment: comments[i], iteration: i, iteration2: ii});
                    if (comments[i].post.id == posts[ii].post.id) {
                        console.log('match !');
                        // avoid Converting circular structure to JSON
                        var comment = comments[i].comment;
                        console.log(comment);
                        posts[ii].comments.push(comment);
                    }
                }
            }
            console.log({comments: comments, posts: posts});
            resolve(posts);
        });
    });
}

/**
 * Obtain feed of an episode
 * @param {Number} animeId ID of the anime
 * @param {Number} episode Episode number
 */
function getFeed(animeId, episode) {
    return new Promise(resolve => {
        doAPIRequest('api/edge/episodes?filter%5BmediaType%5D=Anime&filter%5BmediaId%5D={0}&page%5Boffset%5D={1}&page%5Blimit%5D=1'.format(animeId, (parseInt(episode)) - 1), {method: 'GET'}).then(jsondata => {
            if (jsondata.data.length == 0) {
                resolve([]);
            } else {
                var episodeId = jsondata.data[0].id;
                doAPIRequest('api/edge/feeds/episode_aggr/{0}?filter%5Bkind%5D=posts&include=media%2Cactor%2Cunit%2Csubject%2Ctarget%2Ctarget.user%2Ctarget.target_user%2Ctarget.spoiled_unit%2Ctarget.media%2Ctarget.target_group%2Csubject.user%2Csubject.target_user%2Csubject.spoiled_unit%2Csubject.media%2Csubject.target_group%2Csubject.followed%2Csubject.library_entry%2Csubject.anime%2Csubject.manga&page%5Blimit%5D=100'.format(episodeId), {
                    method: 'GET'
                }).then(data => {
                    parseFeedResult(data).then(finaldata => {
                        resolve(finaldata);
                    });
                });
            }
        });
    });
}

/**
 * Timer class
 * @param {Function} callback callback at the end of the timer 
 * @param {Number} delay delay in milliseconds
 * @param {any} params Params of callback
 */
function Timer(callback, delay, ...params) {
    var timerId, start, paused;
    var remaining = delay;

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

/**
 * initScrobble alias
 * @param {String} series_title Title of the series
 * @param {Number} episode_number Number of the episode
 * @param {Function} prepend_message Function to prepend a message on the page
 */
function initScrobble(series_title, episode_number, prepend_message) {
    chrome.runtime.sendMessage({action: 'initScrobble', series_title: series_title, episode_number: episode_number, prepend_message: prepend_message});
}