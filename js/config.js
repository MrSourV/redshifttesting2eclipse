// site config, edit these

const PLACE_ID = 85247362414047   // breakout
const GROUP_ID = 35408513         // breakout community

const DEV_ROLE_RANKS = [254, 100]   // group roles pulled into the dev list
const CREATOR_RANK = 254            // this rank shows as "Creator"
const DEV_LIMIT = 30                // max cards in the marquee

const LOADER_MIN_MS = 4200   // min time the loading screen stays up
const SLIDE_TIME_MS = 4000   // ms per hero bg image

const MARQUEE_MIN_S = 24     // slowest the dev marquee will scroll
const MARQUEE_STEP_S = 3.2   // extra seconds added per dev card

// eclipse (hero bottom-right)
const ECL_CELL = 3           // pixel block size, bigger = chunkier
const ECL_CX = 1.05          // circle center x, in screen widths
const ECL_CY = 1.26          // circle center y, in screen heights
const ECL_R = 0.445          // radius, as a fraction of the screen diagonal
const ECL_CORE = 16          // px inside the edge that stay solid
const ECL_SCATTER = 0.17     // dissolve band width, fraction of min(w,h)
const ECL_STARS = 0.05       // speck density just outside the band
const ECL_DUST = 0.0009      // faint speck density across the rest
const ECL_FPS = 30
