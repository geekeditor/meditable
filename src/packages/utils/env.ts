

const win = window as any;
const env = (function () {
    const agent = navigator.userAgent.toLowerCase(),
        opera = win.opera,
        env: any = {
            isOsx: window && window.navigator && /Mac/.test(window.navigator.platform),
            isWin:
                window &&
                window.navigator.userAgent &&
                /win32|wow32|win64|wow64/i.test(window.navigator.userAgent),
            ie: /(msie\s|trident.*rv:)([\w.]+)/i.test(agent),
            opera: !!opera && !!opera.version,
            webkit: agent.indexOf(" applewebkit/") > -1,
            mac: agent.indexOf("macintosh") > -1,
            quirks: document.compatMode === "BackCompat",
            version: 0
        };


    env.gecko =
        navigator.product === "Gecko" && !env.webkit && !env.opera && !env.ie;

    let version = 0;

    // Internet Explorer 6.0+
    if (env.ie) {
        const v1 = agent.match(/(?:msie\s([\w.]+))/);
        const v2 = agent.match(/(?:trident.*rv:([\w.]+))/);
        if (v1 && v2 && v1[1] && v2[1]) {
            version = Math.max(parseFloat(v1[1]) * 1, parseFloat(v2[1]) * 1);
        } else if (v1 && v1[1]) {
            version = parseFloat(v1[1]) * 1;
        } else if (v2 && v2[1]) {
            version = parseFloat(v2[1]) * 1;
        } else {
            version = 0;
        }

        const documentMode = (document as any).documentMode

        env.ie11Compat = documentMode === 11;
        env.ie9Compat = documentMode === 9;
        env.ie8 = !!documentMode;
        env.ie8Compat = documentMode === 8;
        env.ie7Compat =
            (version === 7 && !documentMode) || documentMode === 7;
        env.ie6Compat = version < 7 || env.quirks;
        env.ie9above = version > 8;
        env.ie9below = version < 9;
        env.ie11above = version > 10;
        env.ie11below = version < 11;
    }

    // Gecko.
    if (env.gecko) {
        let geckoRelease = agent.match(/rv:([\d\.]+)/);
        if (geckoRelease) {
            let release = geckoRelease[1].split(".");
            version =
                parseFloat(release[0]) * 10000 +
                (parseFloat(release[1]) || 0) * 100 +
                (parseFloat(release[2]) || 0) * 1;
        }
    }

    if (/chrome\/(\d+\.\d)/i.test(agent)) {
        env.chrome = +RegExp["\x241"];
    }

    if (
        /(\d+\.\d)?(?:\.\d)?\s+safari\/?(\d+\.\d+)?/i.test(agent) &&
        !/chrome/i.test(agent)
    ) {
        env.safari = +(RegExp["\x241"] || RegExp["\x242"]);
    }

    // Opera 9.50+
    if (env.opera) version = parseFloat(opera.version());

    // WebKit 522+ (Safari 3+)
    if (env.webkit) {
        const match = agent.match(/ applewebkit\/(\d+)/)
        if (match) {
            version = parseFloat(match[1]);
        }
    }
    
    env.version = version;
    env.isCompatible =
        ((env.ie && version >= 6) ||
            (env.gecko && version >= 10801) ||
            (env.opera && version >= 9.5) ||
            (env.webkit && version >= 522) ||
            false);
    return env;
})();

export default env;