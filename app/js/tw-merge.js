import { twMerge } from 'tailwind-merge'
function mergeClassName(el) {
    if (!el.getAttribute('class')) return
    if (el.namespaceURI === 'http://www.w3.org/2000/svg') {
        el.setAttribute('class', twMerge(el.getAttribute('class') || ""))
    } else {
        el.className = twMerge(el.className)
    }
}
export default {
    mounted: mergeClassName, updated: mergeClassName
}
