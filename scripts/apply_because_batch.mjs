#!/usr/bin/env node
// apply_because_batch.mjs — apply hand-written because-text for a batch of
// ticks. Reads from a hard-coded BECAUSE_BATCH map at the top of this file
// (or pass --file path/to/json).

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const DRY = process.argv.includes("--dry");

const BECAUSE_BATCH = {
  'turings-universal-machine':
    "Lovelace's first algorithm (1843) showed that mechanism could perform symbolic work. Hollerith's punch-card tabulator (1890) ran census data through hardware. The differential analyser (1931) put the idea into a working analog computer. Turing's universal machine — a thought-experiment device with a tape, a read-head, and a state — proved that any computation, no matter how specialized, could be performed by one general-purpose machine. Every computer ever built is a Turing machine.",

  'petition-of-right-habeas-corpus-strengthened':
    "Magna Carta (1215) constrained the king once. Coke's reading of common law in the early 1600s made it a living tradition. The Petition of Right (1628) made imprisonment without stated cause illegal — Charles I assented under fiscal pressure he couldn't escape. Habeas corpus moved from custom to enforceable law. Every due-process protection in English and American law is downstream.",

  'ico-boom-cryptocurrency-fundraising':
    "Bitcoin's blockchain (2009) proved a public ledger could exist without a central authority. AWS (2006) had shown that startup infrastructure was rentable by the hour. The 2017 ICO boom combined them: companies raised $5.6B by selling cryptocurrency tokens directly to the public, bypassing accredited-investor rules and IPO infrastructure. Most ICOs were fraud or unregistered securities. The SEC's enforcement responses defined how regulation would treat cryptographic assets.",

  'vertical-farming-led-lit-indoor-agriculture':
    "Cheap white-light LEDs hit commercial pricing around 2010. Precision agriculture (1994) had shown that farming could be data-driven. Vertical farms put both inside a warehouse: leafy greens grown in stacked trays under tuned spectra, with 90% less water and no pesticides. Agriculture decoupled from weather and soil for the first time in 10,000 years.",

  'wwi-chemical-weapons-chlorine-mustard-gas':
    "The Maxim gun (1884) and trench warfare's emergence by 1915 had made traditional infantry advance suicidal. Germany's chlorine attack at Ypres in April 1915 was the first large-scale battlefield use of poison gas; mustard gas followed in 1917. Tactically, neither side gained ground. Strategically, every arms-control regime since — the 1925 Geneva Protocol, the 1993 Chemical Weapons Convention — is still responding to it.",

  'nuremberg-trials-individual-responsibility-in-international-law':
    "After the war ended in 1945, the Allies faced a choice: summary execution of Nazi leadership, or trial. The trial path required a legal theory that didn't yet exist — that individual state officials could be criminally responsible for crimes against humanity, war crimes, and genocide, even when acting under orders. Nuremberg invented that theory and tested it in court. The International Criminal Court, the Genocide Convention, and the Responsibility to Protect doctrine all build on the precedent.",

  'vatican-ii-catholic-churchs-modernization':
    "The Holocaust (1945) and the decolonization wave (1960) forced every European institution to reckon with its complicity. John XXIII opened Vatican II in 1962 to bring the Catholic Church 'up to date.' Mass switched to vernacular languages. The Church acknowledged truth in other religions. Ecumenism replaced condemnation. The largest institutional reform in Christian history — and the source of nearly every conservative-progressive Catholic argument since.",

  'russian-revolution-first-communist-state':
    "WWI's industrial slaughter (1914-1917) and the Tsarist regime's incompetent management of it broke Russian society. Marx's Das Kapital (1867) had given socialism a theory. Lenin's October Revolution applied the theory under conditions no one had predicted: a war-shattered peasant economy seized by a small Bolshevik vanguard. The revolution proved industrial capitalism could be overthrown and replaced. The twentieth century's political history is mostly a response.",

  'cuban-missile-crisis-nuclear-diplomacy':
    "The atomic bomb (1945) and the H-bomb (1952) gave two superpowers the ability to end civilization. The Cold War's logic of mutual deterrence held — until October 1962, when Soviet missiles in Cuba and US missiles in Turkey put both sides one decision from launch. Kennedy and Khrushchev's thirteen days of back-channel diplomacy invented the modern crisis-management playbook: ExComm-style deliberation, secret quid-pro-quo, the red phone between Washington and Moscow.",

  'berlin-conference-formalization-of-colonialism':
    "The telegraph (from the 1840s) and the steam-powered gunboat collapsed the cost of European projection of force into Africa. Belgian, French, German, and British colonial pressure had been building for decades. The Berlin Conference (1884) formalized the Scramble for Africa: European powers divided the continent into colonies on a map, without African representation. Within thirty years, ninety percent of Africa was under European colonial rule. The decolonization movements of the twentieth century were the answer to this map.",

  'bahai-faith-religious-universalism':
    "The Enlightenment had argued that reason was universal. Religious revival movements (Methodism, Mormonism) showed religion could be remade. The Bab's declaration in Persia in 1844 began what became the Baha'i Faith — the belief that all major religions are successive revelations of one God, that humanity is one, and that their unification is both possible and necessary. The first major religion explicitly premised on the unity of all previous ones.",

  'amnesty-international-founded-human-rights-ngos':
    "The Universal Declaration of Human Rights (1948) stated principles. Amnesty International (1961) made them operational: a non-governmental network of letter-writers documenting and pressuring governments to release political prisoners. Peter Benenson's Observer article 'The Forgotten Prisoners' launched it. Every modern human-rights NGO inherited the model — name a prisoner, name a country, mobilize a constituency.",

  'pfizer-moderna-mrna-vaccines-covid-19':
    "mRNA had been studied as a vaccine platform since the 1990s but never approved. The COVID-19 outbreak in early 2020 collapsed the trial-and-deployment timeline: Moderna's vaccine sequence was finalized in 48 hours after the virus genome was published. Pfizer-BioNTech's first dose followed eleven months later. mRNA vaccines went from experimental to standard in a single year. Every vaccine pipeline since has an mRNA option.",

  'hebbs-rule-synaptic-plasticity':
    "Cajal's neurons (1899) had been static structures. Pavlov's conditioning (1901) had made learning a behavioral fact. Hebb's 1949 rule — cells that fire together, wire together — gave learning a synaptic mechanism: the connection between two neurons strengthens when they fire in coincidence. Every artificial neural network and most modern theories of memory rest on this two-line idea.",

  'arab-spring-social-media-and-political-revolution':
    "Twitter (2006) and Facebook (2004) gave protesters a coordination layer that didn't depend on state-controlled media. Tunisia's 2010 revolution started with a single self-immolation captured on a phone. Egypt, Libya, Syria, Yemen followed. Some regimes fell, some hardened, none were unchanged. The first wave of revolutions in which social media was the primary organizing infrastructure — and the first lesson in its limits.",

  'chemical-fertilizer-liebigs-mineral-theory':
    "Pre-Liebig agriculture treated soil as inherited fertility — depletable but not analyzable. Liebig's 1840 mineral theory of plant nutrition identified nitrogen, phosphorus, and potassium as the chemical essentials. Wöhler's synthesis of urea (1828) had already shown that organic-seeming molecules could be made inorganically. The combination meant fertilizer could be manufactured. Half the people alive eat because of nitrogen later extracted from air by the Haber-Bosch process.",

  'gdpr-right-to-digital-privacy-as-law':
    "By 2014, data brokers and ad-tech had built profiles on every European with internet access. The 1995 Data Protection Directive was no longer enforceable at scale. GDPR (2018) gave residents enforceable rights — access, deletion, portability, the right not to be profiled — and gave regulators teeth: 4% of global revenue. The first data-privacy regime that companies in California, Tokyo, and Bangalore actually had to engineer for. CCPA, LGPD, and the rest are GDPR copies.",

  'encyclop-die-diderot-dalembert-organized-human-knowledge':
    "The encyclopedic tradition (Pliny, Isidore) had been theological. Newton's Principia (1687) showed a single book could contain a universal science. Diderot and d'Alembert's Encyclopédie (1751-1772) was the Enlightenment turned into a reference work — 28 volumes, 71,818 articles, written by 140 contributors including Voltaire, Rousseau, Montesquieu. The first attempt at organizing all human knowledge by reason rather than authority. Every reference work since, including Wikipedia, is downstream.",

  'habeas-corpus-act-detention-rights-formalized':
    "The Petition of Right (1628) had stated the principle of detention only for cause. The Habeas Corpus Act (1679) made it procedural: a writ that any judge could issue, returnable within three days, requiring the government to produce the body of the detained person and state the cause. Indefinite detention without trial was foreclosed. Eleven years later, the Glorious Revolution made constitutional government permanent in England. The act's language survives in the US Constitution's suspension clause.",

  'quantitative-easing-post-financial-crisis':
    "The 2008 financial crisis broke the central-bank toolkit: rates couldn't go below zero, and the credit channel was frozen. Bernanke's Fed expanded its balance sheet from $900B to $4.5T by purchasing Treasuries and mortgage-backed securities — quantitative easing. The ECB and BOJ followed. Asset prices recovered before wages did, accelerating the inequality that defined the next decade. The unconventional became conventional; central banks are still unwinding.",

  'rwandan-genocide-failure-of-international-response':
    "The Genocide Convention (1948) and Universal Declaration of Human Rights (1948) had committed the international community to 'Never Again.' In 100 days in 1994, 800,000 Tutsi and moderate Hutu were killed in Rwanda while a small UN force was ordered not to intervene. The gap between rhetoric and political will was the lesson. The Responsibility to Protect doctrine and the International Criminal Tribunal for Rwanda were the answers — necessary, insufficient.",

  'covid-pandemic-remote-work-as-default':
    "Slack (2013), Zoom (2011), and broadband everywhere made remote work technically possible for a decade — and culturally rare. The COVID-19 pandemic in spring 2020 sent 45% of US workers home overnight. The largest involuntary work-from-home experiment in history proved that much knowledge work could be done remotely without productivity collapse. The geography of work and commercial real estate were permanently changed.",

  'settlement-house-movement-social-work-profession':
    "Industrial-era poverty (1860-1880) created urban slums in every Western capital. Charity organizations treated poverty as moral failing. Jane Addams's Hull House (1889) in Chicago brought middle-class reformers to live IN the slum, document conditions, and build services. Settlement houses launched the social work profession, the structural-causes view of poverty, and advocacy as a method. Addams won the Nobel Peace Prize in 1931.",

  'title-ix-womens-sports-equality':
    "Brown v. Board (1954) had outlawed racial segregation in education. The Civil Rights Act (1964) extended antidiscrimination to employment. Title IX of the 1972 Education Amendments closed the sex-discrimination gap in federally funded education. Women's college and professional sports participation exploded. Between 1972 and 2019, girls' high school sports participation went up 1,057%. The US Women's National Soccer Team is a Title IX outcome.",

  'year-of-africa-decolonization-wave':
    "WWII destroyed the European colonial powers' fiscal capacity to hold their empires. The UN Charter (1945) made sovereign equality a principle, not just a slogan. India (1947) and Ghana (1957) set the template. 1960 saw 17 African nations declare independence — the largest single-year expansion of state sovereignty in history. Within fifteen years, virtually all of Africa was independent.",

  'lawrence-v-texas-sodomy-laws-struck-down':
    "Bowers v. Hardwick (1986) had upheld state criminalization of consensual gay sex. By 2003, fourteen US states still had sodomy statutes. Lawrence v. Texas struck them down — establishing that intimate consensual conduct was protected by constitutional liberty. Obergefell (2015) and the right to same-sex marriage built directly on the Lawrence holding. The criminal framework that had defined gay identity as illegal was dismantled.",

  'midjourney-v4-text-to-image-goes-mainstream':
    "DALL-E 1 (2021) and Stable Diffusion's open-source release (August 2022) showed that text-to-image generation worked. Midjourney v4 (November 2022) made it photorealistic. Anyone with a Discord account could produce a magazine-cover-quality image from a sentence. Stock photography subscriptions cancelled, concept-art job listings dropped 70%, and an AI-generated image won the Colorado State Fair's digital-art prize.",

  'copyright-law-statute-of-anne':
    "Gutenberg's printing press (1450) had made copying cheap. The Stationers' Company in London held a monopoly on what could be printed. The Statute of Anne (1710) — 'An Act for the Encouragement of Learning' — moved that right from the printer to the author, and limited it to 14 years (renewable once). The first copyright law. Every IP regime, patent system, and creator economy descends from this statute.",

  'marine-chronometer-harrison':
    "Sailors knew latitude from the sun. Longitude required knowing the time at a reference meridian — and pendulum clocks failed at sea. The British Parliament's Longitude Prize (1714) offered £20,000 to whoever solved it. John Harrison's H4 chronometer (1761) kept time to within a few seconds across an Atlantic crossing. Captain Cook used H4 on his second voyage and never lost a ship to navigational error. Empire and trade became routinely possible.",

  'indian-independence-decolonization-wave':
    "Gandhi's satyagraha (1919-1947) made British colonial rule politically unsustainable. WWII (1939-45) broke Britain's fiscal capacity to enforce it. Indian Independence (August 15, 1947) and Pakistan's simultaneous founding remade the political map of Asia. Within fifteen years, the European empires that had spanned the globe in 1939 were nearly gone. The post-colonial state became the dominant political form.",

  'piaget-cognitive-development-stages':
    "Watson's behaviorism (1913) had treated children as small empty vessels for stimulus-response. Freud's developmental theory (1900-1920) was unfalsifiable. Piaget watched his own three children carefully and noticed they made qualitatively different errors at different ages. He proposed four stages — sensorimotor, preoperational, concrete operational, formal operational. Children don't just know less than adults. They think differently. Educational psychology and child-centered pedagogy follow.",

  'stroop-effect-cognitive-interference':
    "James (1890) had hypothesized that some mental processes were automatic, others controlled. Watson (1913) said only behavior counted. Stroop's experiment (1935) settled it: read the word RED printed in blue ink, name the color, and your reading interferes with your color-naming for hundreds of milliseconds. Automatic and controlled processes are separable, and they compete for resources. Cognitive psychology's experimental method begins here.",

  'milgram-obedience-experiments':
    "Hannah Arendt's Eichmann in Jerusalem (1963) argued that mass atrocity was banal — committed by ordinary bureaucrats. Milgram's obedience experiments (1961-1963) tested it: Yale undergrads administered apparently lethal electric shocks to strangers on the instruction of an authority figure. 65% went to the maximum voltage. The experiment's ethics were disputed. Its finding wasn't: context and authority structures, not personality, explain most destructive behavior.",

  'american-declaration-of-independence':
    "Locke's Two Treatises (1689) argued that legitimate government rests on consent. The Encyclopédie (1751-1772) made Enlightenment thought continental currency. The Declaration of Independence took the philosophical claim and made it the constitutional premise of a new state — 'all men are created equal,' 'endowed by their Creator with certain unalienable Rights.' Every subsequent democratic revolution invokes its language.",

  'zoroaster-cosmic-dualism':
    "Pre-Zoroastrian Persia had a polytheistic ritual religion. Zoroaster (Zarathustra), preaching sometime between 1500 and 1000 BCE, taught a cosmic struggle between Ahura Mazda (truth) and Angra Mainyu (the lie), with humans choosing sides through their actions. The first sustained ethical monotheism. Judaism, Christianity, and Islam all draw on Zoroastrian eschatology — heaven, hell, the day of judgment, the messiah. The Greek date of 628 BC is now rejected.",

  'ai-optimized-precision-agriculture':
    "Precision agriculture (1994) used GPS to vary input rates within a field. Computer vision (2012-2020) made plant-level identification possible. AI-optimized precision agriculture combines them: drones scout fields, AI identifies individual weeds and diseased plants, sprayers apply herbicide only where needed. John Deere's See & Spray cuts herbicide use by 90%. The first time agricultural inputs are applied at plant resolution rather than field resolution.",

  'european-convention-on-human-rights':
    "The Universal Declaration of Human Rights (1948) was aspirational. The European Convention on Human Rights (1950) made enforcement procedural: a court (the European Court of Human Rights) with compulsory jurisdiction over human rights cases brought by individuals against their own governments. The first international court that ordinary people could petition. Every regional human rights system since copies the architecture.",

  'iranian-revolution-political-islam':
    "Modernization theory had assumed development would produce secular politics. The Shah's White Revolution (1963) imposed top-down modernization on Iran. Khomeini's Islamic Revolution (1979) overthrew the Shah, the theory, and the assumption that secularism was the inevitable destination of every modernizing society. Political Islam became a global force — from the Muslim Brotherhood to Hamas to ISIS — in forms Khomeini didn't intend.",

  'islamic-state-social-media-terrorist-recruitment':
    "al-Qaeda's mid-2000s recruitment relied on personal networks and madrassas. ISIS, declared in 2014, used YouTube, Twitter, and encrypted messaging to recruit fighters globally without any personal contact. High-production propaganda, foreign-language content, online radicalization pipelines. The first major terrorist organization to use platforms as its primary recruiting infrastructure. Counter-terrorism and platform content moderation were both permanently changed.",

  'mirror-neurons-discovered-rizzolatti':
    "Behaviorists had treated motor action and social cognition as separate problems. Rizzolatti's team in Parma discovered macaque neurons that fired BOTH when the monkey performed an action and when it observed another performing the same action. The 'mirror neuron theory of empathy' was oversold in pop accounts. The discovery was real: motor and social cognition share neural circuitry, and imitation has a biological substrate.",

  'indian-independence-largest-democracy':
    "Independence (August 15, 1947) made India the world's largest democracy in a society with no European-style electoral tradition, massive poverty, and extraordinary religious and linguistic diversity. Modernization theory had predicted that democracy required a particular cultural inheritance. India's endurance — imperfect but genuine — refuted the claim. Constitutional democracy could be built where it had no precedent, including in the Global South.",

  'miranda-rights-confession-law':
    "The Civil Rights Act (1964) had outlawed discrimination in public accommodations. Gideon v. Wainwright (1963) gave defendants the right to counsel. Miranda v. Arizona (1966) closed the interrogation gap: police must inform suspects of their right to remain silent and their right to an attorney before questioning. Statements obtained without warnings are inadmissible. Criminal procedure in every US jurisdiction (and in Canada and the UK) was rewritten.",

  'behaviorism-watsons-manifesto':
    "Wundt's experimental psychology (1879) had treated introspection as the method. Freud's unconscious (1900) was claimed to drive everything. Watson's 1913 manifesto rejected both: psychology should study only observable behavior — stimulus and response — and abandon all reference to consciousness. Behaviorism dominated US academic psychology for forty years. Skinner's operant conditioning, behavior therapy, and the entire stimulus-response training of pets and children all descend from this manifesto.",

  'edict-of-milan-christianity-legalized':
    "Diocletian's Great Persecution (303-311) had been the empire's last attempt to crush Christianity. By 312 there were too many Christians in the legions and the bureaucracy to sustain. Constantine and Licinius's Edict of Milan (313) made religious toleration imperial policy and returned confiscated church property. Christianity became legal — not yet privileged, but no longer prosecutable. Within a generation it was the favoured religion; by 380 it was the state religion.",

  'separation-of-powers-montesquieu':
    "Locke's Two Treatises (1689) had argued government rests on consent. The English Bill of Rights (1689) split sovereignty between Crown and Parliament in practice. Montesquieu's Spirit of the Laws (1748) made the principle theoretical: legislative, executive, and judicial functions must be exercised by separate institutions, each checking the others. The US Constitution and every liberal democracy's structure is an implementation of this idea.",

  'reasoning-models-o1-o3-chain-of-thought-at-inference':
    "GPT-3 (2020) and the Transformer (2017) had shown that scale produced capability. Chain-of-thought prompting (2022) showed that asking the model to think step-by-step improved hard-task performance. OpenAI's o1 (2024) and o3 (2024) made step-by-step reasoning a built-in inference mode: the model spends additional compute reasoning before answering. The model was solving, not just recalling. The frontier moved from training to test-time compute.",

  'james-stream-of-consciousness':
    "Wundt's experimental psychology (1879) had assumed consciousness was a collection of distinct mental atoms that introspection could enumerate. James's Principles of Psychology (1890) proposed consciousness was a continuous flowing stream — felt, never separable into pieces. The phrase 'stream of consciousness' became the title of a literary movement (Joyce, Woolf) and the working assumption of every modernist novel. Phenomenology and modern attention research both descend from James.",

  'binet-simon-intelligence-test-iq':
    "Galton's anthropometric measurements (1880s) had tried to measure intelligence by reaction time. Binet and Simon's 1905 test instead measured age-graded ability — a 7-year-old of 'mental age 9' could do what a typical 9-year-old could. The first standardized intelligence test, designed to identify Paris schoolchildren needing extra help. Stern (1912) divided mental age by chronological age and got the IQ. A century of psychometrics, educational testing, and eugenics followed.",

  'rorschach-inkblot-test':
    "Freud's interpretation of dreams (1900) had treated unconscious symbols as a code. Watson's behaviorism (1913) had said the unconscious wasn't measurable. Rorschach's projective test (1921) split the difference: how a subject interprets ambiguous images reveals patterns not accessible to introspection. Validity remained contested for a century. The principle survived: responses to ambiguous stimuli reveal something about the responder.",

  'skinner-box-operant-conditioning':
    "Pavlov's classical conditioning (1903) had paired stimuli to elicit reflexes. Skinner's operant conditioning chamber (1938) showed that behavior is shaped by its consequences — reinforcement increases frequency, punishment decreases it — without the organism needing to understand why. Behavior modification, token economies, video-game design, social-media like buttons, and slot machines all use Skinner's findings.",

  'turing-test-machine-intelligence':
    "Turing's universal machine (1936) had defined what computation was. By 1950, the first stored-program computers existed. Turing's paper 'Computing Machinery and Intelligence' proposed an operational test: if a machine can converse indistinguishably from a human, it should be considered intelligent. The paper launched AI as a field, sparked seventy years of philosophical argument, and framed every subsequent benchmark — from ELIZA to GPT — as a Turing-test variant.",

  'somatic-marker-hypothesis-damasio':
    "Cognitive science had treated emotion as noise interfering with rational decision-making. Damasio's patients with ventromedial prefrontal damage had intact logic but disastrous real-world decisions — they couldn't feel the emotional weight of options. His somatic marker hypothesis: emotion is not opposed to reason; it is a necessary input to it. Behavioral economics and modern decision theory both build on this finding.",

  'international-red-cross-humanitarian-law':
    "Solferino (1859) had killed 40,000 in a single day with no medical infrastructure for either side. Henri Dunant, who happened to be in town, organized civilian aid for the wounded regardless of uniform. His pamphlet led to the founding of the International Committee of the Red Cross (1863) and the first Geneva Convention (1864) — neutrality of medical personnel, protection for the wounded, the red cross emblem. Humanitarian law as a category begins here.",

  'moon-landing-as-shared-global-television-event':
    "Television had been broadcast nationally since the 1940s. Communications satellites (Telstar, 1962) made transcontinental live transmission possible. Apollo 11's moonwalk (July 20, 1969) was watched live by 600 million people — about 1 in 5 humans alive. The first truly global simultaneous shared experience. The capacity for shared global media moments — for better and worse — had been demonstrated.",

  'galileos-trial-science-vs-institutional-religion':
    "Copernicus's heliocentric model (1543) had been published as 'mathematical hypothesis.' Galileo's telescopic observations of Jupiter's moons (1610) and the phases of Venus made heliocentrism observational. The Counter-Reformation Church, defending its authority over natural philosophy, forced Galileo to recant in 1633. The trial defined the conflict between empirical inquiry and institutional religion that would shape European intellectual history. The Enlightenment used Galileo as exhibit A.",

  'spinozas-tractatus-biblical-criticism':
    "Hobbes's Leviathan (1651) had argued for a secular political theory. Spinoza's Tractatus Theologico-Politicus (1670) extended the move to scripture itself: the Bible was a human document, written by humans in particular historical contexts, and should be interpreted historically and critically. Higher biblical criticism begins here. Every liberal theology and every secular biblical scholarship since is downstream.",

  'pasteurization-of-milk':
    "Pasteur's germ theory (1864) had identified microbes as the cause of disease. Refrigeration (1870s) had made milk transportable. Pasteur's heating method, applied to milk in the 1880s and mandated in New York City in 1908, eliminated milk-borne tuberculosis, typhoid, and scarlet fever. Infant mortality dropped sharply. Pasteurization probably saved more lives than any other public-health intervention. It also enabled commercial dairy at scale.",

  'dna-structure-enables-crop-genetic-improvement':
    "Mendel's pea-plant inheritance (1866) had been rediscovered around 1900. Avery's transforming principle (1944) showed DNA was the genetic material. Watson and Crick's 1953 paper, built on Rosalind Franklin's X-ray crystallography (Photo 51) and Maurice Wilkins's data, gave DNA its double-helix structure. The model immediately revealed how genetic information is stored, copied, and varied. Recombinant DNA (1973) and CRISPR (2012) follow.",

  'lab-grown-meat-first-cultured-beef-burger':
    "Tissue engineering had been used in medical research since the 1990s. Mark Post's team at Maastricht grew the first cultured beef burger from bovine stem cells in 2013. It cost $300,000. By 2023, cultured chicken was approved for sale in Singapore and the US. If costs fall further, cultured meat could remove the need for industrial livestock farming — currently responsible for roughly 15% of global greenhouse emissions and most of the world's antibiotic use.",

  'english-bill-of-rights-constitutional-monarchy':
    "The Petition of Right (1628) and the Habeas Corpus Act (1679) had constrained the English monarchy in pieces. The Glorious Revolution (1688) put William and Mary on the throne by parliamentary invitation. The Bill of Rights (1689) formalized the settlement: parliamentary supremacy, free elections, free speech in Parliament, no excessive bail, no standing army in peacetime without Parliament's consent. England became a constitutional monarchy. The American Bill of Rights is modeled directly on it.",

  'rawls-public-reason-and-political-liberalism':
    "Rawls's Theory of Justice (1971) had relied on a thick conception of fairness derived behind the veil of ignorance. By the 1990s, communitarian critiques (Sandel, MacIntyre) had pressed: how could one liberal moral theory justify a society of moral disagreement? Political Liberalism (1993) answered: in pluralist societies, political justification must appeal to 'public reason' — reasons all citizens can in principle accept — not to any particular comprehensive moral or religious doctrine. Constitutional law in pluralist democracies took this turn.",

  'social-security-act-welfare-state-established-us':
    "The Great Depression (1929-1939) had broken the American assumption that old-age poverty was a private problem. Bismarck's Germany had pioneered social insurance in 1889. FDR's Social Security Act (1935) brought the model to the US: federal old-age insurance, unemployment insurance, aid to families with children. Medicare (1965) extended it to health. The principle that retirement security and basic income support are public obligations is American since 1935.",

  'attribution-theory-heider-kelley':
    "Behaviorists had treated all behavior as situationally controlled. Personality theorists treated it as dispositional. Heider (1958) and Kelley (1967) noticed that PEOPLE'S explanations of behavior systematically split: we attribute others' behavior to internal disposition ('they're that kind of person') and our own to situation ('circumstances made me'). The fundamental attribution error has been replicated thousands of times. Social psychology had its first genuinely surprising lawful regularity.",

  'venetian-republic-merchant-oligarchy':
    "Italian commune politics (1100s) had given commercial cities partial self-government. Venice's 1297 Serrata locked the Great Council to a fixed list of patrician families — formalizing merchant aristocracy as the ruling class. The first polity where commercial wealth and political power were explicitly fused. The Doge was elected, the Senate was elected, and the families were merchants. The Italian city-state model that the Hanseatic League and the Dutch Republic later emulated.",

  'tractor-displaces-draft-animals-mass-adoption':
    "Internal combustion (1885) had powered cars from 1900. Tractor adoption was slow until Ford's Fordson (1917) brought it under $400. By 1921, US tractor sales were a mass market. In 1920, one in four US farm acres fed horses and mules; by 1960 the number was approximately zero. One farmer with a tractor could work ten times the acreage. Between 1920 and 1960, US agricultural labor fell from 30% of the workforce to 10% while output doubled.",

  'green-revolution-begins-borlaug-wheat':
    "Haber-Bosch (1909) had made nitrogen fertilizer essentially limitless. Mendel's rediscovered genetics gave breeders a method. Borlaug's semi-dwarf wheat varieties at CIMMYT (1944 onward) could carry heavy grain heads on short stems without lodging. Combined with fertilizer and irrigation, yields tripled in a decade. The famines predicted for 1960s Asia did not arrive. Borlaug's Nobel Peace Prize citation credits him with saving a billion lives.",

  'nuremberg-principles-individual-criminal-responsibility':
    "Nuremberg (1945-46) had tried specific defendants. The principles' codification by the UN International Law Commission (1950) made the legal theory portable — heads of state and military commanders could be held criminally responsible for war crimes, crimes against humanity, and crimes against peace. Following orders was not a defense. Every subsequent war-crimes tribunal and the Rome Statute of the International Criminal Court (1998) builds on this codification.",

  'polyphonic-music-notre-dame-school':
    "Western music since antiquity had been monophonic — a single melodic line, with parallel doubling at most. Léonin and Pérotin at Notre Dame (1170-1200) developed sustained two-, three-, and four-voice polyphony with measurable rhythm. Multiple independent melodic lines required written scores; improvisation couldn't coordinate the complexity. Western music's distinctive history — counterpoint, harmony, sonata form — descends from Notre Dame's choir lofts.",

  'instructgpt-rlhf-makes-ai-followable':
    "GPT-3 (2020) was capable but unaligned — it would produce plausible-sounding falsehoods, refuse questions arbitrarily, and complete prompts in unhelpful directions. Reinforcement Learning from Human Feedback (RLHF), formalized in 2017 and applied to language models in InstructGPT (January 2022), trained models on human preferences. A 1.3B parameter InstructGPT outperformed the 175B GPT-3 on human preference ratings. ChatGPT (November 2022) made it product-ready.",

  'tolman-cognitive-maps':
    "Watsonian behaviorism had modeled rats as stimulus-response chains with no internal state. Tolman's 1948 'Cognitive Maps in Rats and Men' showed rats build internal spatial representations of mazes — they take shortcuts when offered, and they can navigate without practiced motor sequences. The first published evidence of mental representation in animals. Cognitive psychology's working assumption begins here. Place-cell neuroscience (O'Keefe, Nobel 2014) is downstream.",

  'principles-of-psychology-william-james':
    "Wundt's Leipzig laboratory (1879) had treated psychology as a measurable science of conscious elements. James's 1890 Principles of Psychology took the field in the opposite direction — treating consciousness as a continuous flowing stream, not a sum of atoms, and treating habit, emotion, and self as central. Psychology split definitively from philosophy. Pragmatism, functionalism, and most twentieth-century cognitive psychology trace back to this two-volume textbook.",

  'interpretation-of-dreams-freud':
    "Charcot's hypnosis demonstrations (1880s) had shown that the conscious mind doesn't have full access to its own causes. Freud's Interpretation of Dreams (1899) argued the unconscious was causally active in waking life as well — desires, fears, memories shaping action without the actor's awareness. Psychoanalysis as therapy followed. The subsequent century of personality psychology, psychotherapy, and pop self-help — 'processing' emotions, 'working through' issues — all assume Freud's unconscious is real.",

  'universal-declaration-of-human-rights':
    "Nuremberg (1945-46) had judged crimes against humanity but not stated the rights they had violated. Eleanor Roosevelt's UN drafting committee (1947-48), drawing on the French Declaration (1789), the US Bill of Rights, and Latin American constitutional traditions, produced the Universal Declaration of Human Rights (1948). Thirty articles. Not a treaty, but a statement. Every subsequent human-rights convention — civil and political, economic and social, against torture, against discrimination — grew out of these thirty articles.",

  'nuclear-deterrence-theory-mad':
    "Hiroshima and Nagasaki (1945) had shown what nuclear weapons could do. The Soviet test (1949) ended the US monopoly. The H-bomb (1952) made warheads city-killers. Mutually Assured Destruction emerged not as policy but as the only logical equilibrium: a first strike could not prevent retaliation, so neither side could rationally start. Cuba (1962) tested it. The Cold War's failure to escalate is MAD's main piece of evidence.",

  'ukraine-war-commercial-drones-and-osint':
    "DJI's consumer quadcopter (2013) had put aerial filming in everyone's hands. Twitter (2006) and Telegram (2013) made user-generated coverage continuous. The Russia-Ukraine war (2022) was the first major conflict in which a $500 commercial drone could destroy a multi-million-dollar tank, in which OSINT volunteers tracked army movements from public satellite imagery, and in which front-line video reached the world without state media. The information environment of war was permanently flattened.",

  'money-as-abstract-exchange-medium':
    "Mesopotamia had used silver shekels by weight for millennia, but each transaction required weighing. Lydia (~600 BC) introduced standardized minted coinage — fixed weight, state-stamped, locally accepted. The first coinage solved the double-coincidence-of-wants problem with portable, divisible, durable units. Specialization, markets, and long-distance trade scaled rapidly. Greek and Roman economies, then the rest of Eurasia, ran on the Lydian invention.",

  'hobbes-leviathan-secular-political-theory':
    "European political philosophy since Augustine had grounded political authority in divine appointment. The Wars of Religion (1517-1648) had discredited that grounding by killing a third of central Europe over which version of Christianity was authoritative. Hobbes's Leviathan (1651) derived political authority from a secular contract: people exit the state of nature (war of all against all) by agreeing to a sovereign whose legitimacy is its capacity to provide security. The first sustained secular political theory.",

  'stable-diffusion-open-sourced-generative-ai-democratized':
    "DALL-E 1 (2021) was API-locked. Midjourney was a Discord bot. Stability AI's release of Stable Diffusion's weights and code (August 2022) put a state-of-the-art image generation model in the hands of anyone with a 6GB GPU. Within weeks, thousands of fine-tuned variants existed — anime, photorealism, architecture, custom brands. The open-source ecosystem around image generation, then video and audio, exploded. Closed-vs-open became the durable axis of AI debate.",

  'rosa-parks-montgomery-bus-boycott':
    "Brown v. Board (1954) had outlawed school segregation in principle. Implementation was slow and bitter. Rosa Parks's December 1, 1955 refusal to give up her seat — coordinated with the local NAACP, planned for legal-test-case viability — launched the 381-day Montgomery Bus Boycott. The boycott broke the bus company's finances, broke the segregation ordinance in court, and made Martin Luther King Jr. a national figure. The Civil Rights Movement's modern phase begins here.",

  'terror-management-theory-mortality-salience':
    "Becker's Denial of Death (1973) had argued that human culture is fundamentally a defense against mortality. Greenberg, Solomon, and Pyszczynski (from 1986) operationalized the claim experimentally: subjects reminded of their mortality (mortality-salience manipulation) defend their cultural worldview more strongly, sometimes against the people the worldview targets. The most replicated finding in social psychology that mainstream cognitive theory still struggles to integrate.",

  'soviet-union-dissolution-end-of-communism':
    "Gorbachev's perestroika (1985) had tried to reform the Soviet system from within. Glasnost (1986) loosened information control. By 1989 the Eastern Bloc was independent; by August 1991 a coup against Gorbachev had failed; by December 25, 1991 the USSR ceased to exist. Fifteen sovereign states emerged. Russia inherited the nuclear arsenal, the UN Security Council seat, and the foreign debt. The 'end of history' was momentarily plausible. The post-Cold War order has been revising the answer ever since.",

  'justinian-code-roman-law-systematized':
    "Roman law by 500 AD was a sprawl of imperial edicts, juristic writings, and senatorial decrees accumulated over a millennium. Justinian's Corpus Juris Civilis (529-534) compiled them into a coherent system: the Digest (most-authoritative juristic opinions), the Code (imperial legislation), the Institutes (teaching text), the Novels (Justinian's own laws). Lost in the West for five hundred years. Rediscovered at Bologna in the eleventh century, it became the foundation of every civil-law legal system.",

  'craik-computational-theory-of-mind':
    "Behaviorism (1913) had said the mind shouldn't be modeled at all. Craik's The Nature of Explanation (1943) proposed the opposite: the mind works by constructing internal models of external reality — symbolic representations that can be manipulated to predict outcomes before acting. The first computational theory of mind, proposed before computers existed in working form. Cognitive science, AI, and information-processing models of cognition all start here.",

  'red-cross-founded-dunants-solferino':
    "Solferino (1859) had killed 40,000 in a single day with no medical infrastructure for either side. Dunant, in town by chance, organized civilian aid for the wounded regardless of uniform. His pamphlet A Memory of Solferino (1862) led to the International Committee of the Red Cross (1863), the first Geneva Convention (1864), and the principle that medical personnel and the wounded are protected in war. Humanitarian organizations as a category begin here.",

  'treaty-of-rome-european-integration':
    "WWII had wrecked Europe twice in thirty years. The European Coal and Steel Community (1951) had pooled the war-making resources of France and Germany. The Treaty of Rome (1957) created the European Economic Community: customs union, common market, eventual political integration. The logic was Schuman's: integrate economies so deeply that war between members becomes economically unthinkable. The EU is the largest sustained experiment in supranational governance.",

  'paris-agreement-global-climate-coordination':
    "The Kyoto Protocol (1997) had imposed top-down emission targets only on developed economies and excluded the US. By 2015 the largest emitters were also the largest holdouts. The Paris Agreement (December 2015) replaced top-down mandates with a bottom-up pledge-and-review system: every country submits a Nationally Determined Contribution and updates it every five years. Imperfect and probably insufficient, the first universal legally-binding climate framework all major emitters joined.",

  'llama-open-source-frontier-models':
    "GPT-4 (March 2023) was API-locked and expensive. Meta's LLaMA (February 2023) leaked online almost immediately and became unofficially open. LLaMA 2 (July 2023) was released openly under a quasi-permissive license. Mistral, Falcon, and Qwen followed. By late 2024 the gap between closed-frontier and open-frontier models was less than one generation. Frontier capability ran on consumer hardware. The closed-vs-open debate became the durable axis of AI policy.",

  'ai-regulation-begins-eu-ai-act-eo-14110':
    "GDPR (2018) had established that the EU could regulate algorithmic systems extraterritorially. The 2022-2023 wave of generative AI made the policy gap urgent. The EU AI Act (political agreement December 2023) classified AI systems by risk and required transparency, oversight, and red-team testing for high-risk uses. The US Executive Order 14110 (October 2023) imposed reporting requirements on frontier-model developers. The first year AI governance became enforceable law in major jurisdictions.",

  'wertheimer-phi-phenomenon-gestalt':
    "Wundt's structuralism (1879) had treated perception as a sum of sensory atoms — color, brightness, position. Wertheimer's 1912 phi-phenomenon experiments showed apparent motion couldn't be reduced to a sequence of static impressions: two flashing lights at the right interval are perceived as a single moving light. Perception is structurally holistic. Gestalt psychology — figure-ground, closure, common fate — and most twentieth-century perception research builds on this finding.",

  'chomsky-syntactic-structures-universal-grammar':
    "Skinner's behaviorist account of language (1957) had treated grammar as habit-formation. Chomsky's Syntactic Structures (1957) showed it couldn't work: speakers produce and understand sentences they have never heard, an infinite generative capacity that no stimulus-response history could explain. The mind has innate combinatorial machinery. Cognitive science took the bait — language, then perception, then memory — and the cognitive revolution displaced behaviorism in less than a decade.",

  'hubel-wiesel-visual-cortex-receptive-fields':
    "Lashley's mass-action experiments (1929) had argued that brain function was not localized. Microelectrode recording (mid-1950s) made single-cell studies possible. Hubel and Wiesel's 1959 recordings from cat visual cortex showed neurons selective for oriented edges in specific retinal positions — and a hierarchy of cells responding to progressively more complex features. The architecture template for both modern neuroscience and convolutional neural networks. Nobel 1981.",

  'hertz-detects-radio-waves':
    "Maxwell's equations (1865) had predicted electromagnetic waves traveling at the speed of light. The prediction sat unverified for two decades because no one knew how to generate or detect them in the lab. Hertz's spark-gap oscillator and resonant loop (1887) produced and detected free electromagnetic waves at known wavelengths. The waves reflected, refracted, and traveled at light speed — confirming Maxwell's theory. Marconi's wireless telegraphy (1895) was Hertz's experiment turned product.",

  'quarantine-in-venice':
    "The Black Death (1347-51) had killed roughly a third of Europe with no medical defense. Trade ports knew the disease arrived on ships but had no doctrine for what to do. Ragusa (modern Dubrovnik) imposed a thirty-day isolation period (trentino) on incoming ships in 1377; Venice extended it to forty days (quarantino) and gave us the word. The first formal infection-control institution. Border health policy worldwide is downstream.",

  'chomskys-universal-grammar':
    "Skinner's behaviorism had modeled language acquisition as conditioning. Chomsky's universal grammar hypothesis (1957) proposed instead that the human language capacity rests on innate biological constraints — children acquire syntax from impoverished input because they bring something to it. The poverty-of-stimulus argument launched generative linguistics, the modular mind, and the cognitive revolution. Whether universal grammar is biologically real remains contested; that the mind isn't a blank slate isn't.",

  'chomskys-syntactic-structures':
    "Pre-Chomsky linguistics (Bloomfield, Harris) had treated syntax as descriptive cataloguing of attested utterances. Chomsky's Syntactic Structures (1957) introduced transformational generative grammar — syntax as a finite system of rules that can produce infinitely many sentences, syntax as autonomous from meaning ('colorless green ideas sleep furiously' is grammatical and meaningless). The book that turned linguistics into a generative science. Cognitive science recruits its method.",

  'lithium-ion-battery-commercialized':
    "Whittingham's TiS2 cell (1976) and Goodenough's LiCoO2 cathode (1980) had established the chemistry. Akira Yoshino's carbon anode (1985) made it safe. Sony commercialized the first modern lithium-ion battery in 1991. Energy density tripled in twenty years. The smartphone, electric car, and grid-storage industries all assume lithium-ion as a substrate. Goodenough, Whittingham, and Yoshino shared the 2019 Nobel.",

  'christian-science-decline':
    "Christian Science had grown from Mary Baker Eddy's 1875 founding to roughly 270,000 US members by 1936 — the country's fastest-growing religion at the peak. Three decades of decline followed: by 1990, 100,000 members; by 2010, under 50,000. The trajectory previewed late-twentieth-century mainline Protestant decline broadly. Religious institutions are not just born and consolidated — they also peak and shrink, and the demographic curves are now legible.",

  'construction-of-the-great-pyramid-of-giza':
    "Old Kingdom Egypt's centralized state (after Narmer, ~3150 BC), copper tools, mathematical surveying, and Nile-fed agriculture created the conditions. Khufu's pyramid (~2600 BC) put 2.3 million stone blocks averaging 2.5 tons each into a precisely-aligned 147-meter structure over about 26 years. The first project at this scale ever attempted. State capacity to coordinate tens of thousands of workers across decades was now demonstrated.",

  'wi-fi-802-11b-standard':
    "Hertz's radio-wave detection (1887) and decades of spectrum allocation had made wireless data possible. The 802.11 standard (1997) was slow (2 Mbit/s) and expensive. The 802.11b amendment (1999) brought 11 Mbit/s on the unlicensed 2.4 GHz band at consumer prices. The Apple iBook (July 1999) shipped with a built-in card. Wi-Fi turned every laptop into a wireless terminal. The mobile internet's first scaffold.",

  'jstars-enters-service':
    "AWACS (1977) had given the US Air Force airborne early warning over its own territory. JSTARS (E-8C, entered service 1991, just in time for Desert Storm) extended the model to ground surveillance: airborne radar tracked moving vehicles across hundreds of kilometers and relayed coordinates to attack aircraft and artillery. The Iraqi armored columns at Khafji were the first targets. Battlefield awareness as an integrated multi-platform service.",

  'buddhism-four-noble-truths':
    "The Vedic religious system (1500 BC onward) had treated suffering as the work of gods or fate. Siddhartha Gautama's enlightenment (~528 BC) reframed it as a problem with a diagnosis (suffering exists, has a cause, has an end, has a path). The Four Noble Truths and Eightfold Path made suffering tractable through practice rather than ritual. The most rigorous pre-modern framework for what would later be called mind science.",

  'codex-format-bound-pages':
    "Scrolls had been the universal text format for two millennia. Random access required unrolling. Christianity's textual practice (gospel readings during liturgy) needed faster lookup; the codex — bound, paginated, foldable — gave it. Adopted by Christian communities by the 2nd century, then standard for legal and reference texts by the 4th. The book as a random-access medium. The format dominated for fifteen hundred years until the screen.",

  'muhammad-prophetic-call':
    "The Arabian peninsula in 570 was a tribal merchant world without a unifying scripture or state. Christianity (split East-West) and Judaism (Babylonian Talmud just being compiled) had textual canons; Arab religion was oral and local. Muhammad's birth (~570) and his recitation (610) gave Arabia a recited scripture, a community (umma), and within a century the foundations of an empire from Spain to the Indus. The biographical anchor for one-fifth of humanity.",

  'bitcoin-blockchain':
    "The 2008 financial crisis was a fresh case study in counterparty trust failure. Public-key cryptography (1976) and Merkle trees (1979) had given the primitives. Satoshi Nakamoto's October 2008 paper combined them into a working trustless ledger: a chain of blocks, each cryptographically linked, each block confirmed by costly proof-of-work. The first system that replaced institutional trust with computation. Whatever Bitcoin becomes, the design is now infrastructure.",

  'brain-computer-interface-neuralink-braingate':
    "BrainGate (early 2000s) had shown that paralyzed patients could control a cursor using motor-cortex implants. Neuralink (founded 2016) made the surgical procedure semi-automated and increased channel density. By 2023, paralyzed patients could control computers directly with neural signals — typing, emailing, browsing. The communication channel between brain and world reopened for people who had lost it. The medical-device frontier with the deepest implications for what counts as a person.",

  'mcculloch-pitts-first-mathematical-neuron':
    "Pitts had been a runaway teenager studying logic; McCulloch was a neurophysiologist. Their 1943 paper modeled a neuron as a binary threshold device — fires if weighted inputs exceed a threshold, else silent — and proved that networks of such units could compute any logical function. The first formal description of neural computation. Every artificial neural network and most theoretical neuroscience descends from this paper, written before any computer existed in working form.",

  'george-miller-working-memory-limits-7-2':
    "James (1890) had described working memory loosely as the 'specious present.' By 1956, the experimental evidence had converged: memory span for digits, letters, and words clustered around seven items. Miller's 'Magical Number Seven, Plus or Minus Two' synthesized the finding and introduced the chunk — the unit of working memory is not the item but the meaningfully grouped item. UI design, instructional design, and cognitive-load theory all rest on Miller's bound.",

  'split-brain-research-two-hemispheres-sperry':
    "Severe epilepsy in the 1960s was treated by cutting the corpus callosum. Sperry's lab studied the resulting patients with each eye showing different stimuli. The two hemispheres operated independently — the left could speak about what the right hand drew but not what the left hand drew. Hemispheric specialization (language left, spatial right) became experimentally tractable. 'The brain' was no longer a single agent. Sperry's Nobel: 1981.",

  'implicit-association-test-iat':
    "Cognitive psychology had measured prejudice with self-report questionnaires that respondents could (and did) game. Greenwald, McGhee, and Schwartz's 1998 IAT measured reaction-time differences for category-attribute pairings (e.g., flowers-good vs flowers-bad). Implicit biases that people don't consciously hold — and don't endorse — appeared in millions of test-takers. The validity of the IAT as a predictor of behavior is debated. The basic finding — attitudes operate at multiple levels — is not.",

  'french-revolution-popular-sovereignty':
    "American independence (1776) had shown that a colonial population could declare itself a nation. Smith's Wealth of Nations (1776) had given commerce its theory. The French Revolution (1789) put the political claim in the European center: the Declaration of the Rights of Man asserted sovereignty in the nation, not the monarch. The guillotine removed Louis XVI; the Declaration removed the principle. Nationalism, popular sovereignty, and modern democracy take their template from this rupture.",

  '2008-financial-crisis-too-big-to-fail':
    "Glass-Steagall's 1999 repeal had let commercial banks combine with investment banks. Securitization had moved mortgage risk off balance sheets, then back on. Lehman's collapse (September 2008) revealed counterparty interconnection: any major bank's failure could pull down the system. Bailouts kept the financial system intact and exposed its political economy: the largest firms were too big to fail, and that knowledge made future risk-taking cheaper for them. The Dodd-Frank Act (2010) and global Basel III rules followed.",

  'genocide-convention-defining-a-new-crime':
    "Mass killings of national, ethnic, racial, and religious groups had been recurrent in human history without a name in international law. Lemkin's 1944 coinage 'genocide' (Greek genos + Latin -cide) gave it one. The 1948 Convention defined the crime, criminalized intent (acts committed with intent to destroy a group, in whole or in part), and committed signatories to prevent and punish it. The legal basis for every subsequent prosecution from the ICTY to the ICC.",

  'v-2-rocket-ballistic-missile-warfare':
    "Goddard's liquid-fuel rocket (1926) and the German Army's funding of Peenemünde (1932) produced the first ballistic missile. The V-2 (1944) flew to the edge of space and fell unpredictably on London from 300 miles away — defenseless. Wernher von Braun's team was captured by the Americans and became the foundation of NASA. The Soviet program, the ICBM, the moon program, and the modern space industry are all von Braun's V-2 with successively cleaner provenance.",

  'nostra-aetate-catholic-jewish-reconciliation':
    "Catholic teaching had carried 'deicide' — Jewish collective guilt for the Crucifixion — for nineteen centuries. The Holocaust forced a reckoning. Vatican II's Nostra Aetate declaration (1965) explicitly repudiated the charge, condemned antisemitism, and acknowledged spiritual truth in non-Christian religions. Centuries of Catholic-Jewish relations turned in five paragraphs. Subsequent papal apologies and the Catholic-Jewish theological dialogue all build on this declaration.",

  'james-lange-theory-of-emotion':
    "Common sense had treated emotion as a mental state that caused bodily reactions — we shake because we're afraid. James (1884) and Carl Lange (1885) independently inverted the order: emotion is the perception of bodily change. We're afraid because we shake. The peripheral theory dominated emotion research for forty years before Cannon-Bard challenged it. Modern affective neuroscience treats both as partial — body and brain feed back on each other in a continuous loop.",

  'k-bler-ross-stages-of-grief':
    "Modern medicine had been treating dying patients as cases to be hidden from. Kübler-Ross's On Death and Dying (1969) interviewed terminally ill patients and proposed five stages: denial, anger, bargaining, depression, acceptance. Clinically the model is too neat — grief is rarely linear, the stages overlap, some never reach acceptance. Culturally it gave patients and families a vocabulary they hadn't had. Hospice care and bereavement counseling both took the framework as starting point.",

  'positive-psychology-wellbeing-as-science':
    "Psychology since Freud had focused on pathology — anxiety, depression, dysfunction. Seligman's APA presidential address (1998) argued the field had ignored what makes life worth living: strengths, virtues, flow, meaning. Positive psychology grew from a niche into a movement with empirical methods. The PERMA model (Positive emotion, Engagement, Relationships, Meaning, Accomplishment) and well-being measurement entered psychology, education, and workplace research. Critics call it underspecified; the move from pathology-only is permanent.",

  'american-revolution-republican-government-at-scale':
    "Montesquieu (1748) had argued that republican government required civic virtue and could only sustain in small city-states; large polities needed monarchy. The American Revolution and the 1787 Constitution tested the reverse: representation, federalism, and a written constitution could scale republican government across a continent. Madison's Federalist No. 10 reframed the bug as a feature — large republics dilute factional concentration. The model was exported, modified, and naturalized worldwide.",

  'declaration-of-the-rights-of-man':
    "The American Declaration of Independence (1776) had asserted natural rights as a colonial protest. The French National Assembly's Declaration of the Rights of Man (August 26, 1789) made it a constitutional principle without a war: liberty, property, security, resistance to oppression, freedoms of speech and religion, equality before the law. Rights derived from natural law, not from the king's grant. Every subsequent rights catalogue in liberal-democratic constitutions echoes this text.",

  'the-revolutions-of-1848-nationalism-and-liberalism':
    "The Congress of Vienna (1815) had restored European monarchies after Napoleon. Industrialization, the Hungry Forties' famines, and rapid urban growth had built pressure for thirty-three years. Simultaneous risings across France, the German states, the Austrian Empire, and Italy in 1848 demonstrated that nationalist and liberal demands had become mass forces. Most failed within a year. But the issues — universal manhood suffrage, national unification, constitutional rule — remained on the agenda, and most were granted by 1871.",

  'nuremberg-charter-crimes-against-humanity':
    "International law had treated war crimes as offenses against the laws and customs of war between states. The Holocaust required a category that didn't yet exist: crimes against humanity, atrocities so severe they were criminal regardless of whether domestic law permitted them. The Nuremberg Charter (August 1945) defined the category, established individual criminal responsibility, and rejected 'following orders' as a defense. The legal substrate for every war-crimes prosecution since.",

  '19th-amendment-womens-suffrage-us':
    "The Seneca Falls Convention (1848) had launched organized US suffrage advocacy. Seventy-two years of lobbying, marches, hunger strikes, and a state-by-state campaign produced the 19th Amendment (ratified August 18, 1920). Combined with similar movements in the UK (1918, 1928) and across Europe, women's suffrage doubled the voting population of democracies. The political demand cycle and the legislative agenda rebalanced — child welfare, education, public health became campaign issues.",

  'prague-spring-limits-of-soviet-reform':
    "Khrushchev's de-Stalinization (1956) and Kádár's Hungarian compromise had suggested communism could liberalize within the Bloc. Dubček's Action Programme (April 1968) — 'socialism with a human face' — pushed press freedom, parliamentary democracy, market reforms, and federalization within Czechoslovakia. Soviet tanks rolled in on August 21, 1968. The Brezhnev Doctrine declared the USSR would intervene against any reform threatening communist rule. Reform from within the Bloc was now closed.",

  'tiananmen-square-limits-of-chinese-liberalization':
    "Deng Xiaoping's economic reforms (1978 onward) had grown the Chinese economy at 10% a year. Western and Chinese intellectuals assumed political liberalization would follow. The student protests in Tiananmen Square (April-June 1989) tested the assumption. The People's Liberation Army's June 4 crackdown ended it. The 'China model' — authoritarian capitalism with Leninist political control — became the durable alternative to liberal democracy. Three decades of GDP growth without political opening followed.",

  'opec-founded-resource-nationalism':
    "The 'Seven Sisters' international oil companies had set crude prices unilaterally for fifty years. Venezuela, Iran, Iraq, Kuwait, and Saudi Arabia founded OPEC in Baghdad (September 1960) to coordinate pricing and protect national revenues. The 1973 Yom Kippur embargo — quadrupled oil prices, gas-station lines in Western cities — demonstrated the cartel's power and the developed world's dependency. Energy security became a permanent foreign-policy category.",

  'pfizer-biontech-mrna-vaccine-programmable-immunization':
    "mRNA vaccine research had been refining lipid-nanoparticle delivery and codon optimization since the 2000s. The COVID-19 outbreak in early 2020 collapsed the development timeline: BioNTech designed the BNT162b2 candidate from the published viral sequence within days; trials enrolled at unprecedented scale; emergency use authorization came eleven months later. The platform is programmable — change the mRNA sequence, change the vaccine. Flu, RSV, and cancer vaccines now have mRNA pipelines.",

  'claude-3-opus-sonnet-frontier-intelligence-accessible-via-api':
    "GPT-4 (March 2023) had set the ceiling for frontier capability at API-tier pricing accessible only via OpenAI. Anthropic's Claude 3 family (March 2024) — Opus, Sonnet, and Haiku — matched or exceeded GPT-4 on most benchmarks while opening pricing tiers an order of magnitude lower for the smaller models. Multiple frontier labs at simultaneous parity made AI capability a genuinely competitive market for the first time.",

  'llama-3-1-405b-open-source-matches-closed-frontier':
    "Llama 2 (July 2023) had been credibly competitive with GPT-3.5 but a generation behind GPT-4. Llama 3.1 405B (July 2024) closed the gap: open weights, runnable on a workstation cluster, competitive with GPT-4 and Claude 3 Opus on standard benchmarks. The first open-weight model at the frontier, not behind it. Mistral, Falcon, and Qwen followed. The closed-vs-open axis became the durable AI policy debate.",

  'gps-foc-1995':
    "Marine chronometers (1761) had solved longitude on water. Aviation navigation by radio beacons (1930s onward) had accumulated workarounds for low precision. The 24-satellite GPS constellation reached Full Operational Capability on April 27, 1995, providing meter-level civilian positioning worldwide. Selective Availability degradation was turned off in May 2000. Precision agriculture, smartphone navigation, ride-sharing, and autonomous vehicles all assume GPS as a free utility.",

  'ebbinghaus-forgetting-curve':
    "Helmholtz had measured nerve-conduction speed (1850) and reaction time (1860). Higher mental processes — memory, learning — had been treated as inaccessible to experiment. Ebbinghaus learned and re-learned lists of nonsense syllables on himself (1879-1885) and produced quantitative laws: the forgetting curve, spaced repetition's superiority, the savings method. The first quantitative laws of memory. Anki, Quizlet, and every modern study tool descend from his nonsense syllables.",

  'pavlov-classical-conditioning':
    "Late nineteenth-century psychology had been introspective. Pavlov, studying dog digestion, noticed that the dogs salivated before the food arrived — at the sound of the bell, the lab assistant's footsteps. He pivoted: a measurable physiological learning process, paired stimuli producing conditioned reflexes. His 1903 Madrid Congress address founded behaviorism's experimental program. Watson and Skinner ran with the framework for fifty years.",

  'bartlett-schema-reconstructive-memory':
    "Ebbinghaus's nonsense syllables had stripped memory of meaning. Bartlett's Remembering (1932) put it back: he asked English subjects to read a Native American folk tale ('The War of the Ghosts') and retell it days, weeks, months later. The retellings progressively schematized the story toward English narrative conventions. Memory wasn't replay; it was reconstruction shaped by cultural schemas. Cognitive psychology's constructive view of memory took thirty years to catch up to Bartlett.",

  'hm-hippocampus-memory-case':
    "Lashley's mass-action experiments (1929) had argued that memory wasn't localized in the brain. Patient H.M. (Henry Molaison) had bilateral medial temporal lobectomy in 1953 to control epilepsy. The surgery removed his hippocampi. He could no longer form new episodic memories — but he could learn motor skills. Brenda Milner's documentation (from 1957) demonstrated that distinct memory systems map to distinct brain structures. The hippocampus's role in episodic memory was now experimentally fixed.",

  'sperling-iconic-memory':
    "Working memory had been measured at 7±2 items (Miller, 1956). Whether a larger sensory buffer preceded it was an open question. Sperling's 1960 partial-report procedure flashed a 12-letter array for 50 milliseconds, then cued the subject to report only one row. Subjects could report any cued row almost completely — but only if cued within ~250 ms. A high-capacity, fast-decaying visual store existed. Iconic memory entered the textbook before it had a name.",

  'carnot-heat-engine-cycle':
    "Watt's steam engine (1769) had been improved empirically for fifty years without theoretical understanding of efficiency limits. Carnot's Reflexions sur la puissance motrice du feu (1824) defined the ideal reversible heat-engine cycle and proved that engine efficiency depends only on the temperatures of the hot and cold reservoirs — not the working fluid, not the engineering. The first foundation of thermodynamics. The Second Law was now an engineering constraint.",

  'zoroastrianism-achaemenid-state-religion':
    "Zoroaster's teaching had spread regionally in eastern Iran for centuries before any state adopted it. Cyrus the Great's founding of the Achaemenid Empire (550 BC) gave Zoroastrianism the institutional infrastructure of the largest empire the ancient world had yet seen — Persian satraps, royal patronage, fire temples from Anatolia to the Indus. The first ethical-monotheism state religion at imperial scale. Judaism (post-Babylonian-exile), Christianity, and Islam all show Zoroastrian fingerprints.",

  'fire-stick-farming-2':
    "Australian Aboriginal peoples by ~50,000 BC were systematically using fire to manage landscape — burning to open dense brush, regenerate fresh grass, drive game, and reduce fuel loads. The first recorded large-scale ecological engineering by humans, predating agriculture by 40,000 years. The continent's grassland-and-eucalypt vegetation pattern was partly a product of this management. Bill Gammage's The Biggest Estate on Earth (2011) reframed Australian colonial history around it.",

  'grinding-slab':
    "Wild grains existed across the savanna and steppe but were too hard to eat whole. Grinding slabs (mortars and quern-stones) appeared by ~23,000 BC in the Levant and Australia — coarse stone surfaces against which seeds could be crushed for human and weaning-infant food. Pre-agricultural processing technology. Without it, the broad-spectrum revolution and the eventual transition to grain agriculture would have been chemically impossible.",

  'roman-grain-drying-ovens':
    "Mediterranean grain harvest assumed sun. Northern provinces — Britain, Gaul — had wetter climates that rotted standing or stored crops. Roman provincial farms (1st-3rd century AD) developed kiln-style ovens with raised drying floors above flue heat to artificially dry grain after harvest. Storage extended through wet seasons; provincial agriculture became viable at scale. Britain in particular shifted from food-import to grain-export under the model.",

  'corn-sheller':
    "Removing kernels from corn cobs had been entirely manual since maize's domestication — slow, hard on the hands, the bottleneck after harvest. Lester Denison's hand-cranked corn sheller (patented 1839) pulled cobs through metal-toothed cylinders that stripped the kernels in seconds. By 1860, factory-made shellers in farms from Iowa to Argentina; by 1900, steam-powered versions threshed entire wagonloads. The bottleneck moved from harvest-and-shelling to logistics.",

  'steam-plow-john-fowler':
    "Horse-drawn plowing limited what one farmer could turn over in a day; deep clay soils were nearly impossible. The Bessemer process (1856) had made structural steel cheap. John Fowler's cable-drag steam plow (1858) put two stationary traction engines at opposite ends of a field with a plow on a winch between them — drawing it back and forth, no horses needed. The first time mechanization broke the team-of-horses bottleneck on tillage. Combine harvesters and tractor plows were the obvious next step.",

  'soybean-processing-for-oil-and-meal':
    "Soybeans had been a staple in East Asian cooking for millennia, processed locally into tofu, soy sauce, and miso. Hexane solvent extraction (commercialized in the US in the 1930s-40s) separated the oil from the meal at industrial scale: oil for margarine and frying, meal for animal feed. Soybean acreage in the US tripled between 1940 and 1960. Industrial livestock — pork, chicken — runs on soy meal. Half of all global feed protein is now soybean.",

  'theatre-of-pompey':
    "Roman law had banned permanent stone theatres on moral grounds — they encouraged the leisure and theatricality of the Greeks. Pompey the Great (55 BC) built one anyway, on the Field of Mars, and dedicated the structure as a temple of Venus Victrix with stadium seating that 'happened to' face a stage. The legal pretext stuck. Every subsequent Roman theatre and the Colosseum follow the design. Public spectacle as a permanent civic institution was now lawful.",

  'vitruvius-writes-de-architectura':
    "Greek architecture had developed proportional canons (Vitruvius cites Pytheos, Hermogenes) without a written treatise. Vitruvius's De architectura (c. 25 BC), dedicated to Augustus, was the first systematic written architectural theory: ten books on materials, proportions, water supply, machines, and the design philosophy of firmitas, utilitas, venustas. The only such treatise to survive antiquity. Rediscovered in 1414, it shaped Renaissance architecture, Palladio, and every architectural school curriculum since.",

  'codex-adoption-in-rome':
    "The codex (bound, paginated, foldable book) had originated as wax-tablet notebooks. Christians adopted it early — random access mattered for liturgical readings — and used it for gospels by the second century. Roman secular literature held to the scroll for another century. Martial's epigrams (~85 AD) advertised codex versions of his works as more portable. The codex won decisively by 400 AD; the format then dominated for fifteen hundred years.",

  'invention-of-the-atlatl':
    "Hand-thrown spears had limited range and force. The atlatl (spear-thrower) — a hooked stick that effectively extends the throwing arm — roughly doubles the velocity and triples the energy of a thrown dart. Appearing in Eurasia and the Americas by ~20,000 BC. The first projectile-amplification technology. Hunting at distance became safer; large-game collapse in the Late Pleistocene tracks the spread of atlatls. Bows replaced atlatls in most regions but the device persisted in Mesoamerica and Inuit Arctic hunting.",

  'first-known-use-of-yeast-for-bread-and-beer':
    "Wild yeasts had fermented sugars opportunistically wherever fruit went bad. Pre-pottery Neolithic peoples noticed that grain mash, given time, produced both bread and beer. By 3500 BC at Godin Tepe (modern Iran), pottery jars carry chemical residues confirming intentional barley-beer fermentation. Bread and beer share the same biology — yeast on starch — and emerged together. The first deliberate microbial process.",

  'theophrastus-characters-ecological-types':
    "Aristotle had classified animals; plants were the gap. Theophrastus, his student and successor at the Lyceum, wrote Historia Plantarum and De Causis Plantarum (~300 BC) — the first systematic botany: morphology, propagation, ecological type, geographical distribution. About 480 species described. The work survived through Arabic and Latin translation; Linnaeus (1753) used Theophrastus's terms as the bedrock layer of his nomenclature.",

  'pliny-the-elder-on-bee-behavior-and-honey':
    "Pre-Pliny natural history had been folkloric. Pliny's Naturalis Historia (77 AD), thirty-seven books drawing on 2,000 sources, was the first encyclopedic compilation of ancient natural knowledge. Book 11 on bees described colony social structure, swarming, drone-vs-worker roles, and honey production with detail not surpassed for fifteen centuries. The work was the standard European reference until Buffon (1749).",

  'kitab-al-hayawan':
    "Aristotelian zoology had been preserved in Greek manuscripts in Byzantine and Syriac libraries. The Abbasid translation movement (8th-10th centuries) rendered them into Arabic. Al-Jahiz's Kitāb al-Hayawān (c. 850) — seven volumes drawing on Aristotle, Quranic references, Bedouin folklore, and direct observation — is the first major Arabic zoology. Includes early observations of food chains, environmental determinism, and behavioral adaptation.",

  'al-idrisis-tabula-rogeriana':
    "Ptolemy's Geography (150 AD) had been the standard cartographic reference for a millennium. Roger II of Sicily (a Norman king with Arab and Greek scholars at court) commissioned Al-Idrisi to compile a fact-checked atlas. The Tabula Rogeriana (1154) used 70 sectional maps based on traveler interviews and surveyor reports, oriented south-up by Arabic convention. The most accurate world map for nearly four centuries — until Mercator (1569).",

  'eustachis-anatomical-plates':
    "Vesalius's De humani corporis fabrica (1543) had remade external and skeletal anatomy. Internal organs — especially teeth, kidneys, and the inner ear — remained schematic. Bartolomeo Eustachi's anatomical plates (1564, but printed only in 1714 from rediscovered originals) showed the Eustachian tube, the kidney's tubular structure, and tooth dentition with precision unmatched until the 18th century. When the plates resurfaced, anatomy textbooks were rewritten around them.",

  'photography-daguerreotype':
    "Camera obscura (Arab and European, from the 11th century) had been used to project images for tracing. Niépce's heliograph (1826) had captured the first photograph after eight hours of exposure. Daguerre's daguerreotype (1839) used silver-iodide-coated copper plates and mercury vapor development to capture sharp images in twenty minutes — and made the process commercially accessible. Within a decade, portrait studios in every major city. Hand-drawing as the only way to record an image was over.",

  'synthetic-biology-circuit-design-automation':
    "Recombinant DNA (Cohen-Boyer, 1973) had shown that DNA fragments could be cut, ligated, and expressed in bacteria. The first plasmid cloning experiment that same year confirmed it. Synthetic biology's later promise — genetic circuits assembled from standardized parts — rests on this foundation. The BioBrick standard (2003), iGEM, and modern strain engineering all assume DNA can be designed in software, ordered from a vendor, and inserted into a chassis organism. Cohen and Boyer made that path real.",

  'microbiome-wide-association-studies':
    "Genome-wide association studies (GWAS, from 2005) had linked SNPs to disease phenotypes at population scale. Cheap shotgun sequencing made the equivalent practical for the gut microbiome by ~2012. Microbiome-wide association studies (MWAS) examined which microbial taxa correlate with obesity, IBD, depression, autoimmune disease. The findings are noisy and the causal direction is contested. The methodology — population-scale microbial profiling — has been the new tool ever since.",

  'lunar-calendar':
    "Day and night had been the only structured timekeeping. Lunar phases — visible to anyone, repeating every ~29.5 days — gave a longer cycle. Notched bones from Upper Palaeolithic Europe (Lebombo bone, ~43,000 BC; Ishango bone, ~20,000 BC) appear to track lunar cycles. The first calendrical structure. Seasonal hunting, festival timing, and gestation-period awareness all become trackable. The lunar month survives in nearly every later calendar.",

  'bronze-alloying':
    "Pure copper had been worked since 9000 BC but was too soft for cutting tools. Tin alloying (about 10% by weight) produced bronze — three to four times harder than copper, castable, edge-holding. Discovered independently around 3500 BC in the Near East and East Asia. The Bronze Age states (Mesopotamia, Egypt, Indus Valley, Shang) are downstream — better tools meant better agriculture, better weapons, and the first centralized bureaucracies that managed the tin trade.",

  'first-use-of-bronze':
    "Stone, bone, and pure copper had each been worked. Tin alloying (~10% by weight) with copper produced bronze — three to four times harder, castable into complex shapes, edge-holding. Independent invention in the Near East and East Asia around 3500 BC. The Bronze Age followed: stronger plows, sharper sickles, harder weapons, and the centralized states required to manage long-distance tin sourcing.",

  'al-khwarizmis-algebra-treatise':
    "Greek mathematics had geometry and a primitive number theory; equations were solved geometrically by analogy. Al-Khwarizmi's Al-Kitāb al-Mukhtaṣar fī Ḥisāb al-Jabr wal-Muqābala (Baghdad, c. 820) introduced systematic procedures for solving linear and quadratic equations — al-jabr (restoration) and al-muqabala (balancing) as distinct operations. The first book-length work treating algebra as its own discipline. Al-Khwarizmi's name became 'algorithm'; al-jabr became 'algebra.'",

  'al-jawhari-commentary-on-euclid':
    "Euclid's Elements had been preserved in Greek and translated into Arabic in the 9th century House of Wisdom. The transmission left gaps: corrupted passages, contested proofs, especially around the parallel postulate. Al-Abbas ibn Said al-Jawhari (c. 860) wrote commentary that fixed corrupted passages and attempted a proof of the parallel postulate from the others — a research direction that wouldn't be resolved until Lobachevsky's non-Euclidean geometry a thousand years later.",

  'xerox-alto':
    "Engelbart's mother-of-all-demos (1968) had previewed the mouse, hypertext, and collaborative editing on a mainframe. The Xerox Alto (1973) at PARC put the demo in a personal-computer cabinet: bitmap display, mouse, Ethernet networking, the desktop metaphor. Xerox never sold it. Steve Jobs's 1979 visit to PARC moved the design into the Lisa (1983) and the Macintosh (1984). Every personal computer interface since is a refinement of the Alto.",

  'code-of-ur-nammu-price-controls':
    "Sumerian commercial life had run on customary law. Ur-Nammu, founder of the Third Dynasty of Ur (~2100 BC), promulgated a written law code — fifty-seven articles surviving — covering theft, assault, marital law, slavery, and crop-and-grain prices. The first written law code in history (predating Hammurabi by three centuries). Fixed silver-equivalent prices for grain and wages stabilized commerce in a polity that depended on long-distance trade.",

  'scythian-gold-trade-with-greeks':
    "Black Sea Greek colonies (Olbia, Panticapaeum, from 600 BC) had connected the Greek world to the Pontic steppe. Scythian elites traded grain, slaves, and gold for Greek wine, olive oil, and luxury metalwork. The exchange produced the famous Scythian gold — Hellenized scenes on Scythian objects, made in workshops at Panticapaeum. The first sustained economic integration of steppe nomads into the Mediterranean economy. The pattern repeated through the Silk Road era.",

  'roman-census-under-augustus':
    "Roman tax collection in the Republic had relied on tax-farming contractors who bid for the right to extract a region's revenue. Augustus's empire-wide census (28 BC, then every five years) replaced the auction with direct accounting: heads counted, property assessed, taxes set. Bureaucratic central administration over a polity of 50 million. The Census of Quirinius in Judaea (Luke 2) is one snapshot of the system; the Domesday Book (1086) is its medieval revival.",

  'mauryan-state-monopoly-on-mining':
    "Mauryan state-building (~320 BC) under Chandragupta and Kautilya had organized fiscal extraction more thoroughly than any previous Indian polity. The Arthashastra codified the doctrine: mining of gold, silver, iron, gems, and salt was a royal monopoly. Private investment in extraction was forbidden. The Mauryas could fund standing armies and the largest infrastructure programs of their era — but also blocked the kind of private capital accumulation that would later drive industrial economies.",

  'barbegal-aqueduct-and-mills':
    "Roman aqueducts had supplied drinking water to provincial cities. The Barbegal mill complex (early 2nd century AD, near Arles) channeled an aqueduct down a hillside through 16 overshot waterwheels in two parallel cascades — the largest known industrial complex of antiquity. Estimated to have ground 4.5 tons of grain per day, enough for 12,000 people. The first known purpose-built industrial water-power site. The model was rare in antiquity but the scale demonstrated what was possible.",

  'horse-collar-in-europe':
    "Throat-and-girth harnesses had choked horses pulling heavy loads — pulling power was capped at roughly 500 lbs. The padded horse collar, invented in Han China (~100 AD) and slowly diffused west via Central Asia, transferred load to the chest and shoulders without restricting the windpipe. Wide European adoption around 1000 AD raised horse pulling power to 3,000 lbs. Heavy plows in clay soils, larger wagons, and the medieval agricultural surplus all depend on the collar.",

  'antwerp-bourse-building':
    "Italian merchant cities had hosted bourses informally on bridges or in churches since the 1300s. Bruges had a regular merchant gathering by 1400. Antwerp's purpose-built Bourse (1531) — a covered courtyard with arcades, dedicated to merchant gathering, with posted prices — was the first physical commodity exchange. The Latin motto over the door declared it for 'merchants of all nations and tongues.' Amsterdam (1611) and London (Royal Exchange, 1571) copied the building and the institution.",

  'mfs-investment-management':
    "Closed-end investment trusts had pooled capital for diversified portfolios since the 1860s, but their share prices traded at premiums or discounts to net asset value, locking out small investors at fair price. MFS's Massachusetts Investors Trust (March 1924) issued and redeemed shares daily at the underlying NAV — the first open-end mutual fund. Diversified portfolio access for retail investors at fair price. By 2000, mutual funds held a larger fraction of US wealth than any other vehicle.",

  'first-online-stock-trade-k-aufhauser':
    "Discount brokerages (Schwab, 1975) had cut commissions to retail levels. Quote services (1980s) gave individual investors near-real-time prices. The internet made the missing piece — order entry — possible. K. Aufhauser & Co. executed the first online stock trade in August 1994. E*TRADE (1996) made it mass-market. Day-trading, the dot-com retail bubble, and the eventual rise of Robinhood all run on the same infrastructure that started here.",

  'nasdaq-crossing-5000':
    "The NASDAQ had been the home of tech IPOs since the 1980s. Internet adoption (1995-2000), the IPO frenzy of 1999, and a wave of retail capital pushed the index from 1,000 in mid-1995 to 5,048 in March 2000 — a 400% rise in five years. The peak crossed within hours of the bubble's break. By October 2002 the index had fallen to 1,114. The largest reset in valuation since 1929. The dot-com era's institutional memory shapes every subsequent tech-cycle valuation discussion.",

  'enron-scandal-and-bankruptcy':
    "Mark-to-market accounting (allowed for energy traders since 1992), special-purpose entity vehicles (allowed under SFAS 140), and complicit auditing (Arthur Andersen) had let Enron book future revenues as current and shift debt off-balance-sheet for years. The Wall Street Journal's October 2001 investigation collapsed the company in two months. Andersen dissolved. Sarbanes-Oxley (2002) tightened audit oversight, mandated CEO/CFO certification, and made off-balance-sheet hiding much harder. The tick that produced US corporate-governance reform.",

  'egyptian-hieroglyphs-mature':
    "Early hieroglyphs had been administrative tags on goods. By the Middle Kingdom (~2000 BC), the system carried full literary, religious, and royal-monumental texts in about 900 distinct signs combining logograms, phonetic signs, and determinatives. Ramesside-era scribal training preserved the system's literary form for two millennia. The first writing system that could record narrative literature; a competitor to cuneiform that lasted longer than any of the empires that used it.",

  'hebrew-script-transition-to-square-aramaic':
    "Paleo-Hebrew had been the script of the Israelite kingdoms before the Babylonian exile. Aramaic — the lingua franca of the Persian Empire — became the working language of Jewish communities after 539 BC. By the 5th-4th centuries BC, Jewish scribes adopted the Aramaic 'square' script for Hebrew texts as well. The Dead Sea Scrolls show the transition complete by 200 BC. The Hebrew Bible's surviving manuscripts are all in the new script. Paleo-Hebrew survived only as a sacred archaism.",

  'mozis-logical-and-linguistic-thought':
    "Confucian and Daoist thought had focused on ethics and metaphysics. The Later Mohist canon (~300 BC) — the Dialectical Chapters of the Mozi — turned the lens on language itself: definitions, distinctions, paradoxes, classification, the relation between names and reality. The first systematic logical analysis in classical Chinese. Buried with the Qin book burnings (213 BC), rediscovered in the 19th century, and now read alongside Aristotle and Pāṇini as the third great independent emergence of formal logic.",

  'library-of-alexandria-founded':
    "Pre-Alexandria collections had been temple-sized — hundreds of clay tablets or papyrus scrolls stored as tax records. Ptolemy I's library (founded ~300 BC, expanded by Ptolemy II) aimed at universal coverage: every scroll on every ship docking at Alexandria copied for the collection. At peak, 400,000 to 700,000 scrolls. The first knowledge-aggregation institution at imperial scale. Eratosthenes calculated the Earth's circumference there. Most of what we have of Greek literature passed through the library's editorial copying.",

  'photostat-machine':
    "Document copying had meant hand-transcription, hand-press copying machines (which produced one wet-ink mirror copy), or photographic plate cameras. The Photostat machine (1907, Kodak's Rectigraph) used a built-in lens, a mirror, and a roll of photosensitive paper to produce a usable copy directly without negatives. Office adoption was slow and the machines were expensive. Carlson's xerography (1938) eventually replaced them. The first office machine that could copy a page in under a minute.",

  'laser-printer-xerox':
    "Xerox copiers (1959 onward) had used a fixed image to mark photoreceptor drums. Gary Starkweather (1969-1971) realized the same drum could be marked by a modulated laser beam — every page individually programmable. The Xerox SLOT (1971) was the first laser printer. The IBM 3800 (1976) made it commercial. The Apple LaserWriter (1985) made desktop publishing viable: every author could now produce typeset-quality pages without a press. Print quality was no longer a publisher's privilege.",

  'voyager-golden-records':
    "The Pioneer plaques (1972) had attached symbolic line-art to the Pioneer probes. Voyager 1 and 2 (1977) carried something larger: gold-plated copper records with 116 images, greetings in 55 languages, music from Bach to Chuck Berry, and the sound of a kiss. Carl Sagan led the curation committee. Etched on the cover: instructions for playing the record at the right speed and a star-positioning diagram identifying Earth. The first deliberate interstellar message designed to outlive the species that sent it.",

  'mixture-of-experts':
    "Dense neural networks ran every parameter for every input — capacity scaled with compute. Jacobs, Jordan, Nowlan, and Hinton's 1991 mixture-of-experts paper proposed routing inputs to specialized sub-networks (experts) via a gating function — capacity scaled while compute stayed roughly fixed. Mostly ignored for two decades. Switch Transformer (2021) and the GPT-4 architecture (rumored to be MoE) revived the idea. Most frontier 2024 models use sparsely-activated MoE under the hood.",

  'hotmail-first-webmail-service':
    "Email had been ISP-tied since the 1980s — your address was your-name@your-isp. Switching jobs or providers meant losing the address. Sabeer Bhatia and Jack Smith's Hotmail (July 4, 1996) put email behind a web page accessible from anywhere with a browser. The address persisted regardless of where you connected. Microsoft acquired Hotmail in 1997 for $400 million. Webmail became the default. Gmail's 1GB-free launch (2004) was Hotmail's grandchild.",

  'earliest-known-use-of-poison-for-hunting':
    "Stone-tipped projectiles had increased range; muscle still had to deliver lethal force in one shot. Residue analysis of stone arrowheads from Border Cave and Umhlatuzana Rock Shelter, South Africa (~60,000 BC) confirmed the deliberate application of plant alkaloids — ricinoleic acid from castor bean, in some cases. The first known chemical augmentation of weapons. Smaller hunters could now bring down larger prey. African hunting kits (and most San groups today) preserved the practice.",

  'code-of-ur-nammu':
    "Sumerian commercial life had run on customary law and case-by-case decisions. Ur-Nammu, founder of the Third Dynasty of Ur (~2100 BC), promulgated a written law code on stone — fifty-seven articles surviving — covering theft, assault, marital law, slavery, and crop-and-grain prices in fixed silver-shekel equivalents. The first written law code anywhere. Predates Hammurabi by three centuries. Standardized law was now portable; merchants and scribes could cite a tablet, not a ruling.",

  'hittite-laws':
    "Hammurabi's Code (1754 BC) had used 'an eye for an eye' retribution as the default. The Hittite Laws (~1650 BC, in Hittite cuneiform) substituted compensation in silver or livestock for most physical penalties — the first major legal code organized around restitution rather than retribution. Less brutal in nominal text; harshness reserved for slaves and certain specific crimes. The Hittite approach influenced later Anatolian and Aegean legal traditions.",

  'laws-of-manu':
    "The Vedas had supplied ritual law; the Dharmasūtras (600-200 BC) supplied caste and household duty. The Manusmriti or Laws of Manu (compiled ~200 BC-200 AD) systematized the lot: 2,685 verses on cosmology, the four varnas, householder duties, royal law, court procedure, and atonement. The most influential legal text in the Hindu tradition for two millennia. British colonial courts used Manu as Hindu personal law. Modern scholars debate its actual historical authority versus its Brahminic-canonical status.",

  'creation-of-the-quaestio-perpetua':
    "Roman criminal trials had been ad hoc — the senate or a popular assembly convened in response to specific cases. The lex Calpurnia de repetundis (149 BC) created the first standing jury court (quaestio perpetua) — for prosecuting magistrates accused of provincial extortion. By the late Republic there were at least eight standing courts, each with its own statute and procedure. The first permanent specialized criminal courts. The model survived into imperial Roman law and was rediscovered by medieval canon lawyers.",

  'praetorian-edict-system-formalized':
    "Roman praetors had issued an edict at the start of each annual term setting out the procedures they would follow. In practice, edicts were often modified during the year — a praetor could grant or refuse a remedy mid-case. The lex Cornelia de edictis (67 BC), part of Sulla's reforms, required the praetor to follow his own published edict for the whole year. The first explicit procedural rule of binding precedent. Roman jurisprudence's accumulating doctrine begins to be canonical.",

  'paris-convention-for-the-protection-of-industrial-property':
    "Patents and trademarks had been national monopolies — protected only within the granting country. International exhibitions (the 1873 Vienna World Exhibition, the 1878 Paris Exhibition) had exposed the awkwardness: foreign inventors withheld participation rather than have their work copied without protection. The Paris Convention (1883) created a treaty union: each member country would treat foreign inventors and brand-owners as if they were nationals. The first international IP regime. WIPO's 19th-century parent.",

  'communications-decency-act-section-230':
    "Pre-1996, online platforms were caught between Stratton Oakmont v. Prodigy (1995, finding moderation made you a publisher liable for content) and Cubby v. CompuServe (1991, finding non-moderation made you a distributor not liable). Section 230 of the Communications Decency Act (February 1996) gave platforms a third option: moderate without becoming a publisher. The 26 words ('No provider or user of an interactive computer service shall be treated as the publisher or speaker of any information provided by another information content provider') made the modern web possible. Every social platform's business model rests on Section 230.",

  'a-m-records-v-napster':
    "Sony Corp. v. Universal Studios (1984, the Betamax case) had immunized technology vendors from secondary liability for substantial non-infringing uses. Napster (1999) tested whether peer-to-peer file-sharing fit the Betamax umbrella. The Ninth Circuit (2001) said no: Napster's central index gave it knowledge of and control over infringing transfers, making it contributorily and vicariously liable. Napster shut down. Decentralized successors (Kazaa, BitTorrent) routed around the holding by removing the central index — the legal arms race that defined a decade of file-sharing.",

  'partnership-on-ai-founding':
    "AI safety as a research field (FHI, MIRI from the early 2000s) had been small and academic. By 2016, frontier AI was being built inside a handful of companies whose competitive incentives were unaligned with measured deployment. The Partnership on AI (September 2016) — Amazon, DeepMind, Facebook, Google, IBM, and Microsoft as founding members — created a multi-company forum for shared best practices. Limited in teeth but the first signal that companies were taking responsibility seriously enough to organize.",

  'right-to-explanation-gdpr':
    "Algorithmic decision-making (credit scoring, hiring, risk assessment) had become consequential without recourse. GDPR Article 22 (effective May 2018) gave EU residents a right not to be subject to solely automated decisions with significant effects, and Recital 71 added a right to 'meaningful information about the logic involved' in such decisions. The first enforceable explainability requirement at scale. The interpretability research field has been racing to deliver explanations that satisfy the regulator ever since.",

  'imhoteps-surgical-texts':
    "Pre-Imhotep Egyptian medicine had been magical — invocation, amulet, charm. Imhotep (c. 2600 BC), Djoser's vizier and architect of the Step Pyramid, is traditionally credited with the empirical surgical tradition that the Edwin Smith Papyrus (c. 1600 BC, but copied from a much older source) records. The papyrus describes 48 cases — head wounds, fractures, dislocations — diagnosed and treated by observation and manipulation, not magic. The first medical text we have anywhere.",

  'sushruta-samhita':
    "Pre-Sushruta Indian medicine had focused on internal disease. The Sushruta Samhita (compiled in its surviving form by 300-400 AD, drawing on much older oral tradition) is a 184-chapter surgical treatise. Topics: cataract surgery, cesarean section, amputation, plastic reconstruction (especially the Indian rhinoplasty technique that European surgeons would later borrow). The first systematic surgical canon — and the source of techniques that survived in unchanged form into the colonial period.",

  'first-successful-surgical-treatment-of-appendicitis-fitz':
    "Appendicitis had been called 'perityphlitis' and treated with rest and prayer. Reginald Fitz, Harvard pathologist (1886), demonstrated that the appendix itself was the inflamed organ and that early surgical removal saved lives. The first appendectomies followed within months. Mortality from appendicitis dropped from over 50% to under 5%. The first procedure to make the operating room a routine destination for ordinary citizens.",

  'da-vinci-surgical-system':
    "Laparoscopic surgery (1980s onward) had reduced incision size but constrained the surgeon's range of motion through small ports. Intuitive Surgical's da Vinci system (FDA cleared 2000) put a robotic surgical platform between surgeon and patient: 3D camera, wristed instruments with seven degrees of freedom, tremor filtering. Over 13 million procedures performed by 2024. The first widely-deployed surgical robot — and the template for every subsequent platform.",

  'invention-of-counting-tokens':
    "Pre-tally counting had relied on memory and spoken numbers — capped at the small numbers human working memory can hold. The Lebombo bone (~43,000 BC, southern Africa) and the Ishango bone (~20,000 BC, Congo) carry sets of notches that almost certainly represent counted objects or lunar cycles. The first external numerical notation. Quantities became transmittable across people and across time without a witness.",

  'ohalo-ii-intentional-plant-storage':
    "Pre-agriculture food storage had been opportunistic — caches in caves, smoking, drying. Ohalo II (~23,000 BC, on the Sea of Galilee) preserved grain seeds, grinding stones, and brushwood huts in waterlogged sediment. Some seeds show signs of small-scale cultivation. Eleven thousand years before the Neolithic. The first archaeological evidence of intentional plant storage — and the first hint that 'agriculture' was a slow accumulation of practices rather than a single revolution.",

  'boyles-corpuscularianism-explains-sensation':
    "Aristotelian natural philosophy had explained sensation through 'qualities' — color, warmth, sweetness — that flowed from objects to perceiver. Boyle's corpuscularianism (1660s, in The Sceptical Chymist and The Origin of Forms and Qualities) replaced qualities with mechanical interactions: tiny corpuscles of varying shapes moving and colliding. Color, warmth, and sweetness were our perception of corpuscle motion patterns. The first sustained mechanistic theory of sensation. Locke's primary/secondary quality distinction is downstream.",

  'pavlovs-classical-conditioning-experiments':
    "Wundt's introspective psychology (1879) had assumed only conscious processes could be studied. Pavlov's dogs, in his St. Petersburg lab from 1897, salivated to the sound of a metronome paired with food — a measurable, reproducible learning effect with no introspection involved. The conditioned reflex was experimental psychology's first paradigm. Behaviorism (Watson, 1913) generalized it to all learning.",

  'sherringtons-synapse-concept':
    "Cajal's neuron doctrine (1888) had argued nerve cells were discrete units, not a continuous reticulum. Sherrington's coining of 'synapse' (1897, in his contribution to Foster's Textbook of Physiology) named the gap between them and turned it into a biological structure to be studied. Synapse research dominated 20th-century neuroscience: chemical transmission (Loewi, 1921), excitatory and inhibitory neurotransmitters, plasticity (Hebb, 1949), receptor pharmacology. The unit of nervous-system function.",

  'attention-is-all-you-need':
    "Recurrent neural networks (LSTM, GRU) had dominated sequence modeling since 1997. Their fundamental serial nature limited training parallelism. Vaswani et al.'s 'Attention Is All You Need' (June 2017) replaced recurrence with self-attention: every position attends to every other in parallel. Training scaled with hardware in a way RNNs never had. BERT (2018), GPT (2018), and every frontier language model since are Transformers.",

  'ohalo-ii':
    "Upper Palaeolithic groups had built temporary shelters and camped seasonally. Ohalo II (~23,000 BC, on the Sea of Galilee) preserved permanent-construction features: brushwood huts, stone-paved hearths, fish-and-grain food storage, and grinding stones. Eleven thousand years before agriculture. The first archaeological site that looks like a year-round village built by hunter-gatherers. The line between 'mobile' and 'settled' was always fuzzier than the textbook story implied.",

  'egyptian-mummification-practices':
    "Predynastic Egyptian burials had relied on the natural desiccation of bodies in dry sand. The Old Kingdom (c. 2600 BC) systematized artificial mummification: organ removal, natron drying, resin treatment, linen wrapping. The procedure took seventy days. By the Middle Kingdom it had spread beyond royalty. The Egyptian commitment to body preservation drove anatomical knowledge — autopsy, surgical procedures, knowledge of internal organ placement — that surfaced in the Edwin Smith Papyrus and the Greek medical tradition that copied it.",

  'nyaya-sutras-systematized-logic':
    "Vedic and Upanishadic argument had run on aphorism and authority. Akṣapāda Gautama's Nyāya Sūtras (c. 200 BC) systematized inference: the five-membered syllogism, the categories of valid means of knowledge (perception, inference, comparison, testimony), formal rules for debate. The first sustained Indian logic. Nyāya remained a living school of philosophy for two millennia and shaped Buddhist Madhyamaka, Jain epistemology, and the medieval Hindu philosophical synthesis.",

  'linnaeus-systema-naturae-10th-edition':
    "Pre-Linnaean naturalists had labeled species with multi-word descriptive Latin phrases that varied by author. Linnaeus's 1735 Systema Naturae had introduced binomial nomenclature for plants. The 10th edition (1758) extended the consistent two-name system (Genus species) to animals. The taxonomic Big Bang: every species, living or fossil, since carries a Linnaean binomial. The 1758 publication date is the official starting point for zoological nomenclature.",

  'rawls-original-position':
    "Utilitarian moral philosophy (since Bentham) had measured outcomes; deontological ethics (since Kant) had measured intent. Rawls's A Theory of Justice (1971) introduced a procedural device: imagine choosing the principles of justice from behind a 'veil of ignorance' that hides your race, class, gender, and natural talents. What rules would rational self-interested agents pick? Rawls argued: equal liberties + the difference principle. The most influential work of Anglophone political philosophy of the twentieth century.",

  'wikipedia-launched':
    "Encyclopedias had been authored by paid experts under editorial control. Nupedia (2000) tried that model online and stalled. Wikipedia (January 2001), built on Cunningham's wiki software, opened editing to anyone. Within a decade it had become the largest reference work ever assembled in any language and the default starting point for almost any factual question. The first sustained-scale demonstration that voluntary cooperation could produce reference-grade content — without ads, without paywalls, without a publisher.",

  'heros-wind-powered-organ':
    "Wind power had been used at sea (sails) and for water raising (waterwheels in Egypt and the Levant). Hero of Alexandria's Pneumatica (c. 62 AD) describes a windwheel powering an air-pump organ — the earliest documented mechanical use of wind on land. The device was a curiosity, not industrial; nine centuries later, the windmill (Persian, c. 9th century AD) made the principle commercially serious. Hero's wheel is the documentary first.",

  'heros-method-for-measuring-focal-length':
    "Lenses had been made and used (burning glasses, magnifying glasses) since at least the Greek period. Their optical properties were qualitative. Hero of Alexandria (c. 62 AD) described a method for measuring focal length using a dioptra and a lunar eclipse observation. The first quantitative lens characterization. Practical adoption was minimal until the Arab and Renaissance optical traditions revived the geometry.",

  'pliny-the-elders-naturalis-historia-on-magnetism':
    "Greek and Roman natural-history texts had described magnetism (Thales, c. 600 BC) as folklore — the lodestone attracts iron. Pliny's Naturalis Historia (77 AD), Book 36, compiled the surviving knowledge: types of magnetic stone, their geographical sources (especially Magnesia in Lydia), and stories of their behavior. The first textual aggregation. Medieval European compilers and Arab scholars (al-Biruni's compass observations, 1000 AD) drew on Pliny's catalogue.",

  'shen-kuos-relief-map':
    "Cartography by 1000 AD had been two-dimensional everywhere. Shen Kuo's Dream Pool Essays (1088) describes a relief map made from sawdust and beeswax — three-dimensional terrain at miniature scale. Used for military planning. The first known relief map. The technique was rediscovered in Europe in the 18th century. Modern topographic mapping and 3D terrain rendering are direct descendants.",

  'fresnel-lens':
    "Lighthouse lamps had been weak — most of the light radiated in directions that didn't hit the horizon. Augustin-Jean Fresnel's 1822 lens used a series of concentric annular prisms to capture and redirect the lamp's light into a horizontal beam. The Fresnel lighthouse lens turned a few candles into a beam visible 20+ miles offshore. Maritime safety leaped. Fresnel's design was later miniaturized for theatrical and automotive use.",

  'wohler-synthesis-of-urea':
    "Vitalist chemistry had held that 'organic' compounds (made by living things) and 'inorganic' compounds were fundamentally different — life was a chemical sui generis. Wöhler's 1828 synthesis of urea from ammonium cyanate — both inorganic — produced an unambiguously organic compound. The vital force as a chemical category dissolved. Organic chemistry as a synthetic discipline begins here, and so does the long retreat of vitalism from biology.",

  'hall-heroult-aluminum-process':
    "Aluminum had been more expensive than gold in the 1850s — Napoleon III used aluminum cutlery to honor his most distinguished guests. Charles Martin Hall (Ohio, US) and Paul Héroult (France) independently invented electrolytic smelting of alumina dissolved in molten cryolite in 1886. Aluminum prices dropped 99% within a decade. Aircraft, electrical conductors, beverage cans, and cookware became thinkable. The first metal mass-produced by electrochemistry.",

  'wi-fi-standardized':
    "Wireless local-area networking pre-1997 had been a Babel of incompatible proprietary protocols (Aloha, WaveLAN, HomeRF). The IEEE 802.11 standard (1997) and especially the 802.11b amendment (1999) gave the industry a single radio protocol to ship against. The Wi-Fi Alliance brand certification arrived the same year. Within five years every laptop shipped with a Wi-Fi card. The mobile internet's first scaffold and a textbook case of standardization breaking a market open.",

  'room-temperature-maser-demonstrated':
    "Masers (microwave-amplifying analogs of lasers) had required cryogenic temperatures since Townes's 1953 invention — the lattice noise above ~10K swamped the signal. Imperial College London's pentacene-doped p-terphenyl crystal maser (2018) operated at room temperature. The first practical room-temperature maser. Applications in deep-space communication amplifiers, radio astronomy, and quantum sensing all become more accessible without the dewar-and-helium overhead.",

  'mungo-lady-cremation':
    "Burial in shallow graves — sometimes with grave goods — had been documented from ~100,000 BC. Mungo Lady (LM1, ~24,000 BC, southwestern New South Wales) is the world's oldest known cremation. Bones partially burned, then crushed and reburied in a shallow grave. The first archaeological evidence that fire was being used as a transformative element in funerary ritual rather than just for cooking and warmth.",

  'domestication-of-cattle-for-ritual-sacrifice':
    "Cattle had been hunted in the wild and managed in semi-domesticated herds in southwest Asia by the early Holocene. By ~8000 BC at sites like Çatalhöyük and Göbekli Tepe, bull skulls and horns appear in ritual deposits, painted murals, and feasting middens. The first domestic species used at scale for communal ritual sacrifice. The cattle-as-sacred motif (Apis bull, Vedic cow, Cretan bull-leaping, Mithraic bull-slaying) all draw on this Neolithic foundation.",

  'first-known-shrine-at-catalhoyuk':
    "Earlier ritual sites (Göbekli Tepe, ~9500 BC) had been monumental and built apart from domestic life. Çatalhöyük (~7500 BC, central Anatolia) put ritual into the house: most of the 18 layers of mudbrick dwellings have wall paintings, bull-horn installations, and burials of family members under the floors. The first sustained merger of domestic and ritual space — the household as the unit of religious practice.",

  'nabta-playa-stone-circle':
    "Pre-Nabta time-keeping had been lunar (notched bones, ~28,000 BC). Nabta Playa (south of the Egyptian-Sudanese border, ~7500 BC) is a stone circle aligned to the summer solstice — the date of monsoon arrival, critical for the cattle-herding communities of the Neolithic Sahara. The first known megalithic alignment to a solar event. Stonehenge (~3000 BC) is downstream of the same idea.",

  'first-known-ziggurat-construction-uruk':
    "Sumerian temples in the early third millennium had been single-room mudbrick structures on platforms. Ur-Nammu's Great Ziggurat of Ur (c. 2100 BC, dedicated to the moon god Nanna) built three monumental tiers of mudbrick standing 30 meters above the city — the first stepped temple-tower at scale. Ziggurats spread across Mesopotamia for two millennia. The vertical-religious-monument form influenced Egyptian pyramids (already extant) and the Mesoamerican step pyramids of much later date.",

  'catholic-emancipation-act-1829':
    "The Test Act (1673) had barred Roman Catholics from Parliament and most state offices in England. Daniel O'Connell's Irish Catholic Association mobilized millions through penny subscriptions in the 1820s; his 1828 election to a parliamentary seat he was legally barred from holding forced the Tory government to act. The Roman Catholic Relief Act 1829 admitted Catholics to Parliament and most state offices. The first significant rollback of post-Reformation Protestant legal supremacy in the UK. Irish nationalism's modern political phase begins here.",

  'salvation-army-founded':
    "Mid-Victorian London had vast urban poverty that mainstream Methodism and the Church of England were not reaching. William and Catherine Booth's East London Christian Mission (1865) — renamed the Salvation Army in 1878 — combined evangelical preaching with a quasi-military hierarchy and a pragmatic social-services arm: shelters, soup kitchens, employment exchanges. The first sustained merger of revival religion with structured social work. Modern faith-based welfare organizations (St. Vincent de Paul Society, World Vision) inherit the Salvation Army template.",

  'project-gutenberg-first-online-bible':
    "ARPANET (1969) had given a few hundred academics the ability to send mail and remote-execute jobs. Michael Hart, a University of Illinois undergraduate with surplus mainframe time on July 4, 1971, typed the US Declaration of Independence into a file and made it available to download. The first electronic text in what became Project Gutenberg. The first deliberate digitization of a public-domain text for free distribution. Fifty years later, 70,000+ books.",

  'world-wide-web-public-release':
    "Tim Berners-Lee's WWW proposal (1989) and prototype (1990) had run on a single NeXT machine at CERN. CERN's April 30, 1993 release of the WWW software into the public domain — explicitly choosing not to patent — combined with the NCSA Mosaic browser (Andreessen and Bina) to put the web in millions of hands within eighteen months. The first sustained-scale demonstration that an open standard with a usable client could route around proprietary information services (CompuServe, AOL, Minitel).",

  'capsule-networks-proposed-2':
    "CNNs (LeCun, 1998; AlexNet, 2012) had achieved state-of-the-art image recognition by treating spatial features as bags of feature activations — losing the part-whole and pose information. Hinton's capsule networks (2017, with Sabour and Frosst) replaced scalar activations with vectors that carried pose, and replaced max-pooling with a routing-by-agreement procedure that explicitly modeled part-whole hierarchy. Capsule nets never displaced CNNs at scale; the architectural-bias question they raised remains open.",

  'venus-figurine-3':
    "Two-dimensional cave art (Chauvet, ~32,000 BC) and personal ornament (perforated shells, ~75,000 BC) had been the earliest representational practices. The Venus of Hohle Fels — a 6-cm fired-clay figurine of an exaggerated female form, ~35,000 BC — is the earliest known three-dimensional human depiction in fired clay. Venus figurines from this and the next twenty millennia show consistent stylistic conventions across Europe. The first portable, durable, anthropomorphic art form.",

  'invention-of-the-plow-4':
    "Pre-plow tilling had been done with hoes — slow, shallow, suitable only for soft floodplain soils. Wheel-less ox-drawn ards (~6000 BC, in the Fertile Crescent) and later iron-tipped plows could turn over heavier soils, expand the cultivable land, and increase yield per labor-hour. Surplus grain became feasible. The plow drove every subsequent agricultural intensification — Mesopotamian cities, Indo-European migrations, medieval European deep-soil reclamation.",

  'first-known-use-of-copper-smelting-2':
    "Native (already-pure) copper had been hammered into tools since ~9000 BC at Çayönü Tepesi. Smelting — heating ore with reducing fuel to extract metal — first appears in the Vinča culture (Plocnik, modern Serbia) around 5500 BC and at multiple Levantine sites by 4500 BC. The first metallurgical extraction process. Tin alloying (bronze) and iron working (~1200 BC) inherited the technology. The Bronze and Iron Ages descend from the smelting hearth.",

  'founding-of-the-first-dynasty-of-egypt':
    "Pre-dynastic Egypt had been culturally distinct in Upper and Lower Nile regions for centuries. Narmer (also called Menes), originally king of Upper Egypt, conquered and unified the Delta around 3150 BC. The Narmer Palette commemorates the unification with the dual-crown imagery used by every subsequent pharaoh. The first centralized state stretching ~700 miles along a single river. Egyptian dynastic continuity persisted for nearly three millennia after this.",

  'development-of-first-postal-system-egypt':
    "Pre-imperial communication had relied on traveling merchants or specially-dispatched messengers. The Old Kingdom Egyptian state developed an organized courier service by ~2400 BC: relay stations along the Nile, named couriers, dispatched correspondence between the pharaoh and provincial officials. The first organized message-relay system. Persia's Royal Road (Achaemenid, ~500 BC), the Roman cursus publicus, and every subsequent imperial postal system inherit the architecture.",

  'cyrus-the-great-conquests':
    "Pre-Persian Near Eastern empires (Assyria, Neo-Babylonia) had ruled subject peoples by deportation, suppression of local religion, and extraction. Cyrus the Great's Persian conquests (550-539 BC) explicitly preserved local customs and religions — restoring Babylonian temples, returning Jewish exiles to Jerusalem, leaving local administration in place. The first multi-ethnic empire that didn't try to assimilate its subjects. The Achaemenid model influenced Hellenistic, Roman imperial, and even Mughal governance.",

  'canonization-of-the-quran-under-caliph-uthman':
    "Variant Quranic recitations had multiplied during the rapid Islamic expansion (632-650 AD). Disputes over correct readings between Muslims from different regions threatened the new community's coherence. Caliph Uthman's Mushaf project (~644-650 AD) collected the variants from companions of the Prophet, used Hafsa's compiled copy as a master, fixed the consonantal text in a single recension, and ordered other variants destroyed. The Uthmanic codex remains the basis of every printed Quran. Textual standardization preserved the unity of an empire-spanning faith.",

  'metropolitan-police':
    "Pre-Peel English crime control had relied on parish constables, the Bow Street Runners (1749, an early professional force of ~10), and the army when crowds got large. London's industrial population growth had outpaced these. Sir Robert Peel's Metropolitan Police Act (1829) created a uniformed, full-time, civilian-led force of 1,000 constables ('peelers' or 'bobbies') focused on crime prevention through patrol presence. The model spread to every major city. 'Modern policing' as a profession begins here.",

  'pearl-street-station-2':
    "Edison's incandescent bulb (1879) and the dynamo had made electric light technically possible. Pearl Street Station (Lower Manhattan, September 4, 1882) made it commercial: a coal-fired generating plant supplying 82 customers with 400 lamps over an underground DC distribution grid. The first commercial centralized electric power station. Westinghouse and Tesla's AC system (1888-91) eventually replaced the DC architecture, but the centralized utility model — the grid — was Pearl Street's legacy.",

  'moscow-washington-hotline':
    "The Cuban Missile Crisis (October 1962) had revealed that diplomatic cables between Washington and Moscow took six hours each way through a relay of embassies — an unacceptable lag for nuclear-crisis decision-making. The Moscow-Washington hotline (June 1963) was a teletype link directly between the Kremlin and the Pentagon, with redundant routing. Every subsequent superpower crisis — Yom Kippur (1973), Soviet shootdown of KAL 007 (1983) — used it. The first piece of permanent crisis-communication infrastructure between adversary states.",

  'dvd-region-coding':
    "VHS tape distribution had been format-locked geographically (NTSC vs PAL/SECAM) but not artificially restricted. DVD's digital format made VHS-era distribution control obsolete. Region coding (1997) was the studios' answer: six geographical regions, each with its own player firmware, blocking cross-region playback. The first widespread digital rights management. Cracked within months. Subsequent DRM (CSS, Macrovision, AACS) followed the same arms-race trajectory.",

  'invention-of-the-corbelled-arch':
    "Stone-and-mudbrick construction had been able to span only as wide as a single lintel — limiting doorways, gates, and tunnels to 2-3 meters. The corbelled arch — successive stone courses each projecting slightly inward until they meet at the top — could span much wider gaps without the structural mathematics of the true arch. Newgrange passage tomb (Ireland, ~3200 BC), Mycenaean Treasury of Atreus, and Mayan structures all use it. A precondition for the true keyed arch and dome that came later.",

  'roman-limitanei-and-comitatenses-system':
    "Earlier Roman military doctrine (Augustus through Severus) had stationed legions at the frontier, expecting them to defend in place. Diocletian's reforms (~290 AD), expanded under Constantine, split the army into limitanei (frontier garrisons) and comitatenses (mobile field armies that could redeploy to threats from the interior). The first defense-in-depth strategy at empire scale. Byzantine military doctrine, Carolingian house troops, and many subsequent regimes echoed the structure.",

  'mongol-horse-archer-tactics':
    "Steppe peoples had used mounted archery for centuries — Scythians, Parthians, Huns. Genghis Khan's Mongol army (1206 onward) industrialized the model: every warrior with three or four horses, sustained 100-mile-per-day movement, integrated yam relay communications, feigned retreats that pulled disciplined infantry out of formation. The first standing army where mobility and ranged fire were the doctrine, not exceptions. The Mongols conquered the largest contiguous land empire in history within Genghis's lifetime.",

  'soviet-t-64-tank':
    "Cold War tanks (M60, T-55) had bolted thicker steel onto the same basic 1940s chassis. The Soviet T-64 (entered service 1963) combined three innovations in one platform: composite armor (steel-glass-steel sandwich), an autoloader replacing the human loader (cutting crew from four to three), and a 125mm smoothbore gun firing APFSDS rounds. The first true main battle tank to achieve all three. Western tank designers spent the 1970s catching up — the M1 Abrams (1980) is the Western answer to the T-64.",

  'us-federal-reserve-established':
    "US banking panics in the late nineteenth century (1873, 1893, 1907) had each required private rescue (J.P. Morgan personally backstopped 1907). The Aldrich-Vreeland Act (1908) was a stopgap; the Federal Reserve Act (December 1913) created an actual central bank: twelve regional reserve banks coordinated by a Washington board, lender of last resort to commercial banks, currency-issuing authority. The Great Depression (1929-39) tested the design and found it inadequate; the modern Fed evolved through the 1930s reforms. The institutional substrate of US monetary policy is now Fed-shaped.",

  'nylon-dupont':
    "Pre-1935 strong fibers had been biological — silk, cotton, wool, linen — with the supply constraints of agriculture. Wallace Carothers's DuPont team (1935) synthesized polyamide-6,6 by polycondensation of hexamethylenediamine and adipic acid. Nylon stockings (1939) were the consumer launch; military parachutes and ropes were the wartime use. The first fully-synthetic high-strength fiber. Polyester, polyethylene, polypropylene, Kevlar all follow the same template — engineered polymers with engineered properties.",

  'maslows-hierarchy-of-needs':
    "Behaviorism (1913) had treated human motivation as response to drives — hunger, thirst, pain, pleasure. Maslow's 1943 paper 'A Theory of Human Motivation' proposed a hierarchy: physiological needs at the base, then safety, belonging, esteem, and self-actualization at the apex. Higher needs only emerge once lower ones are met. The pyramid is a postwar pop-culture infographic that Maslow himself never drew. Restructured product design, HR practice, and management theory around hierarchical motivation.",

  'visicalc-spreadsheet':
    "Pre-VisiCalc spreadsheets had been paper grids that took hours to recalculate when an input changed. Dan Bricklin and Bob Frankston's VisiCalc (1979, on the Apple II) recalculated automatically — change one cell, the whole sheet updated. Apple II sales doubled. The first 'killer app' that made personal computing economically rational for businesses. Lotus 1-2-3 (IBM PC, 1983) and Excel (Mac, 1985) inherited the model; spreadsheets remain the most-used computing application after web browsing.",

  'system-1-system-2-kahneman-formalized':
    "Dual-process theories had circulated in cognitive psychology since the 1970s — Wason and Evans, Stanovich and West. Kahneman's Thinking, Fast and Slow (2011) packaged the research for the public: System 1 is fast, intuitive, pattern-based, effortless; System 2 is slow, deliberative, effortful, capacity-limited. The framework's empirical specifics are debated. Its conceptual frame entered behavioral economics, public policy, design, and the way ordinary people talk about their own thinking.",

  'gpt-4-multimodality-frontier-model-capabilities':
    "GPT-3 (2020) had been text-only. GPT-4 (March 2023) accepted images as input — interpreting graphs, screenshots, math problems, and physical scenes. Capability across professional benchmarks crossed graduate-student level in many domains. The conversation in industry shifted from 'can AI do this?' to 'how do we integrate AI that already can?' API access at consumer prices made the question practical. The frontier model became infrastructure within months.",

  'facebooks-news-feed-algorithmic-social-curation':
    "MySpace (2003) and early Facebook had presented friends' updates chronologically. Facebook's News Feed (September 2006) replaced the chronology with an algorithm predicting per-user engagement. Outcry was loud, opt-out demand strong, but the engagement metrics jumped and the feature stayed. Twitter (2016), Instagram (2016), and TikTok (2018) all moved to algorithmic feeds. The default information environment for billions of people became predictively curated rather than user-controlled.",

  'global-financial-crisis-shadow-banking-collapse':
    "Securitization (since the 1980s) had let mortgage originators pass loan risk to the broader market. Mortgage-backed securities, CDOs, and CDO-squareds (2002-2007) layered the risk into instruments rated AAA by the same agencies the issuers paid. The collapse of Lehman Brothers (September 2008) revealed the connections: the shadow banking system — money-market funds, repo markets, hedge-fund borrowing — held more risk than the regulated system. The Treasury and Fed extended unlimited liquidity. The financial regulatory system that emerged (Dodd-Frank 2010, Basel III 2010-13) is the answer to that revealed connection map.",

  'international-red-cross-transnational-humanitarianism':
    "Humanitarian aid pre-1863 had been bounded by nationality or religious affiliation — Christian nations cared for Christian wounded, Ottomans for Ottomans. Henri Dunant's witness at Solferino (1859) and his organization of Red Cross national societies (1863) established a different principle: humanitarian assistance as transnational, neutral, providing aid to wounded combatants regardless of which side they fought on. The first sustained transnational humanitarian organization. Médecins Sans Frontières (1971) and the modern NGO architecture inherit the structure.",

  'prohibition-moral-legislation-and-unintended-consequences':
    "The temperance movement (Anti-Saloon League, founded 1893) had organized Protestant Americans against alcohol for decades. The 18th Amendment (ratified January 1919) and the Volstead Act (October 1919) banned the manufacture and sale of alcohol in the US. Bootlegging, organized crime (Al Capone in Chicago, the Genovese family in New York), corruption of police and courts, and rising public contempt for federal law followed. The 21st Amendment (December 1933) repealed Prohibition. The first major demonstration that a modern democratic state cannot regulate widespread cultural practice through legislation alone.",

  'state-of-israel-established-jewish-homeland':
    "Theodor Herzl's Der Judenstaat (1896) and the First Zionist Congress (1897) had organized political Zionism. The Balfour Declaration (1917), British Mandate (1922-48), and the Holocaust (1941-45) made the project urgent and the case unanswerable. UN Resolution 181 (November 1947) partitioned the British Mandate into Jewish and Arab states. Israel declared independence on May 14, 1948. The first Jewish state in two thousand years. The simultaneous Palestinian dispossession (the Nakba) and the wars that followed are the unresolved counterpart of the founding.",

  'stonewall-inn-riots-gay-liberation':
    "Pre-Stonewall gay activism (the Mattachine Society, 1950; Daughters of Bilitis, 1955) had argued for tolerance from the closet. Routine police raids on gay bars in New York were standard. The Stonewall Inn raid (June 28, 1969) met sustained resistance — patrons and crowd fought back over six nights. The first Gay Pride march followed in 1970. The closet ceased to be the default mode. Modern gay-rights advocacy and the eventual march to Obergefell v. Hodges (2015) trace their organizational origin to Stonewall.",

  'maslows-hierarchy-motivation-theory':
    "Behaviorism had reduced human motivation to drives and reinforcement schedules. Freud had emphasized libido and aggression. Maslow's 1943 'A Theory of Human Motivation' (in Psychological Review) proposed something more ordered: physiological needs at the base, then safety, belonging, esteem, and self-actualization at the apex. Higher needs only emerge when lower ones are met. The 'hierarchy of needs' frame became HR-and-management common sense. Empirically: better as a heuristic than a strict layering.",

  'bolshevik-revolution-soviet-state':
    "WWI (1914-17) had broken the Tsarist economy and the army's discipline. The February Revolution (March 1917) replaced the Tsar with a Provisional Government that kept Russia in the war. Lenin returned from Swiss exile (April 1917, via German train) and moved the Bolsheviks toward armed insurrection. October 25, 1917 (Old Style): the Winter Palace seized, Lenin's government installed. The world's first self-described communist state. Whatever the trajectory of the next 74 years, October 1917 set the political agenda of the twentieth century.",

  'montgomery-bus-boycott-civil-rights-movement':
    "Brown v. Board (May 1954) had made segregated education unconstitutional in principle. Implementation was slow. Rosa Parks's arrest on December 1, 1955 (coordinated with the local NAACP) launched a 381-day boycott of Montgomery's bus system. Black ridership was 75% of the customer base; the bus company nearly went bankrupt. Browder v. Gayle (December 1956) ended bus segregation in Montgomery. Martin Luther King Jr. became a national figure. The Civil Rights Movement's modern phase begins here.",

  'woodstock-counterculture-as-mainstream':
    "Mid-1960s youth culture — civil rights, anti-war, free love, psychedelics — had been a contested subset of American identity. Woodstock (August 15-18, 1969, Bethel NY) drew 400,000 attendees to a dairy farm for three days of music, peaceful coexistence, and almost no police presence. The Newsweek and Life cover stories crystallized a generational identity. The counterculture became mainstream culture — at least as a marketing target. The Altamont Free Concert (December 1969) and the violence at the Hells Angels-managed security suggested the limits of the model.",

  'terror-management-theory-becker-greenberg':
    "Cultural anthropology had treated culture as adaptive or aesthetic. Ernest Becker's Pulitzer-winning Denial of Death (1973) argued that culture is fundamentally a response to mortality awareness — we build symbolic immortality projects to deny our biological end. Greenberg, Pyszczynski, and Solomon (from 1986) operationalized the claim experimentally: subjects reminded of their mortality (mortality-salience manipulation) defend their cultural worldview more strongly. One of the most replicated paradigms in social psychology.",

  'alphafold-3-all-biomolecule-structure-prediction':
    "AlphaFold 2 (2021) had solved protein structure prediction at near-experimental accuracy. AlphaFold 3 (May 2024, Google DeepMind) extended the same diffusion-based approach to all biological molecules — DNA, RNA, small-molecule ligands, post-translational modifications, and their interactions with proteins. Drug discovery's structural-biology bottleneck — predicting how a drug binds its target — moved from experimental to computational. The 2024 Nobel in Chemistry (jointly to Hassabis, Jumper, and David Baker) tracked the field's recognition.",

  'gemini-1-5-1m-token-context-window':
    "GPT-4 (March 2023) had topped out at 128,000 tokens. Anthropic's Claude 2 raised it to 100K, then 200K. Google's Gemini 1.5 Pro (February 2024) jumped to 1,000,000 tokens — about 750,000 words, or ten average novels. The first model that could ingest an entire codebase, a feature-length film transcript, or a year of corporate communications in one prompt. Long-context retrieval (RAG) workflows lost some of their necessity; the question of when to use long context vs. retrieval is now an architectural design choice.",

  'ai-agents-autonomous-task-completion':
    "ChatGPT (2022) and Claude 2 (2023) had been reactive — answer when asked, then wait. 2024 saw production-grade autonomous agents: Devin (March), AutoGPT-class loops, browser-use frameworks, the Anthropic Computer Use API (October), OpenAI's Operator (January 2025). Models could now browse the web, write and execute code, fill forms, and complete multi-step tasks without constant supervision. The agentic question — when can a model be trusted to act, not just answer? — became the practical AI deployment question of 2024-25.",

  'claude-3-7-sonnet-hybrid-reasoning-models':
    "OpenAI's o1 (September 2024) had introduced extended thinking as a separate model variant — one model for fast responses, another for deliberate reasoning. Anthropic's Claude 3.7 Sonnet (February 2025) integrated both modes into a single model with a user-controllable extended-thinking parameter. The fast/slow tradeoff that had been an architectural constraint became a runtime decision. The hybrid reasoning model is now the standard frontier-model shape — DeepSeek R1, Gemini 2.5, Claude 4 all follow the pattern.",

  'zuse-z3':
    "Babbage's Difference Engine (1822) and Analytical Engine (1837) had been mechanical and never completed at full scale. Howard Aiken's Mark I (1944) was electromechanical and required Harvard's resources. Konrad Zuse, working alone in his parents' Berlin apartment, completed the Z3 on May 12, 1941: 2,600 relays, 22-bit floating-point arithmetic, programs stored on punched film. The world's first working programmable digital computer. Destroyed in an Allied bombing raid in 1943; rediscovered after the war as having predated ENIAC and the Mark I.",

  'bandura-bobo-doll-social-learning':
    "Skinnerian behaviorism had explained learning through direct reinforcement — a behavior repeats because it was rewarded. Albert Bandura's Bobo doll experiments (1961-1963 at Stanford) showed children acquired novel aggressive behaviors by mere observation of adult models — no reinforcement involved, sometimes no opportunity to imitate until much later. The first hard evidence for social learning. Bandura's social cognitive theory and the concept of modeling are downstream — and so is much of educational and developmental psychology since.",

  'loftus-palmer-misinformation-effect':
    "Eyewitness memory had been treated by courts as essentially a video replay. Tversky and Kahneman's heuristics-and-biases program (1972) had shown that judgment was systematically distorted by question framing. Loftus and Palmer (1974) showed memory itself was: subjects shown a film of a car accident, asked 'how fast were the cars going when they smashed/hit/contacted each other,' gave higher speed estimates and (a week later) falsely remembered broken glass when 'smashed' was used. Eyewitness testimony's legal status has been recovering ever since.",

  'ampere-electrodynamics-formula':
    "Oersted's 1820 demonstration had shown a current-carrying wire deflected a compass needle — electricity and magnetism were connected. Ampère's Théorie des phénomènes électrodynamiques (1826) gave the connection mathematical form: a force law between current elements, the principle that magnets reduce to circulating currents, and the right-hand rule. The first quantitative theory of electrodynamics. Faraday's experimental work and Maxwell's equations (1865) build on Ampère's foundation.",

  'edict-of-thessalonica-christianity-state-religion':
    "The Edict of Milan (313) had legalized Christianity as one tolerated cult among others. Sixty-seven years of imperial preference (Constantine onward) had built Christian institutional weight. Theodosius I's Edict of Thessalonica (380) made Nicene Christianity the official Roman state religion and banned other forms of worship. Pagan temples closed, sacrifice was outlawed, the pagan priesthood lost legal standing. The Roman religious settlement that defined European civilization for the next millennium.",

  'constitutio-antoniniana-universal-roman-citizenship':
    "Roman citizenship had been a privileged legal status for two and a half centuries — gradually extended (Lex Julia, 90 BC) but always limited to specific groups. Caracalla's Constitutio Antoniniana (212 AD) granted Roman citizenship to all free inhabitants of the empire — perhaps 30 million people overnight. Imperial subjecthood and citizenship merged. Tax revenue jumped. The legal distinction that had organized Roman society dissolved into a uniform imperial subject, an inflection point on the road to the late-Empire bureaucratic state.",

  'smoking-and-drying-of-meat-over-fire':
    "Hunter-gatherer protein had been mostly fresh — meat that wasn't eaten within days spoiled. Smoking over wood fire (~40,000 BC, demonstrated archaeologically at multiple Eurasian sites) and sun-drying both reduced the water content that bacteria need. Smoked meat lasted weeks; dried meat lasted months. The first food-preservation technology. Long-distance hunting trips and seasonal storage became practical. Pemmican, jerky, and biltong are direct descendants.",

  'harvesting-of-wild-cereals-with-sickles':
    "Hand-stripping of wild grain seedheads had been slow — a person might harvest enough for a few days' food in a long day. Natufian stone sickles (~12,000 BC) — flint blades hafted into bone or wood handles — multiplied harvest speed by perhaps tenfold. Glossed sickle blades appear at sites across the Levantine corridor. The pre-agricultural processing technology that made grain a viable staple before any plant was domesticated.",

  'first-cultivation-of-wild-emmer-wheat':
    "Wild wheat seedheads shatter at maturity to disperse seeds — useful for the plant, terrible for harvest. Natufians collecting wheat naturally selected for non-shattering mutants (the seeds remained on the stalk and were carried home). Within a few thousand years, emmer wheat (Triticum dicoccum, ~10,000 BC) was reproductively dependent on humans to disperse its seeds. The first crop. Domestication runs the same way for almost every grain that followed.",

  'first-cultivation-of-barley':
    "Wild barley, like wild wheat, had shattering spikelets. Levantine farmers (~9000 BC) selected the non-shattering mutants — Hordeum vulgare. Barley tolerates drier soil and shorter growing seasons than wheat, which let it spread north and east. By 5000 BC barley was grown from Egypt to the Indus. Beer, bread, and animal feed all run on it. Mesopotamian agricultural surplus and the cities that followed depended primarily on barley.",

  'sumerian-barley-as-staple-crop':
    "Wild grasses with shattering spikelets had been gathered in the Levant for ten millennia before domestication. Selection for non-shattering mutants (~9000 BC) created Hordeum vulgare — domesticated barley. Mesopotamian Sumer (4500-1900 BC) ran on barley: it grew in salinated soils that wheat couldn't tolerate, paid wages, fed armies, brewed beer. The world's earliest urban civilization stood on a single annual grass crop.",

  'systematic-collection-of-honey':
    "Honey had been one of the few concentrated calorie sources available to Pleistocene humans, but acquisition involved climbing trees and being repeatedly stung. Mesolithic rock paintings at Cuevas de la Araña (~8000 BC, Spain) show humans using smoke to pacify wild bee colonies and ladders or ropes to access them. The first technique for routinizing honey collection. Sweet calories joined the diet; the fermentation of honey-water gave us mead, the oldest known alcoholic beverage.",

  'domestication-of-chickpeas':
    "Wild chickpeas (Cicer reticulatum) grow only in a small region of southeastern Turkey and produce toxic compounds in their seeds. Neolithic farmers (~8000 BC) selected for low-toxicity, larger-seed mutants — Cicer arietinum, the domesticated chickpea. Joined wheat, barley, peas, and lentils as one of the founder crops of southwest Asian agriculture. High-protein legumes gave the early agricultural diet what cereals alone couldn't.",

  'yam-domestication-in-west-africa':
    "Tropical West African forest peoples had no native domesticated cereal staple — the cereals of the Fertile Crescent didn't grow in the rainforest. Yam (Dioscorea spp.) cultivation, beginning around 6000 BC in the forest belt, gave forest populations a high-yield carbohydrate staple. The Bantu expansion (from ~3000 BC) carried yam-and-oil-palm agriculture across Central and Southern Africa. The reason West Africa supported dense populations long before any imported grain.",

  'chicken-domestication-in-southeast-asia':
    "The red junglefowl (Gallus gallus) of Southeast Asia laid eggs and could be kept on table scraps. Domestication around 6000 BC gave humans a small livestock animal that produced both daily eggs and occasional meat without large pasture requirements. Chickens spread from Southeast Asia across Eurasia by the Bronze Age. The most numerous domesticated bird in history — and now, by biomass, the most numerous bird on Earth.",

  'salt-production':
    "Pre-salt food preservation had been smoking, drying, and fermentation. Salt — from coastal evaporation pans (Poiana Slatinei, ~6000 BC, in modern Romania, is the earliest known production site) — could preserve meat, fish, and dairy for months without refrigeration. Salt also enabled long-distance food transport. The trade networks that grew up around salt sources (Hallein, the Sahara salt routes, Cheshire) shaped European geography for millennia. 'Salary' is etymologically Roman salt-pay.",

  'grape-domestication':
    "Wild grapes (Vitis vinifera sylvestris) had been gathered across Eurasia for thousands of years. Domestication at Gadachrili Gora (Georgia, ~6000 BC) selected for hermaphroditic vines (most wild grapes are dioecious) — easier to propagate and higher-yielding. Wine residue in pottery from the same era confirms early winemaking. Grape cultivation followed the spread of viticulture across the Mediterranean. The single most important non-cereal crop of the ancient Mediterranean economy.",

  'rice-paddy-field-terracing':
    "Hilly and mountainous land had been unsuited to irrigated agriculture — water rolled off slopes. Terrace farming, developed independently in multiple regions (Andes, Yemen, Southeast Asia, southern China; the earliest known examples date to ~4000 BC), cut hillsides into stepped flat platforms with retaining walls. Rice paddies on terraces fed densely populated mountain regions. Bali, the Philippine Cordilleras, and the southern Chinese provinces still farm with the same technique.",

  'fig-domestication-in-near-east':
    "Wild figs were available across the Levant but produced unpredictably. Domestication of Ficus carica (~4000 BC, eastern Mediterranean) selected for parthenocarpic mutants — figs that fruit without pollination. The first high-sugar, dryable, storable tree fruit. Figs spread with the Phoenicians; Roman provincial agriculture relied on them. Mediterranean diet's tree-fruit foundation begins here.",

  'sorghum-domestication-in-africa':
    "Wheat and barley were the cereals of the Fertile Crescent — neither tolerated the heat or drought of the African savanna. Sorghum bicolor, domesticated in eastern Sudan around 3500 BC, did. The first heat-and-drought-resistant cereal staple for the African belt. Combined with millet and yam, sorghum supported the dense Sahelian populations that built the Iron Age West African states (Ghana, Mali, Songhai). Today the world's fifth-most-grown cereal.",

  'sumerian-pomegranate-cultivation':
    "Mediterranean fruit had been mostly seasonal and short-storing. The pomegranate (Punica granatum), domesticated on the Iranian plateau around 3000 BC, kept for months in a cool dry place and provided seeds high in vitamin C and antioxidants. Symbolic resonance followed — the pomegranate appears in Persian, Hebrew, and Greek religious iconography (Persephone's seeds, the temple of Solomon's columns). The first long-storing tree fruit of the ancient Near East.",

  'sumerian-pomegranate-cultivation-2':
    "Mediterranean fruit had been mostly seasonal and short-storing. The pomegranate (Punica granatum), domesticated on the Iranian plateau around 3000 BC, kept for months in a cool dry place. The duplicate corpus entry shares the parent ID with the canonical one above; the contribution is the same. (Both Hebrew Bible and Greek myth treat pomegranate seeds as the symbol of return-from-death.)",

  'no-till-farming-with-glyphosate':
    "Conventional agriculture had assumed soil must be tilled before planting — to bury weeds, aerate, and prepare a seedbed. Tillage degrades soil structure, releases stored carbon, and erodes topsoil. No-till farming (modern revival from the 1940s, mass adoption after Roundup commercialization in 1974) leaves the soil intact and uses herbicide for weed control. Soil organic matter recovers. Tractor diesel use drops 60%. The corpus's date of 3000 BC reflects ancient pre-tillage hand-planting; the modern recovery is what made it scalable.",

  'han-dynasty-silk-mulberry-cultivation':
    "Wild silkworm cocoons had been gathered for centuries. Chinese sericulture (~2700 BC, traditionally credited to the legendary Empress Leizu) tied silk production to managed mulberry orchards: mulberry leaves fed cultivated Bombyx mori silkworms whose cocoons were unwound into silk thread. The first systematized animal-plant agro-industry. Silk became China's pre-eminent export. The Silk Road (from ~200 BC) was named for the commodity that made the journey from Han China to Roman markets economically rational.",

  'sumerian-fish-farming-in-ponds':
    "Wild river and marsh fishing had supplied Sumerian protein since the Ubaid period. Mesopotamian temple records from ~2500 BC document deliberate stocking of artificial ponds with carp and other species — the world's first known aquaculture. Pond yields exceeded what wild fishing could produce per labor-hour. Ancient Egyptians and Han Chinese followed with their own pond systems. Modern fish farming is a recovery of this Bronze Age practice at industrial scale.",

  'sumerian-cheese-production':
    "Fresh milk spoiled within hours in Mesopotamian heat. Sumerian dairy practice (~2300 BC, attested in the Frieze of Tell al-'Ubaid and contemporary clay tablets) used rennet — likely from kid stomach — to curdle milk into a long-storing cheese. Cheese stretched dairy nutrition into the dry season. The technology spread across the Near East and Mediterranean; modern hard cheeses (Parmesan, Pecorino) descend from this Bronze Age preservation breakthrough.",

  'horse-domestication-in-eurasian-steppe':
    "The Pontic-Caspian steppe was rich in wild horse herds. Domestication evidence — bit-wear on horse teeth, settlement organization around horse corrals — appears at Botai-culture sites (modern Kazakhstan) by ~3500 BC. Genetic evidence for the modern domestic horse's ancestry points to the Volga-Don region around 2200 BC. Horses gave steppe peoples the speed and range that produced the Indo-European migrations, chariot warfare, the cavalry doctrines of Bronze and Iron Age empires, and the steppe-nomad dominance of Eurasia until firearms.",
};

async function main(){
  const data = JSON.parse(await readFile(join(ROOT, "data.json"), "utf8"));
  let applied = 0;
  let missing = 0;
  for (const [id, because] of Object.entries(BECAUSE_BATCH)){
    const t = data.ticks.find(x => x.id === id);
    if (!t){ console.error("MISSING tick: " + id); missing++; continue; }
    t.because = because;
    applied++;
  }
  console.log(`apply-because: ${applied} applied, ${missing} missing`);
  if (DRY){ console.log("(dry run — no write)"); return; }
  await writeFile(join(ROOT, "data.json"), JSON.stringify(data, null, 2));
  console.log("wrote data.json");
}

main().catch(err => { console.error(err); process.exit(1); });
