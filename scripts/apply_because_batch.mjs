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
