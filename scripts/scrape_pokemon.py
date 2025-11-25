import asyncio
import aiohttp
import json
import os
import time

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'all-pokemon.json')

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
    region_name = "Unknown"
    if data:
        region_name = data.get('main_region', {}).get('name', 'Unknown').capitalize()
        for s in data['pokemon_species']:
            s['gen_id'] = gen_id
            species_list.append(s)
    return species_list, region_name

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

    # Download Sprite
    sprite_url = pokemon_data['sprites']['front_default']
    sprite_path = None
    if sprite_url:
        try:
            sprite_filename = f"{species_data['id']}.png"
            sprite_full_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'sprites', sprite_filename)
            
            # Ensure directory exists (redundant but safe)
            os.makedirs(os.path.dirname(sprite_full_path), exist_ok=True)

            async with session.get(sprite_url) as resp:
                if resp.status == 200:
                    with open(sprite_full_path, 'wb') as f:
                        f.write(await resp.read())
                    sprite_path = f"data/sprites/{sprite_filename}"
        except Exception as e:
            print(f"Error downloading sprite for {species_data['name']}: {e}")

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
        "description": description,
        "sprite": sprite_path
    }

async def main():
    async with aiohttp.ClientSession() as session:
        # 1. Get Generations
        gens = await get_generations(session)
        print(f"Found {len(gens)} generations.")

        # 2. Get Species List per Gen
        tasks = []
        gen_metadata = []
        for i, gen in enumerate(gens):
            # Gen ID is i+1 usually, or extract from url
            gen_id = int(gen['url'].split('/')[-2])
            tasks.append(get_species_from_gen(session, gen['url'], gen_id))
        
        results = await asyncio.gather(*tasks)
        all_species_entries = []
        
        for i, (res, region) in enumerate(results):
            all_species_entries.extend(res)
            gen_id = int(gens[i]['url'].split('/')[-2])
            gen_metadata.append({
                'id': gen_id,
                'region': region
            })
            
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

        # Save Pokemon
        print(f"Saving {len(final_pokemon)} pokemon to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_pokemon, f, indent=2)

        # Generate and Save Templates
        templates = []
        # Sort metadata by ID just in case
        gen_metadata.sort(key=lambda x: x['id'])
        
        for gen in gen_metadata:
            gen_id = gen['id']
            region = gen['region']
            
            # Get pokemon IDs for this gen
            pids = [p['id'] for p in final_pokemon if p['gen'] == gen_id]
            pids.sort()
            
            templates.append({
                "name": f"{region} (Gen {gen_id})",
                "description": f"All Pokémon introduced in the {region} region.",
                "pokemonIds": pids
            })
            
        # Add Empty
        templates.append({
            "name": "Empty",
            "description": "Start from scratch.",
            "pokemonIds": []
        })
        
        TEMPLATES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'templates.json')
        print(f"Saving templates to {TEMPLATES_FILE}...")
        with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
            json.dump(templates, f, indent=2)

        print("Done!")

if __name__ == "__main__":
    start_time = time.time()
    asyncio.run(main())
    print(f"Duration: {time.time() - start_time:.2f} seconds")
