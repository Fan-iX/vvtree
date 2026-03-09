<script setup>
import { ref, computed, useTemplateRef, nextTick } from 'vue'
import { useWindowSize } from '@vueuse/core'
defineOptions({ inheritAttrs: false })
const {
    mode, disabled, dismissible, align, side, offset, openDelay, closeDelay, triggerClass, label,
    onToggleon, onToggleoff, onHover, onHoverend
} = defineProps({
    mode: { String, default: 'hover' },
    disabled: { type: Boolean, default: false },
    dismissible: { type: Boolean, default: true },
    align: { type: null, default: 'start' },
    side: { type: String, default: 'right' },
    offset: { type: Number, default: 0 },
    openDelay: { type: Number, default: 100 },
    closeDelay: { type: Number, default: 100 },
    label: String,
    triggerClass: String,
    onToggleon: Function, onToggleoff: Function,
    onHover: Function, onHoverend: Function,
})
const isOpen = ref(false)
const triggerRef = useTemplateRef('trigger')
const panelRef = useTemplateRef('panel')
const { width: containerWidth, height: containerHeight } = useWindowSize()
const panelStyle = ref({})
const data = ref()
const emit = defineEmits(['hide', 'dismiss:pointerdown', 'dismiss:pointerup', 'dismiss:click', 'dismiss:contextmenu'])
let dismissing
function onClickOutsideHandler(e) {
    if (!dismissible || !isOpen.value) return
    if (
        panelRef.value && !panelRef.value.contains(e.target) &&
        triggerRef.value && !triggerRef.value.contains(e.target)
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
    if (panelRef.value == null) return
    data.value = payload
    dismissing?.resolve?.('override')
    dismissing = Promise.withResolvers()
    let { left, right, top, bottom, width, height } = triggerRef.value.getBoundingClientRect()
    let aln = { start: 0, center: 0.5, end: 1 }[align] ?? +align
    if (isNaN(aln)) aln = 0.5
    let l, r, t, b
    let panelside = side
    if (panelside == "top" || panelside == "bottom") {
        if (align == "end") {
            let x = left + width
            if (x - panelRef.value.scrollWidth < 0) l = 0
            else r = x
        } else {
            let x = left
            if (x + panelRef.value.scrollWidth > containerWidth.value) r = 0
            else l = x
        }
        let topAvailable = top - offset - panelRef.value.scrollHeight > 0
        let bottomAvailable = bottom + offset + panelRef.value.scrollHeight < containerHeight.value
        if (!topAvailable && !bottomAvailable) {
            panelside = containerHeight.value - bottom > top ? "bottom" : "top"
        } else if (panelside == "top" && !topAvailable) {
            panelside = "bottom"
        } else if (panelside == "bottom" && !bottomAvailable) {
            panelside = "top"
        }
        if (panelside == "top") {
            b = containerHeight.value - top + offset
        } else if (panelside == "bottom") {
            t = bottom + offset
        }
    } else if (panelside == "left" || panelside == "right") {
        if (align == "end") {
            let y = top + height
            if (y - panelRef.value.scrollHeight < 0) t = 0
            else b = y
        } else {
            let y = top
            if (y + panelRef.value.scrollHeight > containerHeight.value) b = 0
            else t = y
        }
        let leftAvailable = left - offset - panelRef.value.scrollWidth > 0
        let rightAvailable = right + offset + panelRef.value.scrollWidth < containerWidth.value
        if (!leftAvailable && !rightAvailable) {
            panelside = containerWidth.value - right > left ? "right" : "left"
        } else if (panelside == "left" && !leftAvailable) {
            panelside = "right"
        } else if (panelside == "right" && !rightAvailable) {
            panelside = "left"
        }
        if (panelside == "left") {
            r = containerWidth.value - left + offset
        } else {
            l = right + offset
        }
    }
    let maxw = containerWidth.value - (l ?? 0) - (r ?? 0),
        maxh = containerHeight.value - (t ?? 0) - (b ?? 0)
    panelStyle.value = {
        left: l != null ? l + "px" : null,
        right: r != null ? r + "px" : null,
        top: t != null ? t + "px" : null,
        bottom: b != null ? b + "px" : null,
        'max-width': maxw != null ? maxw + "px" : null,
        'max-height': maxh != null ? maxh + "px" : null,
    }
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
    } else if (mode == "hover") {
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
    } else if (mode == "hover") {
        timer = setTimeout(() => hide("dismiss"), closeDelay)
    }
}
function ontriggerclick() {
    if (disabled) return
    let handlers = isOpen.value ? onToggleoff : onToggleon
    if (handlers != null) {
        if (Array.isArray(handlers)) {
            handlers.forEach(f => f?.())
        } else {
            handlers?.()
        }
    } else if (mode == "click") {
        if (isOpen.value) {
            hide("dismiss")
        } else {
            show()
        }
    }
}
defineExpose({ toggle, show, hide, data, isOpen })
const btnClassName = computed(() => [
    "block whitespace-nowrap cursor-default px-2 py-1 text-left relative",
    disabled ? "text-gray-400" : "hover:bg-gray-100",
    triggerClass
])
const className = computed(() => [
    "fixed overflow-auto bg-white border border-gray-300 z-50 rounded-xl",
    "p-1 flex flex-col",
])
</script>
<template>
    <button ref="trigger" @mouseenter="ontriggerenter" @mouseleave="onleave" @click="ontriggerclick"
        :class="btnClassName" v-tw-merge>
        <slot name="trigger" v-bind="{ toggle, show, hide, isOpen, data }">
            {{ label }}
        </slot>
        <div class="absolute right-1 top-0 bottom-0 flex items-center">
            <Icon icon="lucide:chevron-right" />
        </div>
    </button>
    <transition enter-from-class="opacity-0" enter-active-class="transition-opacity duration-200">
        <div ref="panel" v-if="isOpen" v-bind="$attrs" :class="className" :style="panelStyle" @mouseenter="onenter"
            @mouseleave="onleave" v-tw-merge>
            <slot v-bind="{ toggle, show, hide, data }"></slot>
        </div>
    </transition>
</template>
