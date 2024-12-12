import { MENodeData, MENodeRendererStaticRenderOptions, MENodeType } from "@/packages/types";
import MENode from "./node";
import { CLASS_NAMES } from "@/packages/utils/classNames";
import { getImageSrc, imageUtils, selectFiles } from "../../utils/image";
import { isValidAttribute } from "@/packages/utils/dompurify";
import { getTextContent } from "../../utils/dom";
import { canCopyBlob, copyBlob, saveToDisk } from "@/packages/utils/utils";
import { imgURLToBlob } from "@/packages/utils/convert";

export default class MEHtmlImg extends MENode {
    static type: MENodeType = "html_img";
    img: HTMLImageElement;
    static async staticRender({ data }: MENodeRendererStaticRenderOptions) {
        const { attrs } = data;
        const { src } = getImageSrc(attrs.src);
        attrs['src'] = src;
        const attrString = Object.entries(attrs).map(([key, value]) => (`${key}="${value}"`)).join(" ")
        return `<span class="${this.type}"><img ${attrString} /></span>`
    }
    get dirty() {
        const content = this.data?.raw
        if (content !== this.textContent) {
            return true;
        }

        return false;
    }
    renderSelf(data: MENodeData) {

        if (this.data && data.raw === this.data.raw) {
            return;
        }

        const { raw, attrs } = data;
        const { start, end } = data.range;
        const classNames = []
        const attributes = {}
        const dataset = {
            begin: 0,
            length: end - start,
            raw: data.raw,
        }

        if (attrs.class && /\S/.test(attrs.class)) {
            const names = attrs.class.split(/\s+/)
            classNames.push(...names)
        }

        for (const attr of Object.keys(attrs)) {
            if (attr !== "class" && attr !== "src") {
                const attrData = attrs[attr];
                if (isValidAttribute('img', attr, attrData)) {
                    attributes[attr] = attrData;
                }
            }
        }

        const { src, isUnknownType, isBlobType } = getImageSrc(attrs.src);
        if (!isUnknownType || isBlobType) {
            attributes['src'] = src;
        }

        // attributes["title"] = this.t("Double-click to select image");
        if (!this.nodes.el) {
            this.nodes.el = this.make("span", [CLASS_NAMES.ME_NODE, CLASS_NAMES.ME_IMAGE]);
            this.nodes.el.innerHTML = `<span class="${CLASS_NAMES.ME_MARKER}" spellcheck="false"></span>`
            this.nodes.el.dataset.nodeType = this.type;

            const preview = this.make('span', [CLASS_NAMES.ME_INLINE_RENDER], {
                contenteditable: "false",
                spellcheck: "false",
                // title: this.t("Double-click to select image")
            }, dataset);
            this.nodes.el.appendChild(preview);
            const icon = this.make('span', [CLASS_NAMES.ME_IMAGE_ICON]);
            preview.appendChild(icon);
            const loadingIcon = this.make('span', [CLASS_NAMES.ME_IMAGE_LOADING_ICON]);
            loadingIcon.innerHTML = '<i></i><i></i><i></i><i></i>'
            preview.appendChild(loadingIcon);
            this.img = this.make('img', [], attributes) as HTMLImageElement;
            preview.appendChild(this.img);
            const toolbar = this.make('span', [CLASS_NAMES.ME_TOOLBAR]);
            preview.appendChild(toolbar);
            const selectIcon = this.make('span', [CLASS_NAMES.ME_TOOL, CLASS_NAMES.ME_TOOL__SELECT]);

            const viewIcon = this.make('span', [CLASS_NAMES.ME_TOOL, CLASS_NAMES.ME_TOOL__VIEW]);
            toolbar.appendChild(selectIcon);
            toolbar.appendChild(viewIcon);
            this.mutableListeners.on(selectIcon, 'click', this.pickImage.bind(this))
            this.mutableListeners.on(viewIcon, 'click', this.viewImage.bind(this))

            if (canCopyBlob()) {
                const copyIcon = this.make('span', [CLASS_NAMES.ME_TOOL, CLASS_NAMES.ME_TOOL__COPY]);
                toolbar.appendChild(copyIcon);
                this.mutableListeners.on(copyIcon, 'click', this.copyImage.bind(this))
            }

            const downloadIcon = this.make('span', [CLASS_NAMES.ME_TOOL, CLASS_NAMES.ME_TOOL__DOWNLOAD]);
            toolbar.appendChild(downloadIcon);
            this.mutableListeners.on(downloadIcon, 'click', this.downloadImage.bind(this))
        } else {
            const el = this.nodes.el.lastElementChild as HTMLElement;
            for (const key in dataset) {
                if (Object.prototype.hasOwnProperty.call(dataset, key)) {
                    el.dataset[key] = dataset[key]
                }
            }

            for (let key in el.attributes) {
                const value = attributes[key]
                if (value) {
                    this.img.setAttribute(key, value)
                    delete attributes[key]
                } else {
                    this.img.removeAttribute(key)
                }
            }

            for (let key in attributes) {
                this.img.setAttribute(key, attributes[key])
            }
        }

        if (raw !== this.nodes.el.firstChild.textContent) {
            this.nodes.el.firstChild.textContent = raw
        }

        this.nodes.el.classList.toggle(CLASS_NAMES.ME_IMAGE_LOADING, !!src)
        this.nodes.el.classList.toggle(CLASS_NAMES.ME_IMAGE_EMPTY, !src)
        this.img.onload = () => {
            this.nodes.el.classList.toggle(CLASS_NAMES.ME_IMAGE_LOADING, false)
        }
        this.img.onerror = () => { this.nodes.el.classList.toggle(CLASS_NAMES.ME_IMAGE_ERROR, true) }


        if (isBlobType) {
            const file = imageUtils.getFileWithURL(src)
            if (file) {
                const imageUpload = this.instance.options.imageUpload;
                if (imageUpload) {
                    imageUpload(file).then(src => {
                        if (src) {
                            this.updateSrc(src)
                            imageUtils.clearURL(src)
                        }
                    })
                }
            } else {
                this.nodes.el.classList.toggle(CLASS_NAMES.ME_IMAGE_LOADING, false)
                this.nodes.el.classList.toggle(CLASS_NAMES.ME_IMAGE_EMPTY, true)
            }
        } else if (isUnknownType) {
            const objectURL = imageUtils.getObjectURL(src);
            if (objectURL) {
                this.img.src = objectURL;
            } else {
                const imageTransform = this.instance.options.imageTransform;
                if (imageTransform) {
                    imageTransform(src).then((res) => {
                        if (res) {
                            if (typeof res === 'string') {
                                this.img.src = src
                            } else {
                                const url = imageUtils.createObjectURL(res)
                                imageUtils.setObjectURL(src, url)
                                this.img.src = url;
                            }
                        } else {
                            this.nodes.el.classList.toggle(CLASS_NAMES.ME_IMAGE_LOADING, false)
                            this.nodes.el.classList.toggle(CLASS_NAMES.ME_IMAGE_ERROR, true)
                        }
                    })
                }
            }

        }

    }

    pickImage(event) {
        selectFiles({ accept: 'image/*' }).then((files) => {
            const url = imageUtils.createObjectURL(files[0])
            this.updateSrc(url, files[0].name)
        });
    }

    copyImage(event) {
        imgURLToBlob(this.img.src).then((blob) => {
            if (blob) {
                copyBlob(blob).then(() => {
                    event.target.classList.toggle(CLASS_NAMES.ME_TOOL__SUCCESS, true)
                    setTimeout(() => {
                        event.target.classList.toggle(CLASS_NAMES.ME_TOOL__SUCCESS, false)
                    }, 1000)
                })
            }
        })
    }

    viewImage(event) {
        this.instance.context.layout.viewImage(this.nodes.el)
    }

    downloadImage() {
        imgURLToBlob(this.img.src).then((blob) => {
            if (blob) {
                saveToDisk(this.data.attrs.alt || "image-" + Date.now() + ".png", blob)
            }
        })
    }

    updateSrc(url: string, alt?: string) {
        alt = alt || this.data.attrs.alt || ''
        const raw = `![${alt}](${url})`
        this.nodes.el.firstChild.textContent = raw
        const text = getTextContent(this.blockRenderer.nodes.holder, [CLASS_NAMES.ME_INLINE_RENDER]);

        const cursor = {
            anchor: { offset: this.data.range.start },
            focus: { offset: this.data.range.start + raw.length },
            anchorBlock: this.blockRenderer.block,
            focusBlock: this.blockRenderer.block
        }

        if (this.blockRenderer.render({ text, cursor, checkUpdate: false })) {
            this.blockRenderer.setCursor(cursor);
        }
    }
}