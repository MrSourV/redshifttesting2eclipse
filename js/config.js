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
const ECL_CELL = 2           // dither block size in px, smaller = finer
const ECL_EDGE_X = 0.45      // boundary meets the bottom edge here, fraction of width
const ECL_EDGE_Y = 0.43      // and the right edge here, fraction of height
const ECL_FLAT = 2.42        // higher = flatter sweep, less of a round ball
const ECL_FADE = 0.072       // how fast the red dies off going out, fraction of width
const ECL_REACH = 0.047      // how far motes drift into the dark, fraction of width
const ECL_RIM = 2.6          // half-thickness of the bright edge line, px
const ECL_RIM_RGB = [255, 206, 196]

const ECL_DOT_AREA = 430     // one mote per this many px of hero
const ECL_DOT_MAX = 4200
const ECL_DOT_R = [0.45, 1.25]   // mote radius range, px
const ECL_DOT_SPEED = [9, 30]    // px per second
const ECL_DOT_LEVELS = 7         // brightness buckets, for batched drawing
