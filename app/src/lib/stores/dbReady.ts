import { writable } from 'svelte/store';
import { uuid } from '../utils/uuid.js';

export const dbReady = writable<boolean>(false);
export const sessionId = writable<string>(uuid());
