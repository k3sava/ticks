# Reasoning + chain audit

Generated 2026-05-07 from `data.json`. Findings are sorted by tick weight (downstream reach in the unlocks graph) so the most-load-bearing issues come first. Top 50 of each class shown.

## Summary

- 2,648 ticks total
- Missing `detail`: 0
- Short `detail` (< 80 chars): 148
- No causal language in detail: 2184
- No source links: 0
- Missing domain: 0
- Parent dated AFTER child (chain inconsistency): 131
- Self-referential unlocks: 0
- Isolated (no parents, no children): 0

## What "no causal language" flags

Detail text without any of: `led to`, `leads to`, `made possible`, `enabled`, `enables`, `because`, `so that`, `cascades`, `cascade`, `downstream`, `unlocked`, `unlocks`, `made it possible`, `without this`, `from here`, `after this`.
A tick can still be well-written without these words, but the absence is a signal worth reviewing — the user wants explicit "this led to that" reasoning per tick.

## Parent dated after child (highest priority — these break the chain logic)

- `arpanet-email-precursor` (1969 AD) lists `arpa-first-email-tomlinson-and-symbol` (1971 AD) as a parent — parent is more recent than child.
- `papyrus-scrolls-lightweight-portable-writing-surface` (3,000 BC) lists `alphabetic-writing-phoenician` (1050 BC) as a parent — parent is more recent than child.
- `braille-system-standardized` (1837 AD) lists `rogets-thesaurus-organized-vocabulary` (1852 AD) as a parent — parent is more recent than child.
- `conceptual-art-dematerialization` (1968 AD) lists `arpa-first-email-tomlinson-and-symbol` (1971 AD) as a parent — parent is more recent than child.
- `epic-of-gilgamesh-first-narrative-literature` (2100 BC) lists `akkadian-as-first-lingua-franca` (2000 BC) as a parent — parent is more recent than child.
- `rice-domestication-yangtze-valley` (7,000 BC) lists `sheep-domestication-wool-production` (6,000 BC) as a parent — parent is more recent than child.
- `champollion-deciphers-hieroglyphics-rosetta-stone` (1822 AD) lists `braille-system-invented` (1824 AD) as a parent — parent is more recent than child.
- `nuclear-magnetic-resonance-discovered` (1938 AD) lists `nuclear-fission-hahn-and-strassmann-meitner` (1939 AD) as a parent — parent is more recent than child.
- `telescope-as-scientific-instrument-galileo` (1609 AD) lists `experimental-method-bacon` (1620 AD) as a parent — parent is more recent than child.
- `microprocessor-intel-4004` (1971 AD) lists `c-programming-language-ritchie` (1972 AD) as a parent — parent is more recent than child.
- `kidney-dialysis-machine-kolff-artificial-organ` (1943 AD) lists `rem-sleep-discovery` (1953 AD) as a parent — parent is more recent than child.
- `kidney-dialysis-machine-kolff-artificial-organ` (1943 AD) lists `first-open-heart-surgery-gibbon` (1953 AD) as a parent — parent is more recent than child.
- `kidney-dialysis-machine-kolff-artificial-organ` (1943 AD) lists `dna-double-helix-watson-crick-franklin` (1953 AD) as a parent — parent is more recent than child.
- `kidney-dialysis-machine-kolff-artificial-organ` (1943 AD) lists `genetic-code-protein-synthesis-cricks-central-dogma` (1953 AD) as a parent — parent is more recent than child.
- `kidney-dialysis-machine-kolff-artificial-organ` (1943 AD) lists `miller-urey-experiment-origin-of-life-chemistry` (1953 AD) as a parent — parent is more recent than child.
- `kidney-dialysis-machine-kolff-artificial-organ` (1943 AD) lists `blalock-taussig-shunt-pediatric-heart-surgery` (1944 AD) as a parent — parent is more recent than child.
- `kelvin-absolute-temperature-thermodynamics` (1848 AD) lists `second-law-of-thermodynamics-clausius-kelvin` (1850 AD) as a parent — parent is more recent than child.
- `ugaritic-alphabet-simplified-writing` (1400 BC) lists `polyphonic-music-notre-dame-school` (1170 AD) as a parent — parent is more recent than child.
- `sundial-first-time-measurement-instrument` (1600 BC) lists `money-as-abstract-exchange-medium` (600 BC) as a parent — parent is more recent than child.
- `the-sceptical-chymist-boyle` (1661 AD) lists `boyles-law-gas-pressure-and-volume` (1662 AD) as a parent — parent is more recent than child.
- `proto-indo-european-reconstruction-bopp` (1816 AD) lists `champollion-deciphers-hieroglyphics-rosetta-stone` (1822 AD) as a parent — parent is more recent than child.
- `proto-indo-european-reconstruction-bopp` (1816 AD) lists `braille-system-invented` (1824 AD) as a parent — parent is more recent than child.
- `youtube-video-democratized` (2005 AD) lists `facebooks-news-feed-algorithmic-social-curation` (2006 AD) as a parent — parent is more recent than child.
- `thalidomide-disaster-drug-safety-regulation` (1961 AD) lists `restriction-enzymes-discovered` (1970 AD) as a parent — parent is more recent than child.
- `church-turing-thesis-what-computation-is` (1936 AD) lists `shannons-information-theory` (1948 AD) as a parent — parent is more recent than child.
- `punctuated-equilibrium-gould-eldredge` (1972 AD) lists `endorphins-endogenous-opioids-discovered` (1975 AD) as a parent — parent is more recent than child.
- `optics-and-experiment-ibn-al-haytham` (1000 AD) lists `canon-of-medicine-avicenna` (1025 AD) as a parent — parent is more recent than child.
- `international-postal-union-global-mail-system` (1874 AD) lists `international-phonetic-alphabet` (1888 AD) as a parent — parent is more recent than child.
- `human-anatomy-vesalius` (1543 AD) lists `ambroise-par-wound-treatment-reform` (1545 AD) as a parent — parent is more recent than child.
- `logarithms-napier` (1614 AD) lists `experimental-method-bacon` (1620 AD) as a parent — parent is more recent than child.
- `market-for-lemons-information-asymmetry-akerlof` (1970 AD) lists `c-programming-language-ritchie` (1972 AD) as a parent — parent is more recent than child.
- `al-zahrawi-surgical-instruments-and-techniques` (980 AD) lists `canon-of-medicine-avicenna` (1025 AD) as a parent — parent is more recent than child.
- `aquinas-five-ways-proving-gods-existence` (1265 AD) lists `aquinas-synthesis-faith-and-reason` (1270 AD) as a parent — parent is more recent than child.
- `greek-polis-city-as-political-community` (700 BC) lists `money-as-abstract-exchange-medium` (600 BC) as a parent — parent is more recent than child.
- `egyptian-canon-artistic-proportion-system` (2500 BC) lists `epic-of-gilgamesh-first-narrative-literature` (2100 BC) as a parent — parent is more recent than child.
- `gothic-novel-horror-as-literary-genre` (1764 AD) lists `comparative-linguistics-sir-william-jones` (1786 AD) as a parent — parent is more recent than child.
- `kidney-transplant-long-term-success` (1954 AD) lists `cardiac-pacemaker-implantable` (1958 AD) as a parent — parent is more recent than child.
- `kidney-transplant-long-term-success` (1954 AD) lists `the-pill-oral-contraceptive` (1960 AD) as a parent — parent is more recent than child.
- `kidney-transplant-long-term-success` (1954 AD) lists `restriction-enzymes-discovered` (1970 AD) as a parent — parent is more recent than child.
- `kidney-transplant-long-term-success` (1954 AD) lists `leakeys-olduvai-gorge-discoveries-human-origins-in-africa` (1959 AD) as a parent — parent is more recent than child.
- `kidney-transplant-long-term-success` (1954 AD) lists `thalidomide-disaster-drug-safety-regulation` (1961 AD) as a parent — parent is more recent than child.
- `olympic-games-pan-hellenic-identity` (776 BC) lists `siege-warfare-formalized-assyrian` (700 BC) as a parent — parent is more recent than child.
- `olympic-games-pan-hellenic-identity` (776 BC) lists `money-as-abstract-exchange-medium` (600 BC) as a parent — parent is more recent than child.
- `luthers-95-theses-reformation` (1517 AD) lists `diplomatic-correspondence-in-italian-lingua-franca` (1600 AD) as a parent — parent is more recent than child.
- `luthers-95-theses-reformation` (1517 AD) lists `pike-and-shot-formation` (1534 AD) as a parent — parent is more recent than child.
- `von-neumann-architecture-stored-program-computing` (1945 AD) lists `eniac-first-general-purpose-electronic-computer` (1946 AD) as a parent — parent is more recent than child.
- `gmail-free-1gb-email-changes-expectations` (2004 AD) lists `facebooks-news-feed-algorithmic-social-curation` (2006 AD) as a parent — parent is more recent than child.
- `first-website-goes-live-cern` (1991 AD) lists `implicit-association-test-iat` (1998 AD) as a parent — parent is more recent than child.
- `roman-roads` (312 BC) lists `pyrrhic-victory-cost-of-tactical-success` (280 BC) as a parent — parent is more recent than child.
- `roman-roads` (312 BC) lists `roman-manipular-legion` (264 BC) as a parent — parent is more recent than child.

## Missing detail (highest weight first)

_None._

## Short detail (< 80 chars)

- `cuneiform-writing` · **3,400 BC** · Cuneiform writing (language, weight 79)
- `babylonian-quadratic-equations` · **1,770 BC** · Babylonian quadratic equations (philosophy, weight 68)
- `alphabetic-writing-phoenician` · **1050 BC** · Alphabetic writing (Phoenician) (language, weight 61)
- `archimedes-statics-and-buoyancy` · **250 BC** · Archimedes / statics and buoyancy (physics, weight 60)
- `loom-weaving` · **5,000 BC** · Loom weaving (economics, weight 54)
- `penny-press-mass-market-newspaper` · **1833 AD** · Penny press (mass-market newspaper) (language, weight 52)
- `pyramid-construction` · **2,600 BC** · Pyramid construction (art, weight 49)
- `gutenbergs-printing-press` · **1440 AD** · Gutenberg's printing press (language, weight 49)
- `w-and-z-bosons-discovered-cern` · **1983 AD** · W and Z bosons discovered (CERN) (physics, weight 49)
- `paper-cai-lun-han-dynasty` · **105 AD** · Paper (Cai Lun, Han Dynasty) (language, weight 48)
- `the-wheel` · **3,500 BC** · The wheel (economics, weight 47)
- `telescope-as-scientific-instrument-galileo` · **1609 AD** · Telescope as scientific instrument (Galileo) (philosophy, weight 46)
- `the-feminine-mystique-betty-friedan` · **1963 AD** · The Feminine Mystique (Betty Friedan) (philosophy, weight 46)
- `algebra-al-khwarizmi` · **820 AD** · Algebra (al-Khwarizmi) (philosophy, weight 45)
- `microprocessor-intel-4004` · **1971 AD** · Microprocessor (Intel 4004) (computing, weight 45)
- `city-state-governance` · **3,000 BC** · City-state governance (law, weight 44)
- `confucianism` · **551 BC** · Confucianism (philosophy, weight 44)
- `unix-operating-system` · **1969 AD** · Unix operating system (computing, weight 42)
- `the-sceptical-chymist-boyle` · **1661 AD** · The Sceptical Chymist (Boyle) (physics, weight 41)
- `proto-indo-european-reconstruction-bopp` · **1816 AD** · Proto-Indo-European reconstruction (Bopp) (language, weight 41)
- `pre-socratic-natural-philosophy` · **580 BC** · Pre-Socratic natural philosophy (philosophy, weight 40)
- `first-open-heart-surgery-gibbon` · **1953 AD** · First open-heart surgery (Gibbon) (medicine, weight 40)
- `set-theory-cantor` · **1874 AD** · Set theory (Cantor) (philosophy, weight 39)
- `brunelleschis-dome-florence` · **1420 AD** · Brunelleschi's dome (Florence) (art, weight 38)
- `periodic-table-mendeleev` · **1869 AD** · Periodic table (Mendeleev) (physics, weight 38)
- `nuremberg-trials-simultaneous-interpretation` · **1945 AD** · Nuremberg Trials simultaneous interpretation (language, weight 38)
- `arpanet-packet-switching` · **1969 AD** · ARPANET / packet switching (computing, weight 38)
- `walkman-sony` · **1979 AD** · Walkman (Sony) (art, weight 38)
- `optics-and-experiment-ibn-al-haytham` · **1000 AD** · Optics and experiment (Ibn al-Haytham) (medicine, weight 37)
- `linear-perspective-brunelleschi` · **1415 AD** · Linear perspective (Brunelleschi) (art, weight 37)
- `ibm-pc-open-architecture` · **1981 AD** · IBM PC + open architecture (computing, weight 37)
- `scanning-tunneling-microscope` · **1981 AD** · Scanning tunneling microscope (physics, weight 37)
- `synthetic-dye-perkins-mauveine` · **1856 AD** · Synthetic dye (Perkin's mauveine) (economics, weight 36)
- `gravitational-waves-detected-ligo` · **2015 AD** · Gravitational waves detected (LIGO) (physics, weight 36)
- `human-anatomy-vesalius` · **1543 AD** · Human anatomy (Vesalius) (medicine, weight 35)
- `logarithms-napier` · **1614 AD** · Logarithms (Napier) (philosophy, weight 35)
- `elevator-safety-brake-otis` · **1852 AD** · Elevator safety brake (Otis) (economics, weight 35)
- `mosaic-browser` · **1993 AD** · Mosaic browser (computing, weight 35)
- `copernican-heliocentrism` · **1543 AD** · Copernican heliocentrism (philosophy, weight 34)
- `compound-microscope` · **1590 AD** · Compound microscope (medicine, weight 34)
- `experimental-method-bacon` · **1620 AD** · Experimental method (Bacon) (philosophy, weight 34)
- `cinema-lumi-re-brothers` · **1895 AD** · Cinema (Lumière brothers) (art, weight 34)
- `magnetic-tape-recording` · **1948 AD** · Magnetic tape recording (art, weight 34)
- `socratic-method` · **400 BC** · Socratic method (philosophy, weight 33)
- `blood-circulation-harvey` · **1628 AD** · Blood circulation (Harvey) (medicine, weight 33)
- `boolean-algebra-boole` · **1854 AD** · Boolean algebra (Boole) (philosophy, weight 33)
- `neutrino-detected-cowan-reines` · **1956 AD** · Neutrino detected (Cowan/Reines) (physics, weight 33)
- `eyeglasses` · **1286 AD** · Eyeglasses (medicine, weight 32)
- `ambroise-par-wound-treatment-reform` · **1545 AD** · Ambroise Paré / wound treatment reform (medicine, weight 32)
- `first-sign-language-alphabet-juan-pablo-bonet` · **1620 AD** · First sign language alphabet (Juan Pablo Bonet) (language, weight 32)

## No causal language in detail

- `proto-cuneiform-accounting-tokens` · **3200 BC** · Proto-cuneiform accounting tokens (language, weight 78)
- `collective-fiction` · **70,000 BC** · Collective fiction (philosophy, weight 77)
- `arpanet-email-precursor` · **1969 AD** · ARPANET / email precursor (language, weight 71)
- `venus-figurines-portable-art-tradition` · **25,000 BC** · Venus figurines / portable art tradition (art, weight 70)
- `c-programming-language-ritchie` · **1972 AD** · C programming language (Ritchie) (computing, weight 69)
- `akkadian-as-first-lingua-franca` · **2000 BC** · Akkadian as first lingua franca (language, weight 69)
- `papyrus-scrolls-lightweight-portable-writing-surface` · **3,000 BC** · Papyrus scrolls / lightweight portable writing surface (language, weight 65)
- `cave-painting-symbolic-art` · **40,000 BC** · Cave painting / symbolic art (art, weight 64)
- `mesopotamian-clay-tablet-record-keeping` · **3,000 BC** · Mesopotamian clay-tablet record-keeping (economics, weight 63)
- `xerox-parc-modern-computing-interface` · **1973 AD** · Xerox PARC / modern computing interface (computing, weight 63)
- `braille-system-standardized` · **1837 AD** · Braille system standardized (language, weight 63)
- `egyptian-hieroglyphics-phonetic-principle` · **3,100 BC** · Egyptian hieroglyphics (phonetic principle) (language, weight 62)
- `emergence-of-symbolic-behavior` · **150,000 BC** · Emergence of symbolic behavior (language, weight 62)
- `mosaic-browser-internet-as-publishing-medium` · **1993 AD** · Mosaic browser / internet as publishing medium (art, weight 61)
- `conceptual-art-dematerialization` · **1968 AD** · Conceptual art / dematerialization (art, weight 60)
- `eratosthenes-earths-circumference-calculated` · **250 BC** · Eratosthenes / Earth's circumference calculated (physics, weight 60)
- `international-auxiliary-language-esperanto-use` · **1887 AD** · Esperanto / engineered international auxiliary language (language, weight 58)
- `trepanation-skull-drilling` · **3,100 BC** · Trepanation (skull drilling) (medicine, weight 57)
- `arpanet-first-message-internet-origin` · **1969 AD** · ARPANET first message / internet origin (computing, weight 57)
- `daltons-atomic-theory-atoms-as-real` · **1808 AD** · Dalton's atomic theory / atoms as real (physics, weight 57)
- `diamond-sutra-first-dated-printed-book` · **868 AD** · Diamond Sutra / first dated printed book (language, weight 57)
- `rawls-theory-of-justice` · **1971 AD** · Rawls' Theory of Justice (philosophy, weight 56)
- `arrow-debreu-model-general-equilibrium` · **1954 AD** · Arrow-Debreu model / general equilibrium (economics, weight 56)
- `epic-of-gilgamesh-first-narrative-literature` · **2100 BC** · Epic of Gilgamesh / first narrative literature (language, weight 56)
- `accelerating-universe-dark-energy-discovered` · **1998 AD** · Accelerating universe / dark energy discovered (physics, weight 56)
- `bone-flute-intentional-music` · **30,000 BC** · Bone flute / intentional music (art, weight 55)
- `p-inis-sanskrit-grammar` · **500 BC** · Pāṇini's Sanskrit grammar (language, weight 55)
- `galvani-bioelectricity` · **1791 AD** · Galvani / bioelectricity (medicine, weight 55)
- `world-wide-web-digital-art-and-net-art` · **1993 AD** · World Wide Web / digital art and net art (art, weight 55)
- `cd-rom-digital-storage-for-audio` · **1982 AD** · CD-ROM / digital storage for audio (art, weight 54)
- `univac-i-first-commercial-computer` · **1951 AD** · UNIVAC I / first commercial computer (computing, weight 53)
- `dartmouth-conference-ai-named-and-founded` · **1956 AD** · Dartmouth conference / AI named and founded (computing, weight 53)
- `dartmouth-workshop-ai-as-a-field` · **1956 AD** · Dartmouth Workshop / AI as a field (mind, weight 53)
- `un-charter-sovereign-equality-principle` · **1945 AD** · UN Charter / sovereign equality principle (law, weight 52)
- `gutenberg-text-becomes-reproducible` · **1455 AD** · Gutenberg / text becomes reproducible (language, weight 52)
- `earth-day-environmental-art-and-activism` · **1970 AD** · Earth Day / environmental art and activism (art, weight 52)
- `first-telephone-call-voice-transmission` · **1876 AD** · First telephone call / voice transmission (language, weight 52)
- `shamanism-first-religious-specialists` · **30,000 BC** · Shamanism / first religious specialists (religion, weight 52)
- `greek-alphabet-with-vowels` · **800 BC** · Greek alphabet with vowels (language, weight 51)
- `rice-domestication-yangtze-valley` · **7,000 BC** · Rice domestication (Yangtze Valley) (agriculture, weight 51)
- `spontaneous-generation-disproven-redi` · **1668 AD** · Spontaneous generation disproven (Redi) (biology, weight 51)
- `first-controlled-nuclear-chain-reaction` · **1942 AD** · First controlled nuclear chain reaction (physics, weight 50)
- `galens-medical-synthesis` · **200 AD** · Galen's medical synthesis (medicine, weight 50)
- `nuclear-magnetic-resonance-discovered` · **1938 AD** · Nuclear magnetic resonance discovered (physics, weight 50)
- `miller-urey-experiment-origin-of-life-chemistry` · **1953 AD** · Miller-Urey experiment / origin of life chemistry (biology, weight 50)
- `graphene-isolated-geim-and-novoselov` · **2004 AD** · Graphene isolated (Geim and Novoselov) (physics, weight 50)
- `holography-gabor` · **1947 AD** · Holography (Gabor) (physics, weight 50)
- `genetic-code-protein-synthesis-cricks-central-dogma` · **1953 AD** · Genetic code / protein synthesis (Crick's central dogma) (biology, weight 49)
- `rogets-thesaurus-organized-vocabulary` · **1852 AD** · Roget's Thesaurus / organized vocabulary (language, weight 49)
- `tim-berners-lees-www-proposal` · **1989 AD** · Tim Berners-Lee's WWW proposal (computing, weight 49)

## No source links

_None._

## Self-loops in chain

_None._

## Isolated ticks (no parents, no children)

These exist in the corpus but contribute no chain. Either add edges, or accept them as terminal observations.

_None._
