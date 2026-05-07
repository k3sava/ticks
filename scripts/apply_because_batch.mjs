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
