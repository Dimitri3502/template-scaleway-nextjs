import { common } from "./fr/common";
import { errors } from "./fr/errors";
import { landing } from "./fr/landing";
import { notes } from "./fr/notes";
import { pwa } from "./fr/pwa";
import { time } from "./fr/time";

export const fr = {
  ...common,
  ...landing,
  ...notes,
  ...errors,
  ...time,
  ...pwa,
} as const;
