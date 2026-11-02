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
const ECL_EDGE_Y = 0.50      // where the arc meets the right edge, fraction of height
const ECL_EDGE_X = 0.52      // where it meets the bottom edge, fraction of width
const ECL_FLAT = 1.30        // higher = flatter arc, less of a round ball
const ECL_BAND = 0.34        // limb thickness, fraction of min(w,h)

const ECL_DOT_AREA = 2600    // one white mote per this many px of hero
const ECL_DOT_MAX = 700
const ECL_DOT_SPEED = [10, 42]   // px per second
const ECL_DOT_LIFE = [3.5, 10]   // seconds
const ECL_RIM = 2.2          // half-thickness of the bright edge line, px
