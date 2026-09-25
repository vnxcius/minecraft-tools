import type { Language } from "../current";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";

export type MessageKey = keyof typeof en;
/** a full translation: the type check fails when a language misses a key */
export type Messages = Record<MessageKey, string>;

export const MESSAGES: Record<Language, Messages> = { en, "pt-BR": ptBR, es };
