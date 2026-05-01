
export function downloadContent(content, { filename = "download.txt", type = 'text/plain' } = {}) {
    let url = URL.createObjectURL(new Blob([content], { type }))
    const a = document.createElement('a')
    a.href = url
    a.setAttribute("download", filename)
    a.click()
    URL.revokeObjectURL(url)
}


export function openContentWindow(content, { type } = {}, windowFeatures) {
    let blob = content instanceof Blob && type == undefined ? content : new Blob([content], { type: type ?? 'text/plain' })
    let url = URL.createObjectURL(blob)
    let win = window.open(url, '_blank', windowFeatures)
    if (win) {
        win.onload = () => URL.revokeObjectURL(url)
    } else {
        URL.revokeObjectURL(url)
    }
    return win
}

export const palettes = {
    Classic: ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF"],
    R4: ["#000000", "#DF536B", "#61D04F", "#2297E6", "#28E2E5", "#CD0BBC", "#F5C710", "#9E9E9E"],
    ggplot2: ["#000000", "#F8766D", "#00BA38", "#619CFF", "#00BFC4", "#F564E3", "#B79F00", "#9E9E9E"],
    OkabeIto: ["#000000", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#999999"],
    Accent: ["#7FC97F", "#BEAED4", "#FDC086", "#FFFF99", "#386CB0", "#F0027F", "#BF5B17", "#666666"],
    Dark2: ["#1B9E77", "#D95F02", "#7570B3", "#E7298A", "#66A61E", "#E6AB02", "#A6761D", "#666666"],
    Paired: ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00", "#CAB2D6", "#6A3D9A", "#FFFF99", "#B15928"],
    Pastel1: ["#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC", "#E5D8BD", "#FDDAEC", "#F2F2F2"],
    Pastel2: ["#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9", "#FFF2AE", "#F1E2CC", "#CCCCCC"],
    Set1: ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#FFFF33", "#A65628", "#F781BF", "#999999"],
    Set2: ["#66C2A5", "#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854", "#FFD92F", "#E5C494", "#B3B3B3"],
    Set3: ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#D9D9D9", "#BC80BD", "#CCEBC5", "#FFED6F"],
    Tableau10: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"],
    ClassicTableau: ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD", "#8C564B", "#E377C2", "#7F7F7F", "#BCBD22", "#17BECF"],
    Polychrome36: ["#5A5156", "#E4E1E3", "#F6222E", "#FE00FA", "#16FF32", "#3283FE", "#FEAF16", "#B00068", "#1CFFCE", "#90AD1C", "#2ED9FF", "#DEA0FD", "#AA0DFE", "#F8A19F", "#325A9B", "#C4451C", "#1C8356", "#85660D", "#B10DA1", "#FBE426", "#1CBE4F", "#FA0087", "#FC1CBF", "#F7E1A0", "#C075A6", "#782AB6", "#AAF400", "#BDCDFF", "#822E1C", "#B5EFB5", "#7ED7D1", "#1C7F93", "#D85FF7", "#683B79", "#66B0FF", "#3B00FB"],
    Alphabet: ["#AA0DFE", "#3283FE", "#85660D", "#782AB6", "#565656", "#1C8356", "#16FF32", "#F7E1A0", "#E2E2E2", "#1CBE4F", "#C4451C", "#DEA0FD", "#FE00FA", "#325A9B", "#FEAF16", "#F8A19F", "#90AD1C", "#F6222E", "#1CFFCE", "#2ED9FF", "#B10DA1", "#C075A6", "#FC1CBF", "#B00068", "#FBE426", "#FA0087"],
}

export function svg2svg(svgXml) {
    let svg = new DOMParser().parseFromString(
        '<?xml version="1.0" standalone="no"?>\r\n' + svgXml,
        "image/svg+xml"
    ).documentElement
    let style = document.createElement('style')
    style.textContent = `@media print { @page { size: ${svg.width.baseVal.value / 96}in ${svg.height.baseVal.value / 96}in; margin: 0; } }`
    svg.prepend(style)
    let xml = new XMLSerializer().serializeToString(svg)
    return new Blob([xml], { type: 'image/svg+xml' })
}

export function svg2png(svgXml, { dpi = 96 } = {}) {
    const { promise, resolve, reject } = Promise.withResolvers()
    const url = URL.createObjectURL(new Blob(['<?xml version="1.0" standalone="no"?>\r\n', svgXml], { type: 'image/svg+xml' }))
    const img = new Image()
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth * dpi / 96
            canvas.height = img.naturalHeight * dpi / 96
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            canvas.toBlob(blob => resolve(blob), 'image/png')
        } catch (e) {
            reject(new Error('Failed to convert SVG to PNG'))
        } finally {
            img.onload = img.onerror = null
            URL.revokeObjectURL(url)
        }
    }
    img.onerror = () => {
        img.onload = img.onerror = null
        URL.revokeObjectURL(url)
        reject(new Error('Failed to convert SVG to PNG'))
    }
    img.src = url
    return promise
}

import { jsPDF } from "jspdf"
import 'svg2pdf.js'

function segmentText(text) {
    function createTspan(content, fontFamily = "Noto Sans") {
        let tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan")
        tspan.textContent = content
        tspan.setAttribute("font-family", fontFamily)
        return tspan
    }
    let result = [], match, lastIndex = 0
    const regex = /((?<SC>[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+)|(?<White>\s+))/gu
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            result.push(createTspan(text.substring(lastIndex, match.index), "Noto Sans"))
        }
        for (const cate in match.groups) {
            if (match.groups[cate] == null) continue
            if (cate == "White") {
                if (result.length == 0) result.push(createTspan(match[0], "Noto Sans"))
                else result[result.length - 1].textContent += match[0]
            } else {
                result.push(createTspan(match[0], `Noto Sans ${cate}`))
            }
        }
        lastIndex = regex.lastIndex
        if (match.index === regex.lastIndex) regex.lastIndex++
    }
    if (lastIndex < text.length) result.push(createTspan(text.substring(lastIndex), "Noto Sans"))
    return result
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

async function cfetch(request) {
    if ('caches' in window) {
        const cache = await caches.open('font-assets')
        let response = await cache.match(request)
        if (response) return response
        response = await fetch(request)
        if (response.ok) await cache.put(request, response.clone())
        return response
    } else {
        return fetch(request)
    }
}

export async function svg2pdf(svgXml) {
    let svg = new DOMParser().parseFromString(
        '<?xml version="1.0" standalone="no"?>\r\n' + svgXml,
        "image/svg+xml"
    ).documentElement
    let g = document.createElementNS("http://www.w3.org/2000/svg", "g")
    while (svg.firstChild) {
        g.appendChild(svg.firstChild)
    }
    g.setAttribute("transform", "scale(0.75)")
    svg.appendChild(g)
    svg.setAttribute("width", svg.width.baseVal.value * 3 / 4)
    svg.setAttribute("height", svg.height.baseVal.value * 3 / 4)
    svg.setAttribute("viewBox", `0 0 ${svg.width.baseVal.value} ${svg.height.baseVal.value}`)
    const doc = new jsPDF({
        orientation: svg.width.baseVal.value >= svg.height.baseVal.value ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [svg.width.baseVal.value, svg.height.baseVal.value]
    })
    svg.querySelectorAll('text[dominant-baseline="central"], text[dominant-baseline="middle"]').forEach(el => {
        el.removeAttribute('dominant-baseline')
        el.setAttribute('dy', "0.35em")
    })
    const iter = document.createNodeIterator(svg, NodeFilter.SHOW_TEXT)
    let nodes = [], node
    while (node = iter.nextNode()) nodes.push(node)
    for (const node of nodes) {
        if (node.textContent.trim()) {
            node.replaceWith(...segmentText(node.textContent))
        }
    }
    function registerFont(name, url) {
        return cfetch(url).then(r => r.blob()).then(blobToBase64)
            .then(data => doc.addFileToVFS(name, data))
    }
    if (svg.querySelector('[font-family="Noto Sans"]')) {
        await registerFont('NotoSans-Regular.ttf', "/assets/fonts/NotoSans/NotoSans-Regular.ttf")
        await registerFont('NotoSans-Bold.ttf', "/assets/fonts/NotoSans/NotoSans-Bold.ttf")
        await registerFont('NotoSans-Italic.ttf', "/assets/fonts/NotoSans/NotoSans-Italic.ttf")
        await registerFont('NotoSans-BoldItalic.ttf', "/assets/fonts/NotoSans/NotoSans-BoldItalic.ttf")
        doc.addFont('NotoSans-Regular.ttf', 'Noto Sans', 'normal')
        doc.addFont('NotoSans-Bold.ttf', 'Noto Sans', 'bold')
        doc.addFont('NotoSans-Italic.ttf', 'Noto Sans', 'italic')
        doc.addFont('NotoSans-BoldItalic.ttf', 'Noto Sans', 'bolditalic')
    }
    if (svg.querySelector('[font-family="Noto Sans SC"]')) {
        await registerFont('NotoSansSC-Regular.ttf', "/assets/fonts/NotoSans/NotoSansSC-Regular.ttf")
        await registerFont('NotoSansSC-Bold.ttf', "/assets/fonts/NotoSans/NotoSansSC-Bold.ttf")
        doc.addFont('NotoSansSC-Regular.ttf', 'Noto Sans SC', 'normal')
        doc.addFont('NotoSansSC-Bold.ttf', 'Noto Sans SC', 'bold')
    }
    svg.querySelectorAll('[transform-origin]').forEach(el => {
        const originAttr = el.getAttribute('transform-origin').trim()
        const transformAttr = el.getAttribute('transform') || ''
        const coords = originAttr.split(/[\s,]+/).map(parseFloat)
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            const [ox, oy] = coords
            const newTransform = `translate(${ox}, ${oy}) ${transformAttr} translate(${-ox}, ${-oy})`
            el.setAttribute('transform', newTransform)
            el.removeAttribute('transform-origin')
            el.style.transformOrigin = ''
        }
    })
    await doc.svg(svg)
    svg = null
    return doc.output('blob')
}
