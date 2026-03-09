<script setup>
import { ref, computed, useTemplateRef, nextTick } from 'vue'
import { useMouse, useWindowSize } from '@vueuse/core'
defineOptions({ inheritAttrs: false })
const { dismissible, align, side, offset, delay } = defineProps({
    dismissible: { type: Boolean, default: true },
    side: { type: String, default: 'right' },
    align: { type: String, default: 'start' },
    offset: { type: Number, default: 1 },
    delay: { type: Number, default: 300 },
})
const emit = defineEmits(['hoverend', 'hide', 'dismiss:pointerdown', 'dismiss:pointerup', 'dismiss:click', 'dismiss:contextmenu', 'dismiss:singleclick'])
const isOpen = ref(false)
const panelRef = useTemplateRef('panel')
const { x: mouseX, y: mouseY } = useMouse()
const { width: containerWidth, height: containerHeight } = useWindowSize()
const panelStyle = ref({})
const data = ref()
let dismissing
function onClickOutsideHandler(e) {
    if (!dismissible || !isOpen.value) return
    if (panelRef.value && !panelRef.value.contains(e.target)) {
        if (e.type == "click" || e.type == "contextmenu") hide("dismiss")
        emit("dismiss:" + e.type, e)
    }
}
async function show(payload) {
    data.value = payload
    isOpen.value = true
    for (let evt of ["click", "contextmenu", "pointerdown", "pointerup", "singleclick"])
        document.removeEventListener(evt, onClickOutsideHandler, { capture: true })
    await nextTick()
    if (panelRef.value == null) return
    dismissing?.resolve?.('override')
    dismissing = Promise.withResolvers()
    let left = mouseX.value, top = mouseY.value
    let l, r, t, b
    let panelside = side
    if (panelside == "top" || panelside == "bottom") {
        let x = left
        if (align == "end") {
            if (x - panelRef.value.scrollWidth < 0) l = 0
            else r = x
        } else {
            if (x + panelRef.value.scrollWidth > containerWidth.value) r = 0
            else l = x
        }
        let topAvailable = top - offset - panelRef.value.scrollHeight > 0
        let bottomAvailable = top + offset + panelRef.value.scrollHeight < containerHeight.value
        if (!topAvailable && !bottomAvailable) {
            panelside = containerHeight.value - top > top ? "bottom" : "top"
        } else if (panelside == "top" && !topAvailable) {
            panelside = "bottom"
        } else if (panelside == "bottom" && !bottomAvailable) {
            panelside = "top"
        }
        if (panelside == "top") {
            b = containerHeight.value - top + offset
        } else if (panelside == "bottom") {
            t = top + offset
        }
    } else if (panelside == "left" || panelside == "right") {
        let y = top
        if (align == "end") {
            if (y - panelRef.value.scrollHeight < 0) t = 0
            else b = y
        } else {
            if (y + panelRef.value.scrollHeight > containerHeight.value) b = 0
            else t = y
        }
        let leftAvailable = left - offset - panelRef.value.scrollWidth > 0
        let rightAvailable = left + offset + panelRef.value.scrollWidth < containerWidth.value
        if (!leftAvailable && !rightAvailable) {
            panelside = containerWidth.value - left > left ? "right" : "left"
        } else if (panelside == "left" && !leftAvailable) {
            panelside = "right"
        } else if (panelside == "right" && !rightAvailable) {
            panelside = "left"
        }
        if (panelside == "left") {
            r = containerWidth.value - left + offset
        } else if (panelside == "right") {
            l = left + offset
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
        for (let evt of ["click", "contextmenu", "pointerdown", "pointerup", "singleclick"])
            document.addEventListener(evt, onClickOutsideHandler, { capture: true })
    }, 0)
    return dismissing.promise
}
async function hide(message) {
    isOpen.value = false
    for (let evt of ["click", "contextmenu", "pointerdown", "pointerup", "singleclick"])
        document.removeEventListener(evt, onClickOutsideHandler, { capture: true })
    if (dismissing) dismissing.resolve(message)
    emit('hide', message)
    dismissing = null
}
async function toggle(force, payloadOrMessage) {
    if (force == null ? !isOpen.value : !!force) {
        return show(payloadOrMessage)
    } else {
        return hide(payloadOrMessage)
    }
}
let timer
function onenter() {
    if (timer) clearTimeout(timer)
}
function onleave() {
    timer = setTimeout(() => emit('hoverend'), delay)
}
defineExpose({ toggle, show, hide, data, isOpen })
const className = computed(() => [
    "fixed overflow-auto bg-white border border-gray-300 rounded-xl z-50",
    "p-1 flex flex-col",
])
</script>
<template>
    <Teleport to="body">
        <Transition enter-from-class="opacity-0" enter-active-class="transition-opacity duration-200">
            <div ref="panel" v-if="isOpen" :style="panelStyle" @mouseenter="onenter" @mouseleave="onleave"
                :class="className" v-bind="$attrs" v-tw-merge>
                <slot v-bind="{ toggle, show, hide, data }"></slot>
            </div>
        </Transition>
    </Teleport>
</template>
