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
//Localize by replacing __MSG_***__ meta tags
var objects = document.getElementsByTagName('html');
for (var j = 0; j < objects.length; j++) {
    var obj = objects[j];

    var valStrH = obj.innerHTML.toString();
    var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
        return v1 ? chrome.i18n.getMessage(v1) : '';
    });

    if (valNewH != valStrH) {
        obj.innerHTML = valNewH;
    }
}

function submitLogin() {
    var url = 'https://kitsu.io/api/oauth/token',
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: 'grant_type=password&username=' + encodeURIComponent($('#login').val()) + '&password=' + encodeURIComponent($('#password').val())
        };

    

    function handleResponse(data) {
        data.json().then(function (data) {
            if (data.error) {
                $('#notice').text(chrome.i18n.getMessage('loginError'));
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
                            $('#notice').text(chrome.i18n.getMessage('connected'));
                            chrome.runtime.reload();
                        });
                    });
                });
            }
        });
    }

    fetch(url, options).then(handleResponse);
}

$('#submitbtn').click(submitLogin);