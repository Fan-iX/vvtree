<script setup>
import { computed, watch, nextTick, useTemplateRef, inject, ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'
defineOptions({ inheritAttrs: false })
const { title, contentClass } = defineProps({
    title: String, contentClass: String
})
const open = defineModel('open', { type: Boolean })
const fold = defineModel('fold', { type: Boolean, default: false })
const top = defineModel('top', { type: Number, default: 20 })
const left = defineModel('left', { type: Number, default: 20 })
const width = defineModel('width', { type: Number, default: 200 })
const height = defineModel('height', { type: Number, default: 200 })
const className = computed(() => [
    "fixed bg-white rounded-lg border border-gray-300 shadow-lg overflow-auto flex flex-col outline-none pointer-events-auto",
    fold.value ? "resize-x" : "resize",
])
watch(open, v => nextTick(() => { if (v) panel.value.focus() }))
const zMax = inject('panel-z-max', ref(0))
const zIndex = ref(zMax?.value ?? 0)
const style = computed(() => ({
    left: left.value != null ? left.value + "px" : null,
    top: top.value != null ? top.value + "px" : null,
    width: width.value != null ? width.value + "px" : null,
    height: !fold.value && height.value != null ? height.value + "px" : null,
    'z-index': zIndex.value,
}))
const panel = useTemplateRef('panel')
function onpointerdown(e) {
    e.preventDefault()
    e.target.setPointerCapture(e.pointerId)

    e.target.onpointermove = (ev) => {
        panel.value.style.opacity = 0.8
        let l = left.value + ev.movementX, t = top.value + ev.movementY
        l = Math.min(Math.max(l, 40 - width.value), window.innerWidth - 40)
        t = Math.min(Math.max(t, 0), window.innerHeight - 40)
        left.value = l
        top.value = t
    }
    e.target.onpointerup = (ev) => {
        ev.currentTarget.onpointerup = null
        ev.currentTarget.onpointermove = null
        panel.value.style.opacity = null
    }
}
useResizeObserver(panel, (entries) => {
    const entry = entries[0]
    width.value = entry.target.offsetWidth
    if (!fold.value) height.value = entry.target.offsetHeight
})
const emit = defineEmits(['hide'])
function hide() {
    open.value = false
    emit('hide')
}
</script>
<template>
    <Teleport to="#panel-container" v-if="open">
        <div :class="className" v-bind="$attrs" :style ref="panel" @focus="zIndex = ++zMax" tabindex="-1" v-tw-merge>
            <div ref="header" class="px-2 py-1 cursor-move border-b border-gray-400" @pointerdown="onpointerdown">
                <slot name="caption">
                    <div class="flex items-center justify-between">
                        <slot name="title">
                            <div class="font-semibold">{{ title }}</div>
                        </slot>
                        <span class="flex space-x-2">
                            <button class="text-lg hover:bg-gray-200 rounded-md cursor-default px-1 py-1"
                                @click="fold = !fold">
                                <Icon icon="lucide:minus" />
                            </button>
                            <button class="text-lg hover:bg-gray-200 rounded-md cursor-default px-1 py-1" @click="hide">
                                <Icon icon="lucide:x" />
                            </button>
                        </span>
                    </div>
                </slot>
            </div>
            <div class="px-2 py-1 flex-1 overflow-auto" :class="contentClass" v-show="!fold" v-tw-merge>
                <slot></slot>
            </div>
        </div>
    </Teleport>
</template>
