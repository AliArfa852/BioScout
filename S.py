import csv

INPUT_FILE = "D.csv"
OUTPUT_OBS_FILE = "observations.csv"
OUTPUT_KB_FILE = "knowledge_base.txt"

default_observers = ["Manahil", "Shitba", "Ali", "Sara", "Ahmed", "Zainab", "Omar", "Fatima","Farhan","Aisha","Bilal","Hina","Kashif","Nida","Usman","Sana","Tariq","Nadia","Zeeshan","Rabia"]

def clean_text(text):
    return text.strip().replace('\n', ' ').replace('"', "'")

def generate_observations_with_observer():
    observations = []
    observer_count = 0

    with open(INPUT_FILE, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            observer = default_observers[observer_count % len(default_observers)]
            observer_count += 1
            obs = {
                "observation_id": row["observation_id"],
                "species_name": clean_text(row["species_name"]),
                "common_name": clean_text(row["common_name"]),
                "date_observed": clean_text(row["date_observed"]),
                "location": clean_text(row["location"]),
                "image_url": clean_text(row["image_url"]),
                "notes": clean_text(row["notes"]),
                "observer": observer,
            }
            observations.append(obs)

    # Write output CSV with observer column added
    fieldnames = ["observation_id","species_name","common_name","date_observed","location","image_url","notes","observer"]
    with open(OUTPUT_OBS_FILE, 'w', newline='', encoding='utf-8') as f_out:
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(observations)

    return observations

def generate_knowledge_base(observations, output_path):
    """
    Generate a detailed knowledge base text file with:
    - Rich, sourced biodiversity intro paragraphs about Islamabad and surroundings
    - Complete species list (scientific + common names)
    - Popular observation locations list
    - Sample community observation notes (top frequent ones)
    """
    from collections import Counter

    species_set = set()
    locations_set = set()
    notes_counter = Counter()

    # Collect unique species, locations, and notes frequencies
    for obs in observations:
        common = obs.get("common_name", "").strip()
        sci = obs.get("species_name", "").strip()
        if common and sci:
            species_set.add(f"{common} ({sci})")
        loc = obs.get("location", "").strip()
        if loc:
            locations_set.add(loc)
        note = obs.get("notes", "").strip()
        if note:
            notes_counter[note] += 1

    # Sort species and locations alphabetically
    species_list = sorted(species_set)
    locations_list = sorted(locations_set)

    # Take top 10 most common notes (avoid duplicates)
    common_notes = [note for note, _ in notes_counter.most_common(10)]

    # Sourced and curated detailed biodiversity intro section
    biodiversity_intro = (
        "Biodiversity in Islamabad\n\n"

        "🌿 Margalla Hills National Park (MHNP)\n"
        "Margalla Hills National Park, established in 1980, spans over 17,000 hectares and is located near Islamabad's northern boundary with Haripur District, Khyber Pakhtunkhwa. "
        "The park includes the Margalla Hills, which form the foothills of the Himalayas, along with Shakarparian Park and Rawal Lake. It is the third-largest national park in Pakistan, with an area of 17,386 hectares.\n\n"

        "MHNP is renowned for its rich biodiversity, hosting over 600 plant species, 250 bird varieties, 38 mammal species, and 27 reptile species. "
        "Notable fauna include the Indian leopard, jungle cat, golden jackal, barking deer, gray goral, and the endangered Himalayan pangolin.\n\n"

        "🌊 Rawal Lake\n"
        "Rawal Lake is an artificial reservoir situated in Islamabad Capital Territory. It serves as a critical water source for the cities of Rawalpindi and Islamabad. "
        "The lake is surrounded by gardens, picnic spots, and secluded paths, making it a popular recreational area.\n\n"

        "The lake supports a diverse range of wildlife, including various species of birds, fish, and reptiles. It is particularly significant for migratory and wintering species.\n\n"

        "🌱 Flora of Islamabad\n"
        "Islamabad's flora is diverse, with species adapted to various habitats, from urban areas to the foothills of the Himalayas. Common tree species include:\n\n"
        "- Chir Pine (Pinus roxburghii)\n"
        "- Olive (Olea ferruginea)\n"
        "- Phulai (Senegalia modesta)\n"
        "- Celtis (Celtis australis)\n"
        "- Snatha (Dodonaea viscosa)\n\n"
        "Flowering trees such as Dhak (Butea frondosa), Punica (Punica granatum), and Kachnar (Bauhinia variegata) are also prevalent.\n\n"

        "🐾 Conservation Efforts\n"
        "Conservation initiatives in Islamabad focus on preserving the region's biodiversity through various strategies:\n\n"
        "- Invasive Species Management: Efforts are underway to remove invasive plant species like Paper Mulberry, Lantana, and Parthenium to protect native ecosystems.\n"
        "- Community Engagement: Programs aim to involve local communities in biodiversity conservation, fostering a sense of ownership and responsibility towards natural resources.\n"
        "- Monitoring and Research: Ongoing studies assess the health of ecosystems and the status of various species, guiding conservation actions.\n\n"
    )

    # Write all content to knowledge_base.txt
    with open(output_path, mode='w', encoding='utf-8') as f:
        f.write(biodiversity_intro + "\n")

        f.write("Common species observed:\n")
        f.write(", ".join(species_list) + ".\n\n")

        f.write("Popular observation locations:\n")
        f.write(", ".join(locations_list) + ".\n\n")

        f.write("Sample community observation notes:\n")
        for note in common_notes:
            f.write("- " + note + "\n")
        f.write("\n")


def main():
    obs = generate_observations_with_observer()
    print(f"Generated {OUTPUT_OBS_FILE} with {len(obs)} entries.")
    generate_knowledge_base(obs, OUTPUT_KB_FILE)
    print(f"Generated {OUTPUT_KB_FILE}.")

if __name__ == "__main__":
    main()
