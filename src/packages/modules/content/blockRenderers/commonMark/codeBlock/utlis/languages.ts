
import { LanguageFn } from 'highlight.js'
import javascript  from 'highlight.js/lib/languages/javascript'
import apache from 'highlight.js/lib/languages/apache'
import bash from 'highlight.js/lib/languages/bash'
import shell from 'highlight.js/lib/languages/shell'
import csharp from 'highlight.js/lib/languages/csharp'
import cpp from 'highlight.js/lib/languages/cpp'
import css from 'highlight.js/lib/languages/css'
import typescript from 'highlight.js/lib/languages/taggerscript'
import diff from 'highlight.js/lib/languages/diff'
import xml from 'highlight.js/lib/languages/xml'
import http from 'highlight.js/lib/languages/http'
import ini from 'highlight.js/lib/languages/ini'
import json from 'highlight.js/lib/languages/json'
import java from 'highlight.js/lib/languages/java'
import makefile from 'highlight.js/lib/languages/makefile'
import markdown from 'highlight.js/lib/languages/markdown'
import nginx from 'highlight.js/lib/languages/nginx'
import objectivec from 'highlight.js/lib/languages/objectivec'
import php from 'highlight.js/lib/languages/php'
import perl from 'highlight.js/lib/languages/perl'
import properties from 'highlight.js/lib/languages/properties'
import python from 'highlight.js/lib/languages/python'
import ruby from 'highlight.js/lib/languages/ruby'
import sql from 'highlight.js/lib/languages/sql'
import powershell from 'highlight.js/lib/languages/powershell'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import go from 'highlight.js/lib/languages/go'
import latex from 'highlight.js/lib/languages/latex'
import yaml from 'highlight.js/lib/languages/yaml'

export const Languages:{[key:string]:LanguageFn} = {
    javascript,
    apache,
    bash,
    shell,
    csharp,
    cpp,
    css,
    typescript,
    diff,
    xml,
    http,
    ini,
    json,
    java,
    makefile,
    markdown,
    nginx,
    objectivec,
    php,
    perl,
    properties,
    python,
    ruby,
    sql,
    powershell,
    swift,
    kotlin,
    go,
    latex,
    yaml
}
