<script setup lang="ts" generic="T extends Builds.PartType">
import type { Form } from '@nuxt/ui';
import type { Component } from 'vue';
import type { Builds } from '~/types/build';
import type { SpecsByPartType } from '~/types/parts';
import { PART_DEFAULTS } from '~/constants/part-defaults';
import { PART_SCHEMAS } from '~/constants/part-schemas';
import PartFormCase from './Case.vue';
import PartFormCooler from './Cooler.vue';
import PartFormCpu from './Cpu.vue';
import PartFormMemory from './Memory.vue';
import PartFormMotherboard from './Motherboard.vue';
import PartFormPsu from './Psu.vue';
import PartFormStorage from './Storage.vue';
import PartFormVideoCard from './VideoCard.vue';

const props = defineProps<{ type: T; part?: SpecsByPartType[T] }>();

const draft = defineModel<Partial<SpecsByPartType[T]>>({ required: true });

const FORMS: Record<Builds.PartType, Component> = {
	cpu: PartFormCpu,
	cooler: PartFormCooler,
	motherboard: PartFormMotherboard,
	memory: PartFormMemory,
	storage: PartFormStorage,
	video_card: PartFormVideoCard,
	case: PartFormCase,
	psu: PartFormPsu,
};

const form = useTemplateRef<Form<Partial<SpecsByPartType[T]>>>('form');

function reset(): void {
	draft.value = props.part
		? (cloneSpec(props.part) as Partial<SpecsByPartType[T]>)
		: (PART_DEFAULTS[props.type]() as Partial<SpecsByPartType[T]>);
}

watch(() => [props.type, props.part], reset, { immediate: true });

defineExpose({
	validate: async (): Promise<boolean> => {
		try {
			await form.value?.validate();
			return true;
		} catch {
			return false;
		}
	},
});
</script>

<template>
	<UForm ref="form" :schema="PART_SCHEMAS[type]" :state="draft" class="space-y-4" @submit.prevent>
		<component :is="FORMS[type]" v-model="draft" />
	</UForm>
</template>
