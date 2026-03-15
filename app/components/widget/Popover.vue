<script setup>
import { ref, computed, useTemplateRef, nextTick } from 'vue'
import { useWindowSize, useResizeObserver } from '@vueuse/core'
defineOptions({ inheritAttrs: false })
const {
    toplevel, mode, disabled, inline, align, side, offset, openDelay, closeDelay,
    variant, triggerClass,
    onToggleon, onToggleoff, onHover, onHoverend
} = defineProps({
    toplevel: { type: Boolean, default: false },
    mode: String,
    disabled: { type: Boolean, default: false },
    inline: { type: Boolean, default: false },
    align: { type: null, default: 'center' },
    side: { type: String, default: 'bottom' },
    offset: { type: Number, default: 0 },
    variant: String,
    triggerClass: null,
    openDelay: { type: Number, default: 100 },
    closeDelay: { type: Number, default: 300 },
    onToggleon: Function, onToggleoff: Function,
    onHover: Function, onHoverend: Function,
})
const dismissible = defineModel('dismissible', { type: Boolean, default: true })
const isOpen = ref(false)
const trigger = useTemplateRef('trigger')
const panel = useTemplateRef('panel')
const { width: containerWidth, height: containerHeight } = useWindowSize()
const panelStyle = ref({})
useResizeObserver(panel, () => {
    if (!isOpen.value || panel.value == null) return {}
    let { left, right, top, bottom, width, height } = trigger.value.getBoundingClientRect()
    let aln = { start: 0, center: 0.5, end: 1 }[align] ?? +align
    if (isNaN(aln)) aln = 0.5
    let l, r, t, b, maxw, maxh
    let panelside = side.replace(/!$/, ''), sideforce = true
    let remains = {
        top: top - offset - panel.value.scrollHeight,
        bottom: containerHeight.value - (bottom + offset + panel.value.scrollHeight),
        left: left - offset - panel.value.scrollWidth,
        right: containerWidth.value - (right + offset + panel.value.scrollWidth),
    }
    if (panelside == "auto") {
        panelside = Object.entries(remains).reduce((a, b) => a[1] > b[1] ? a : b)[0]
    } else if (panelside == "auto-v") {
        panelside = remains.top > remains.bottom ? "top" : "bottom"
    } else if (panelside == "auto-h") {
        panelside = remains.left > remains.right ? "left" : "right"
    } else {
        sideforce = side.endsWith('!')
    }
    if (panelside == "top" || panelside == "bottom") {
        let x = left + width * aln
        if (x < panel.value.scrollWidth * aln) {
            l = 0
            maxw = containerWidth.value
        } else if (x + panel.value.scrollWidth * (1 - aln) > containerWidth.value) {
            r = 0
            maxw = containerWidth.value
        } else if (aln <= 0.5) {
            l = x - panel.value.scrollWidth * aln
            maxw = containerWidth.value - l
        } else {
            r = containerWidth.value - x + panel.value.scrollWidth * (1 - aln)
            maxw = containerWidth.value - r
        }
        if (!sideforce) {
            if (remains.top <= 0 && remains.bottom <= 0) {
                panelside = containerHeight.value - bottom > top ? "bottom" : "top"
            } else if (panelside == "top" && remains.top <= 0) {
                panelside = "bottom"
            } else if (panelside == "bottom" && remains.bottom <= 0) {
                panelside = "top"
            }
        }
        if (panelside == "top") {
            b = containerHeight.value - top + offset
        } else if (panelside == "bottom") {
            t = bottom + offset
        }
        maxh = containerHeight.value - (b ?? 0) - (t ?? 0)
    } else if (panelside == "left" || panelside == "right") {
        let y = top + height * aln
        if (y < panel.value.scrollHeight * aln) {
            t = 0
            maxh = containerHeight.value
        } else if (y + panel.value.scrollHeight * (1 - aln) > containerHeight.value) {
            b = 0
            maxh = containerHeight.value
        } else if (aln <= 0.5) {
            t = y - panel.value.scrollHeight * aln
            maxh = containerHeight.value - t
        } else {
            b = containerHeight.value - y + panel.value.scrollHeight * (1 - aln)
            maxh = containerHeight.value - b
        }
        if (!sideforce) {
            if (remains.left <= 0 && remains.right <= 0) {
                panelside = containerWidth.value - right > left ? "right" : "left"
            } else if (panelside == "left" && remains.left <= 0) {
                panelside = "right"
            } else if (panelside == "right" && remains.right <= 0) {
                panelside = "left"
            }
        }
        if (panelside == "left") {
            r = containerWidth.value - left + offset
        } else if (panelside == "right") {
            l = right + offset
        }
        maxw = containerWidth.value - (l ?? 0) - (r ?? 0)
    }
    panelStyle.value = {
        left: l != null ? l + "px" : null,
        right: r != null ? r + "px" : null,
        top: t != null ? t + "px" : null,
        bottom: b != null ? b + "px" : null,
        'max-width': maxw != null ? maxw + "px" : null,
        'max-height': maxh != null ? maxh + "px" : null,
    }
})

const data = ref()
const emit = defineEmits(['hide', 'dismiss:pointerdown', 'dismiss:pointerup', 'dismiss:click', 'dismiss:contextmenu'])
let dismissing
function onClickOutsideHandler(e) {
    if (!dismissible || !isOpen.value) return
    if (
        panel.value && !panel.value.contains(e.target) &&
        trigger.value && !trigger.value.contains(e.target)
    ) {
        if (e.type == "click" || e.type == "contextmenu") hide("dismiss")
        emit("dismiss:" + e.type, e)
    }
}
async function show(payload) {
    isOpen.value = true
    for (let evt of ["click", "contextmenu", "pointerdown", "pointerup"])
        document.removeEventListener(evt, onClickOutsideHandler, { capture: true })
    await nextTick()
    data.value = payload
    dismissing?.resolve?.('override')
    dismissing = Promise.withResolvers()
    setTimeout(() => {
        for (let evt of ["click", "contextmenu", "pointerdown", "pointerup"])
            document.addEventListener(evt, onClickOutsideHandler, { capture: true })
    }, 0)
    return dismissing.promise
}
async function hide(message) {
    isOpen.value = false
    for (let evt of ["click", "contextmenu", "pointerdown", "pointerup"])
        document.removeEventListener(evt, onClickOutsideHandler, { capture: true })
    if (dismissing) dismissing.resolve(message)
    emit('hide', message)
    dismissing = null
}
async function toggle(force, val) {
    if (force == null ? !isOpen.value : !!force) {
        return show(val)
    } else {
        return hide(val)
    }
}
let timer0, timer
function ontriggerenter() {
    if (timer0) clearTimeout(timer0)
    if (timer) clearTimeout(timer)
    if (disabled) return
    let handlers = onHover
    if (handlers != null) {
        if (!Array.isArray(handlers)) handlers = [handlers]
        timer0 = setTimeout(() => handlers.forEach(f => f?.()), openDelay)
    } else if (mode == "hover" || mode == null && inline) {
        timer0 = setTimeout(() => show(), openDelay)
    }
}
function onenter() {
    if (timer) clearTimeout(timer)
}
function onleave() {
    if (timer0) clearTimeout(timer0)
    if (disabled) return
    let handlers = onHoverend
    if (handlers != null) {
        if (!Array.isArray(handlers)) handlers = [handlers]
        timer = setTimeout(() => handlers.forEach(f => f?.()), closeDelay)
    } else if (mode == "hover" || mode == null && inline) {
        timer = setTimeout(() => hide("dismiss"), closeDelay)
    }
}
function ontriggerclick(e) {
    if (disabled || e.handled) return
    setTimeout(() => {
        if (!isOpen.value) {
            if (!window.getSelection().isCollapsed) return
            let el = document.activeElement
            if (['INPUT', 'TEXTAREA'].includes(el.tagName) && el.selectionStart !== el.selectionEnd) return
        }
        if (emitEvent(isOpen.value ? onToggleoff : onToggleon, e)) return
        if (mode == "click" || mode == null && !inline) {
            if (isOpen.value) {
                hide("dismiss")
            } else {
                show()
            }
        }
    }, 0);
}
function emitEvent(handlers, ...args) {
    if (Array.isArray(handlers)) {
        handlers = handlers.filter(h => typeof h === "function")
        if (handlers.length === 0) return false
        handlers.forEach(h => h(...args))
        return true
    }
    if (typeof handlers !== "function") return false
    handlers(...args)
    return true
}
const scope = ref({
    get dismissible() { return dismissible.value },
    set dismissible(v) { dismissible.value = v },
    get data() { return data.value },
    set data(v) { data.value = v },
})
const className = computed(() => [
    "fixed max-w-full overflow-auto bg-white border border-gray-300 z-40",
    variant == "tooltip" ? "px-2 py-1 rounded-lg text-sm text-current/75 pointer-events-none font-normal" : "",
    variant == "contextmenu" ? "py-1 rounded-xl flex flex-col" : "",
    variant == null && inline ? "px-2 rounded-lg" : "",
    variant == null && !inline ? "p-4 rounded-xl" : "",
    toplevel ? "z-50" : "",
])
const triggerClassName = computed(() => [
    mode == "click" || mode == null && !inline ? "cursor-pointer" : "",
    inline ? "inline-block" : "",
    triggerClass
])
</script>
<template>
    <component :is="inline ? 'span' : 'div'" ref="trigger" :class="triggerClassName" @mouseenter="ontriggerenter"
        @mouseleave="onleave" @click="ontriggerclick">
        <slot name="trigger" v-bind="{ scope, toggle, show, hide, isOpen, dismissible, data }"></slot>
    </component>
    <Teleport to="body" :disabled="!toplevel">
        <Transition enter-from-class="opacity-0" enter-active-class="transition-opacity duration-200">
            <div ref="panel" v-if="isOpen" :class="className" :style="panelStyle" v-bind="$attrs" @mouseenter="onenter"
                @mouseleave="onleave" v-tw-merge>
                <slot v-bind="{ scope, toggle, show, hide, dismissible, data }"></slot>
            </div>
        </Transition>
    </Teleport>
</template>
