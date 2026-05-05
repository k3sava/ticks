#!/usr/bin/env python3
"""Replace 404'd Wikipedia URLs with canonical articles."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'

# Map from broken slug -> canonical Wikipedia slug
FIXES = {
    "Roman_manipular_legion": "Roman_legion",
    "Kuhn%27s_Structure_of_Scientific_Revolutions": "The_Structure_of_Scientific_Revolutions",
    "Multiple_intelligences_theory_Gardner": "Theory_of_multiple_intelligences",
    "Johnson%27s_dictionary": "A_Dictionary_of_the_English_Language",
    "Alexander%27s_siege_of_Tyre": "Siege_of_Tyre_(332_BC)",
    "RNA_world_hypothesis_supported": "RNA_world",
    "Ironclad_warships_Monitor_vs._Virginia": "Battle_of_Hampton_Roads",
    "Spanish_Inquisition_expulsion_of_Jews": "Alhambra_Decree",
    "Prehistoric_burial": "Burial",
    "VisiCalc_spreadsheet": "VisiCalc",
    "Bronze-tipped_plow_Mesopotamia": "Plough",
    "Braille_system_standardized": "Braille",
    "Recombinant_hepatitis_B_vaccine": "Hepatitis_B_vaccine",
    "Crop_rotation_ancient_Mediterranean": "Crop_rotation",
    "Surrealism_manifesto_Breton": "Surrealist_Manifesto",
    "Phonograph_Edison": "Phonograph",
    "Counterinsurgency_doctrine_Malaya_Vietnam": "Counterinsurgency",
    "Punctuated_equilibrium_Gould_Eldredge": "Punctuated_equilibrium",
    "Periodic_table_Mendeleev": "Periodic_table",
    "da_Vinci_robotic_surgery_system": "Da_Vinci_Surgical_System",
    "Blood_typing_Landsteiner": "Blood_type",
    "Reflecting_telescope_Newton": "Reflecting_telescope",
    "Watson_wins_Jeopardy": "Watson_(computer)",
    "Longbow_at_Cr%C3%A9cy": "Battle_of_Cr%C3%A9cy",
    "LLaMA_(language_model)": "Llama_(language_model)",
    "Human_papillomavirus_vaccine_Gardasil": "HPV_vaccine",
    "MIDI_protocol": "MIDI",
    "Smallpox_declared_eradicated": "Eradication_of_smallpox",
    "Moore%27s_Law_observed": "Moore%27s_law",
    "Bitcoin_whitepaper_implemented": "Bitcoin",
    "Cardiac_pacemaker_implantable": "Artificial_cardiac_pacemaker",
    "AI-optimized_precision_agriculture": "Precision_agriculture",
    "Laser_Maiman": "Laser",
    "Oxford_English_Dictionary_completed": "Oxford_English_Dictionary",
    "Punk_graphic_design": "Punk_subculture",
    "Census_and_taxation_Ur_III": "Third_Dynasty_of_Ur",
    "Electron_discovered_J.J._Thomson": "Electron",
    "Graph_theory_Euler": "Seven_Bridges_of_K%C3%B6nigsberg",
    "Chemical_fertilizer_Liebig%27s_mineral_theory": "Justus_von_Liebig",
    "X-ray_diagnosis_first_clinical_use": "X-ray",
}

def main():
    d = json.load(open(DATA))
    fixed = 0
    for t in d['ticks']:
        for l in t.get('links', []):
            u = l['url']
            if 'wikipedia.org/wiki/' not in u: continue
            base, slug = u.split('/wiki/', 1)
            slug_clean = slug.split('#')[0].split('?')[0]
            if slug_clean in FIXES:
                rest = u[len(base+'/wiki/')+len(slug_clean):]
                l['url'] = f"{base}/wiki/{FIXES[slug_clean]}{rest}"
                fixed += 1
    json.dump(d, open(DATA, 'w'), ensure_ascii=False)
    print(f"Fixed {fixed} 404'd URLs.")

if __name__ == '__main__':
    main()
