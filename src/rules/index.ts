import type { Rule } from "@/types";
import { inpCallbackYieldRule } from "./inp-callback-yield";
import { inpHeavyLoopsRule } from "./inp-heavy-loop";

export const rules: Rule[] = [inpHeavyLoopsRule, inpCallbackYieldRule];
