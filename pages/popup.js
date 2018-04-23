/*
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
var vm;
chrome.runtime.sendMessage({action: 'getScrobbling'}, scrobbling => {
    vm = new Vue({
        el: '.content',
        data: {
            scrobbling: scrobbling
        },
        methods: {
            trans: function(id) {
                return chrome.i18n.getMessage(id);
            },
            mjsnow: function(date) {
                return moment(date).fromNow();
            },
            showComment: function(comment) {
                var target = comment.path.find(element => {
                    return element.nodeName === 'A';
                });
                $(target).parent().parent().children('.end').show();
                $(target).parent().hide();
            },
            scrobbleNow: function(cevent) {
                chrome.runtime.sendMessage({action: 'scrobbleNow'}, function(response) {
                    console.log('scrobbled');
                    // console.log(this);
                    $(cevent.target).remove();
                    // TODO : fix : vm.scrobbling.notice = chrome.i18n.getMessage('scrobbled');
                });
            },
            openOptions: function() {chrome.runtime.openOptionsPage();}
        },
        created: function() {
            $('.progress').progress({
                total: scrobbling.animeData.attributes.episodeCount
            });
            $('.progress').progress('set progress', scrobbling.progress);
        }
    });
});
