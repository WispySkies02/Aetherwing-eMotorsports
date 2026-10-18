// Explicit release preparation. Never applied by public API reads.
import reviewed from '../data/confirmed-racing-updates.json' with {type:'json'};
import {prepareConfirmedRacingUpdates as prepare} from '../../public/admin/racing-updates.mjs';
export const prepareConfirmedRacingUpdates=publication=>prepare(publication,reviewed);
