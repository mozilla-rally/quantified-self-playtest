import DisplayStory from './Display.svelte';
import Namespace01Story from './NamespaceGrid01.svelte';
export default {
    title: "Rally Study 01 Inspector",
};

export const Namespace01 = () => ({
    Component: Namespace01Story
})

export const Display = () => ({
    Component: DisplayStory,
  });