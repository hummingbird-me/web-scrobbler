module.exports = {
    "env": {
        "webextensions": true,
        "browser": true,
        "es6": true
    },
    "globals": {
        "$": true,
        "retrieveWindowVariables": false,
        "getCredentials": false,
        "doAPIRequest": false,
        "getAnimeProgress": false,
        "followPost": false,
        "likePost": false,
        "unlikePost": false,
        "postFeed": false,
        "scrobbleAnime": false,
        "getFeed": false,
        "Timer": false,
        "initScrobble": false,
        "Vue": false
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-console": [
            "warn"
        ],
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "off"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
