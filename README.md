# web-scrobbler

_This project is WIP and is experimental, should normally work with Chrome and Firefox._

Automatically tracks your episode progress on Kitsu when you stream anime from your browser. Works great with Crunchyroll, Hulu, Wakanim.tv and Anime Digital Network. Experimental with Netflix.

Wanna try ? See [Installing](https://github.com/hummingbird-me/web-scrobbler/wiki/Installing) wiki page.

## npm scripts
web-scrobbler uses [`scripty`](https://github.com/testdouble/scripty) to organize npm scripts. The scripts are defined in the [`scripts`](/scripts) directory. In `package.json` you'll see the word `scripty` as opposed to the script content you'd expect. For more info, see [scripty's GitHub](https://github.com/testdouble/scripty).

| Command       | Effect                     |
| ------------- | -------------------------- |
| build         | Run gulp default task      |
| clean         | Clean build/ folder        |
| clean:builds  | Clean target/ folder       |
| copydevel     | Copy node_modules/ to src/ |