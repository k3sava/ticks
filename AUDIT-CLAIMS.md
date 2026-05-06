# Claim verification audit (multi-pass via DeepSeek V4 Flash)

Verdicts gathered: 1009 ticks. Two independent passes, agreement required.

## Auto-applied year corrections (4)

Both passes flagged year as WRONG and suggested years within tolerance; existing year was off by >50/10%.

- **babylonian-quadratic-equations** (Babylonian quadratic equations): `2,000 BC → 1,770 BC`
  > The text of this Babylonian tablet, dating from the reign of Hammurabi the Great between 1790 and 1750 BCE
- **zoroaster-cosmic-dualism** (Zoroaster's teaching / cosmic dualism): `1,200 BC → 600 BC`
  > Zoroastrianism dates back to the 6th century BCE.
- **braille-system-standardized** (Braille system standardized): `1878 AD → 1837 AD`
  > The second revision, published in 1837, was the first binary form of writing
- **diplomatic-correspondence-in-italian-lingua-franca** (Diplomatic correspondence in Italian (lingua franca)): `1450 AD → 1600 AD`
  > 'the use of Italian as a lingua franca on the Barbary Coast of the seventeenth century'

## Flagged: claim says WRONG (both passes) — needs human review (1)

- **alphaproof-ai-solves-imo-problems** (AlphaProof / AI solves IMO problems, 2024 AD): claim mismatch
  - A: Source is about International Mathematical Olympiad, not AlphaProof AI solving IMO problems.
  - B: Source describes IMO history and format; no mention of AlphaProof or AI solving IMO problems

## Flagged: year disagreement between passes (26)

- **irrigation-canals** (8,000 BC): year disagree: A=WRONG B=UNCERTAIN
  - A_sugg=-6000: Irrigation has been a key aspect of agriculture for over 5,000 years.
  - B_sugg=None: Irrigation has been a key aspect of agriculture for over 5,000 years
- **nudge-theory-libertarian-paternalism-thaler-sunstein** (2007 AD): year disagree: A=WRONG B=CORRECT
  - A_sugg=2003: Libertarian Paternalism Richard H. Thaler Cass R. Sunstein American Economic Review vol. 93, no. 2, May 2003
  - B_sugg=None: Libertarian Paternalism Richard H. Thaler Cass R. Sunstein American Economic Review vol. 93, no. 2, May 2003
- **money-as-abstract-exchange-medium** (600 BC): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: 'the Sumerians of Mesopotamia as early as 3100 BC' and 'silver shekel became their standard currency'
  - B_sugg=-3100: the first commodity to satisfy all the functions of money was silver under the Sumerians of Mesopotamia as early as 3100 BC
- **rice-domestication-yangtze-valley** (7,000 BC): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Evidence for wild rice cultivation and domestication in the fifth millennium BC of the Lower Yangtze region
  - B_sugg=-5000: The source discusses evidence for wild rice cultivation and domestication in the fifth millennium BC.
- **ai-optimized-precision-agriculture** (2023 AD): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: Precision agriculture is a management strategy that gathers, processes and analyzes temporal, spatial and individual plant and animal data
  - B_sugg=None: Source does not mention any specific year for the event.
- **first-illustrated-book-printed-woodcuts** (1461 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Source discusses Gutenberg Bible (ca. 1455) but not first illustrated book with woodcuts.
  - B_sugg=1455: The source describes the Gutenberg Bible (ca. 1455), not a 1461 illustrated book with woodcuts.
- **synthetic-organic-chemistry-total-synthesis** (1970 AD): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: Organic synthesis is a branch of chemical synthesis concerned with the construction of organic compounds.
  - B_sugg=None: The source does not mention the year 1970 AD for organic synthesis or total synthesis.
- **polymerase-chain-reaction-pcr-widespread-use** (1988 AD): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: Specific Enzymatic Amplification of DNA In Vitro: The Polymerase Chain Reaction
  - B_sugg=1986: The source is a 1986 paper; no mention of 1988 or widespread use.
- **minoan-fresco-naturalistic-art** (1440 BC): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: The Bull-Leaping Fresco ... 1450 - 1400 BC
  - B_sugg=-1450: The source dates the Bull-Leaping Fresco to 1450–1400 BC, not 1440 BC.
- **kirchhoff-and-bunsen-spectroscopy** (1859 AD): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: Mid-19th century (1830–1869) includes 1859; Kirchhoff and Bunsen are key figures in spectroscopy.
  - B_sugg=None: Source text does not mention Kirchhoff, Bunsen, or any event in 1859.
- **antibiotic-resistance-first-observed-penicillin** (1950 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Source discusses antimicrobial resistance generally, not first observation of penicillin resistance.
  - B_sugg=None: Source does not mention penicillin or a 1950 observation of antibiotic resistance.
- **venetian-republic-merchant-oligarchy** (1297 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: The Republic of Venice was a sovereign state and maritime republic.
  - B_sugg=697: The source mentions the first Doge in 697, not 1297, and does not explicitly call it a 'merchant oligarchy'.
- **default-mode-network-resting-state-fmri** (2003 AD): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: 2012 Aug 15;62(2):1137-45. doi:10.1016/j.neuroimage.2011.10.035
  - B_sugg=2012: The serendipitous discovery of the brain's default network. Neuroimage. 2012 Aug 15;62(2):1137-45.
- **chartered-trading-companies-risk-pooling** (1668 AD): year disagree: A=WRONG B=CORRECT
  - A_sugg=1670: King Charles II of England grants a permanent charter to the Hudson’s Bay Company... May 2, 1670
  - B_sugg=None: King Charles II of England grants a permanent charter to the Hudson’s Bay Company
- **galileos-falling-bodies-kinematics** (1589 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: He calculated the law of free fall, conceived of an inertial principle
  - B_sugg=1590: He calculated the law of free fall, conceived of an inertial principle, determined the parabolic trajectory of projectiles
- **precision-agriculture-gps-guided-farming** (1994 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Precision agriculture is a management strategy that gathers, processes and analyzes temporal, spatial and individual plant and animal data.
  - B_sugg=None: Source does not mention a specific year for the advent of precision agriculture; it discusses history generally.
- **vedic-religion-brahmin-priestly-class** (1,500 BC): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Brahmin is a varna in Hinduism, one of four castes, with Vedic duties and roles.
  - B_sugg=None: Source does not mention Vedic religion or a date of 1500 BC; discusses Brahmin caste generally.
- **phoenician-maritime-trade-network** (1,000 BC): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: By the 9th century BCE, the Phoenicians had established themselves as one of the greatest trading powers.
  - B_sugg=-900: By the 9th century BCE, the Phoenicians had established themselves as one of the greatest trading powers in the ancient world.
- **gemini-2-0-flash-real-time-multimodal-ai** (2025 AD): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: Gemini is a family of multimodal large language models (LLMs) developed by Google DeepMind.
  - B_sugg=-2023: Gemini 1.0 announced December 6, 2023; no mention of '2.0 Flash' or 'real-time multimodal' in source.
- **claude-4-sustained-reasoning-and-multi-hour-tasks** (2025 AD): year disagree: A=CORRECT B=WRONG
  - A_sugg=None: Claude is a series of large language models developed by Anthropic and first released in 2023.
  - B_sugg=-2026: Claude Opus 4.7 released April 16, 2026; no mention of 'Claude 4' or 'multi-hour tasks'.
- **sumerian-abacus** (2700 BC): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Source describes the abacus as an ancient calculating tool but does not specify a Sumerian origin date of 2700 BC.
  - B_sugg=None: Source mentions ancient Near East but does not specify 'Sumerian abacus' or date 2700 BC.
- **laparoscopic-surgery** (1987 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: The first laparoscopic procedure was performed by German surgeon Georg Kelling in 1901.
  - B_sugg=1901: The first laparoscopic procedure was performed by German surgeon Georg Kelling in 1901.
- **tversky-and-kahneman-heuristics-and-biases** (1972 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Source is Kahneman's biography; does not explicitly mention heuristics and biases or 1972.
  - B_sugg=None: Source is Kahneman's biography; no mention of heuristics and biases or Tversky.
- **codex-github-copilot-code-generation** (2020 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Introducing GitHub Copilot: your AI pair programmer
  - B_sugg=2021: Introducing GitHub Copilot: your AI pair programmer
- **photography-liberates-painting-impressionism** (1863 AD): year disagree: A=WRONG B=UNCERTAIN
  - A_sugg=1867: work produced in the late 19th century, especially between about 1867 and 1886
  - B_sugg=None: The source does not mention photography liberating painting; it discusses Impressionist origins in the 1860s.
- **ai-regulation-begins-eu-ai-act-eo-14110** (2023 AD): year disagree: A=UNCERTAIN B=WRONG
  - A_sugg=None: Source is the Bletchley Declaration (2023) but does not mention EU AI Act or EO 14110.
  - B_sugg=2023: The Bletchley Declaration on AI Safety announces a new global effort... Published 1 November 2023.

## Flagged: claim disagreement between passes (91)

- **irrigation-canals** (8,000 BC): claim disagree: A=CORRECT B=WRONG
- **recursive-language** (70,000 BC): claim disagree: A=CORRECT B=WRONG
- **collective-fiction** (70,000 BC): claim disagree: A=CORRECT B=WRONG
- **loom-weaving** (5,000 BC): claim disagree: A=CORRECT B=WRONG
- **egyptian-hieroglyphics-phonetic-principle** (3,100 BC): claim disagree: A=CORRECT B=WRONG
- **city-state-governance** (3,000 BC): claim disagree: A=CORRECT B=WRONG
- **on-the-origin-of-species-darwin** (1859 AD): claim disagree: A=UNCERTAIN B=WRONG
- **blood-typing-landsteiner** (1901 AD): claim disagree: A=CORRECT B=WRONG
- **cajal-neuron-doctrine** (1906 AD): claim disagree: A=CORRECT B=WRONG
- **shannons-information-theory** (1936 AD): claim disagree: A=CORRECT B=WRONG
- **nuremberg-trials-simultaneous-interpretation** (1945 AD): claim disagree: A=UNCERTAIN B=WRONG
- **higgs-mechanism-theoretical** (1964 AD): claim disagree: A=CORRECT B=WRONG
- **gps-made-available-to-civilians** (1983 AD): claim disagree: A=UNCERTAIN B=WRONG
- **chatgpt-rlhf-alignment** (2022 AD): claim disagree: A=CORRECT B=WRONG
- **brain-computer-interface-neuralink-braingate** (2023 AD): claim disagree: A=CORRECT B=WRONG
- **gpt-4-multimodality-frontier-model-capabilities** (2023 AD): claim disagree: A=CORRECT B=WRONG
- **reasoning-models-o1-o3-chain-of-thought-at-inference** (2024 AD): claim disagree: A=CORRECT B=WRONG
- **composite-bow** (2,400 BC): claim disagree: A=CORRECT B=WRONG
- **napoleons-corps-system** (1798 AD): claim disagree: A=UNCERTAIN B=WRONG
- **railroad-warfare-american-civil-war** (1861 AD): claim disagree: A=UNCERTAIN B=WRONG
- **d-day-amphibious-doctrine** (1944 AD): claim disagree: A=CORRECT B=WRONG
- **strategic-bombing-doctrine-validated-and-questioned** (1945 AD): claim disagree: A=CORRECT B=WRONG
- **nuclear-deterrence-theory-mad** (1965 AD): claim disagree: A=CORRECT B=WRONG
- **intercontinental-ballistic-missile-icbm** (1957 AD): claim disagree: A=CORRECT B=WRONG
- **counterinsurgency-doctrine-malaya-vietnam** (1960 AD): claim disagree: A=CORRECT B=WRONG
- **gene-therapy-first-clinical-trial** (1990 AD): claim disagree: A=UNCERTAIN B=WRONG
- **money-as-abstract-exchange-medium** (600 BC): claim disagree: A=CORRECT B=WRONG
- **christianity-universal-salvation-message** (4 BC): claim disagree: A=CORRECT B=WRONG
- **rice-domestication-yangtze-valley** (7,000 BC): claim disagree: A=CORRECT B=WRONG
- **ai-optimized-precision-agriculture** (2023 AD): claim disagree: A=CORRECT B=WRONG
- **first-illustrated-book-printed-woodcuts** (1461 AD): claim disagree: A=UNCERTAIN B=WRONG
- **ethernet-local-area-networking-metcalfe** (1973 AD): claim disagree: A=CORRECT B=WRONG
- **world-wide-web-berners-lee-protocols** (1990 AD): claim disagree: A=CORRECT B=WRONG
- **international-humanitarian-law-lieber-code** (1863 AD): claim disagree: A=CORRECT B=WRONG
- **genocide-convention-defining-a-new-crime** (1948 AD): claim disagree: A=UNCERTAIN B=WRONG
- **amnesty-international-founded-human-rights-ngos** (1961 AD): claim disagree: A=UNCERTAIN B=WRONG
- **hippocratic-corpus-natural-disease-causation** (400 BC): claim disagree: A=UNCERTAIN B=WRONG
- **black-death-quarantine-invented** (1347 AD): claim disagree: A=UNCERTAIN B=WRONG
- **agincourt-longbow-defeats-armored-cavalry** (1415 AD): claim disagree: A=UNCERTAIN B=WRONG
- **napoleons-defeat-logistics-and-overextension** (1813 AD): claim disagree: A=CORRECT B=WRONG
- **foucaults-discipline-and-punish-power-knowledge** (1975 AD): claim disagree: A=CORRECT B=WRONG
- **singers-practical-ethics-applied-ethics-movement** (1979 AD): claim disagree: A=UNCERTAIN B=WRONG
- **hebrew-prophetic-tradition-social-justice-theology** (800 BC): claim disagree: A=UNCERTAIN B=WRONG
- **guy-de-chauliac-medieval-surgical-synthesis** (1363 AD): claim disagree: A=UNCERTAIN B=WRONG
- **bacons-great-instauration-organized-scientific-knowledge** (1620 AD): claim disagree: A=CORRECT B=WRONG
- **blacks-latent-heat-thermochemistry** (1762 AD): claim disagree: A=CORRECT B=WRONG
- **faradays-laws-of-electrolysis** (1833 AD): claim disagree: A=CORRECT B=WRONG
- **synthetic-organic-chemistry-total-synthesis** (1970 AD): claim disagree: A=CORRECT B=WRONG
- **polymerase-chain-reaction-pcr-widespread-use** (1988 AD): claim disagree: A=CORRECT B=WRONG
- **higgs-boson-discovery-standard-model-complete** (2012 AD): claim disagree: A=CORRECT B=WRONG
- **minoan-fresco-naturalistic-art** (1440 BC): claim disagree: A=CORRECT B=WRONG
- **kirchhoff-and-bunsen-spectroscopy** (1859 AD): claim disagree: A=CORRECT B=WRONG
- **greek-tragedy-public-emotional-catharsis** (470 BC): claim disagree: A=UNCERTAIN B=WRONG
- **antibiotic-resistance-first-observed-penicillin** (1950 AD): claim disagree: A=UNCERTAIN B=WRONG
- **haydns-string-quartet-chamber-music-form** (1760 AD): claim disagree: A=CORRECT B=WRONG
- **earth-day-environmental-art-and-activism** (1970 AD): claim disagree: A=UNCERTAIN B=WRONG
- **punk-graphic-design-diy-typography** (1978 AD): claim disagree: A=UNCERTAIN B=WRONG
- **epic-of-gilgamesh-first-narrative-literature** (2100 BC): claim disagree: A=UNCERTAIN B=WRONG
- **precision-agriculture-gps-guided-farming** (1994 AD): claim disagree: A=CORRECT B=WRONG
- **vedic-religion-brahmin-priestly-class** (1,500 BC): claim disagree: A=CORRECT B=WRONG
- **darwin-vs-genesis-evolution-challenges-creation** (1859 AD): claim disagree: A=UNCERTAIN B=WRONG
- **napoleonic-code** (1804 AD): claim disagree: A=CORRECT B=WRONG
- **drone-warfare-remotely-piloted-combat** (2001 AD): claim disagree: A=UNCERTAIN B=WRONG
- **principia-natural-philosophy-becomes-physics** (1687 AD): claim disagree: A=CORRECT B=WRONG
- **claude-3-7-sonnet-hybrid-reasoning-models** (2025 AD): claim disagree: A=CORRECT B=WRONG
- **vibe-coding-natural-language-software-development** (2025 AD): claim disagree: A=UNCERTAIN B=WRONG
- **gemini-2-0-flash-real-time-multimodal-ai** (2025 AD): claim disagree: A=CORRECT B=WRONG
- **ai-in-drug-discovery-first-ai-designed-drug-trials** (2025 AD): claim disagree: A=UNCERTAIN B=WRONG
- **claude-4-sustained-reasoning-and-multi-hour-tasks** (2025 AD): claim disagree: A=CORRECT B=WRONG
- **sumerian-abacus** (2700 BC): claim disagree: A=CORRECT B=WRONG
- **woese-archaea-three-domains** (1977 AD): claim disagree: A=UNCERTAIN B=WRONG
- **pacioli-double-entry-bookkeeping** (1494 AD): claim disagree: A=UNCERTAIN B=WRONG
- **silk-road-zhang-qian-han-opening** (138 BC): claim disagree: A=UNCERTAIN B=WRONG
- **edict-of-thessalonica-christianity-state-religion** (380 AD): claim disagree: A=UNCERTAIN B=WRONG
- **zoroastrianism-achaemenid-state-religion** (550 BC): claim disagree: A=UNCERTAIN B=WRONG
- **the-wheel** (3,500 BC): claim disagree: A=CORRECT B=WRONG
- **iron-smelting** (1,200 BC): claim disagree: A=CORRECT B=WRONG
- **fortification-walls-uruk-jericho** (3,000 BC): claim disagree: A=UNCERTAIN B=WRONG
- **microprocessor-intel-4004** (1971 AD): claim disagree: A=UNCERTAIN B=WRONG
- **w-and-z-bosons-discovered-cern** (1983 AD): claim disagree: A=UNCERTAIN B=WRONG
- **tversky-and-kahneman-heuristics-and-biases** (1972 AD): claim disagree: A=UNCERTAIN B=WRONG
- **battle-of-marathon-citizen-soldier-victory** (490 BC): claim disagree: A=CORRECT B=WRONG
- **newtons-apple-gravity-as-universal** (1666 AD): claim disagree: A=CORRECT B=WRONG
- **medici-banking-letters-of-credit** (1400 AD): claim disagree: A=UNCERTAIN B=WRONG
- **maize-domestication-teosinte** (5,000 BC): claim disagree: A=UNCERTAIN B=WRONG
- **viticulture-wine-production-begins** (4,000 BC): claim disagree: A=UNCERTAIN B=WRONG
- **spanish-flu-pandemic-preparedness-as-concept** (1918 AD): claim disagree: A=UNCERTAIN B=WRONG
- **tractor-displaces-draft-animals-mass-adoption** (1921 AD): claim disagree: A=UNCERTAIN B=WRONG
- **dartmouth-workshop-ai-as-a-field** (1956 AD): claim disagree: A=UNCERTAIN B=WRONG
- **ai-regulation-begins-eu-ai-act-eo-14110** (2023 AD): claim disagree: A=UNCERTAIN B=WRONG
- **foucault-pendulum-earth-rotates** (1851 AD): claim disagree: A=UNCERTAIN B=WRONG

## No verdict gathered (0)

