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
/* exported vm */
var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var vm = new Vue({
    el: '.container',
    data: {
        email: null,
        password: null,
        emailtest: false,
        passtest: false,
        blockbtn: false,
        notice: null
    },
    watch: {
        email: function(email) {
            this.emailtest = re.test(email);
            return;
        },
        password: function(password) {
            this.passtest = (password.length > 0);
            return;
        }
    },
    methods: {
        trans: function(id) {
            return chrome.i18n.getMessage(id);
        },
        submitLogin: function(e) {
            e.preventDefault();
            if (!this.passtest || !this.emailtest) {
                throw new Error('passtest or email test is KO');
            }
            var url = 'https://kitsu.io/api/oauth/token',
                options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    body: 'grant_type=password&username=' + encodeURIComponent(this.email) + '&password=' + encodeURIComponent(this.password)
                };
    
        
    
            function handleResponse(data) {
                data.json().then(function (data) {
                    if (data.error) {
                        vm.notice = chrome.i18n.getMessage('loginError');
                    } else {
                        var url = 'https://kitsu.io/api/edge/users?filter[self]=true',
                            options = {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/vnd.api+json',
                                    'Accept': 'application/vnd.api+json',
                                    'Authorization': 'Bearer ' + data.access_token
                                },
                            };
        
                        fetch(url, options).then(function (data2) {
                            data2.json().then(function (data2) {
                                chrome.storage.local.set({'atoken': data.access_token, 'uid': data2.data[0].id}, function() {
                                    vm.notice = chrome.i18n.getMessage('connected');
                                    vm.blockbtn = true;
                                    //chrome.runtime.reload();
                                });
                            });
                        });
                    }
                });
            }
            fetch(url, options).then(handleResponse);
        }
    }
});