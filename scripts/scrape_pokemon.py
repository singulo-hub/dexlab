import asyncio
import aiohttp
import json
import os
import time

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'pokemon.json')

async def fetch_url(session, url):
    try:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.json()
            else:
                print(f"Error fetching {url}: {response.status}")
                return None
    except Exception as e:
        print(f"Exception fetching {url}: {e}")
        return None

async def get_generations(session):
    print("Fetching generations...")
    url = "https://pokeapi.co/api/v2/generation/"
    data = await fetch_url(session, url)
    generations = []
    if data:
        generations.extend(data['results'])
        while data['next']:
            data = await fetch_url(session, data['next'])
            if data:
                generations.extend(data['results'])
    return generations

async def get_species_from_gen(session, gen_url, gen_id):
    data = await fetch_url(session, gen_url)
    species_list = []
    if data:
        for s in data['pokemon_species']:
            s['gen_id'] = gen_id
            species_list.append(s)
    return species_list

async def process_species(session, species_entry):
    url = species_entry['url']
    gen_id = species_entry['gen_id']
    
    species_data = await fetch_url(session, url)
    if not species_data:
        return None

    # Get English flavor text
    description = ""
    for entry in species_data.get('flavor_text_entries', []):
        if entry['language']['name'] == 'en':
            description = entry['flavor_text'].replace('\n', ' ').replace('\f', ' ')
            break
            
    # Get default variety
    default_variety = next((v for v in species_data['varieties'] if v['is_default']), species_data['varieties'][0])
    pokemon_url = default_variety['pokemon']['url']
    
    pokemon_data = await fetch_url(session, pokemon_url)
    if not pokemon_data:
        return None

    # Stats
    stats = {}
    stat_map = {
        'hp': 'hp',
        'attack': 'atk',
        'defense': 'def',
        'special-attack': 'spa',
        'special-defense': 'spd',
        'speed': 'spe'
    }
    bst = 0
    for s in pokemon_data['stats']:
        s_name = s['stat']['name']
        if s_name in stat_map:
            val = s['base_stat']
            stats[stat_map[s_name]] = val
            bst += val

    # Types
    types = [t['type']['name'].capitalize() for t in pokemon_data['types']]

    # Pseudo detection (Heuristic: BST >= 600, Not Legendary/Mythical, usually 3 stage but we skip that check)
    # Exclude Slaking (670) if we want, but for now simple heuristic
    is_legendary = species_data['is_legendary']
    is_mythical = species_data['is_mythical']
    is_pseudo = (bst >= 600) and (not is_legendary) and (not is_mythical) and (pokemon_data['name'] != 'slaking')

    return {
        "id": species_data['id'],
        "name": species_data['name'].capitalize(),
        "types": types,
        "stats": stats,
        "bst": bst,
        "gen": gen_id,
        "height": pokemon_data['height'] / 10, # dm to m
        "weight": pokemon_data['weight'] / 10, # hg to kg
        "isLegendary": is_legendary or is_mythical,
        "isPseudo": is_pseudo,
        "description": description
    }

async def main():
    async with aiohttp.ClientSession() as session:
        # 1. Get Generations
        gens = await get_generations(session)
        print(f"Found {len(gens)} generations.")

        # 2. Get Species List per Gen
        tasks = []
        for i, gen in enumerate(gens):
            # Gen ID is i+1 usually, or extract from url
            gen_id = int(gen['url'].split('/')[-2])
            tasks.append(get_species_from_gen(session, gen['url'], gen_id))
        
        results = await asyncio.gather(*tasks)
        all_species_entries = []
        for res in results:
            all_species_entries.extend(res)
            
        print(f"Found {len(all_species_entries)} species total.")
        
        # 3. Process Species (in chunks to avoid rate limits/overload)
        final_pokemon = []
        chunk_size = 50
        for i in range(0, len(all_species_entries), chunk_size):
            chunk = all_species_entries[i:i+chunk_size]
            print(f"Processing chunk {i} to {i+len(chunk)}...")
            tasks = [process_species(session, s) for s in chunk]
            chunk_results = await asyncio.gather(*tasks)
            final_pokemon.extend([r for r in chunk_results if r])
            # Small sleep to be nice to API
            await asyncio.sleep(0.5)

        # Sort by ID
        final_pokemon.sort(key=lambda x: x['id'])

        # Save
        print(f"Saving {len(final_pokemon)} pokemon to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_pokemon, f, indent=2)
        print("Done!")

if __name__ == "__main__":
    start_time = time.time()
    asyncio.run(main())
    print(f"Duration: {time.time() - start_time:.2f} seconds")
