
**MEditable** is a WYSIWYG markdown editor for web browser applications, derived from the open-source library [Muya](https://github.com/marktext/muya), with most features re-implemented from it, such as visual rendering of markdown text, text search and replacement. What's more, MEditable supports a lot highly efficient features, such as format replacement, dragging images to editor and so on. 

MEditable is still under development as a stand-alone library, providing markdown editing for [GeekEditor](https://www.geekeditor.com). 

## Installing

```sh
npm install @geekeditor/meditable
```

## Usage

```javascript
import MEditable from '@geekeditor/meditable'

const container = document.querySelector('#editor')
const meditable = new MEditable({container})
meditable.prepare().then(() => {
    meditable.setContent(`**MEditable** a WYSIWYG markdown editor for web browser applications.`)
});
```

## Documents

Coming soon!!!

## Development

```sh
# step1: install dependencies
npm install
# step2: run the development codes
npm run dev
```

## Build

```sh
npm run build
```

## Publish

```sh
# update version numbers
npm publish
```

## FAQ


None

## Built with MEditable

- [GeekEditor](https://www.geekeditor.com) - A markdown-based note-taker using your Github/Gitee/GitLab's repositories as storage.

## License

MIT © [montisan](https://github.com/montisan)