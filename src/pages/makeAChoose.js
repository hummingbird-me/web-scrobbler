/*!
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
if (new URL(document.location.href).searchParams.get('popup')) {
    $('body').css('width', 'auto');
    $('.header a').attr('href', 'popup.html?popup=1')
}
var vm;
chrome.runtime.sendMessage({action: 'getScrobbling'}, function(scrobbling) {
    vm = new Vue({
        el: '.content',
        data: {
            scrobbling: scrobbling
        },
        methods: {
            trans: function(id) {
                return chrome.i18n.getMessage(id);
            },
            choose: function(event) {
                event.preventDefault();
                chrome.runtime.sendMessage({action: 'setScrobbling', id: $(event.target).attr('data-choose')}, function(res) {
                    document.location = 'popup.html';
                });
            }
        }
    });
});